import EnvironmentDetector from "../../../environment/detector/environmentDetector.js";
import EnvironmentConfigManager from "../../../environment/manager/handlers/environmentConfigManager.js";
import SecretKeyRotationManager from "../../rotation/manager/secretKeyRotationManager.js";
import SecretMetadataManager from "../../rotation/manager/secretMetadataManager.js";
import RotationHistoryManager from "./rotationHistoryManager.js";
import SystemInfo from "../../../shared/systemInfo.js";
import type { RotationOptions, RotationResult } from "../../rotation/types/rotation.types.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export default class RotationExecutor {
  /**
   * Performs complete key rotation with decryption and re-encryption.
   */
  public static async rotateKeyWithReEncryption(
    options: RotationOptions = {},
  ): Promise<RotationResult> {
    const startTime = Date.now();
    const {
      rotationReason = "scheduled",
      rotationDays = 90,
      performedBy = SystemInfo.getCurrentUsername(),
      forceRotation = false,
      dryRun = false,
    } = options;

    const currentEnvKey = EnvironmentConfigManager.getCurrentEnvSecretKey();
    const currentEnv = EnvironmentDetector.getCurrentEnvironmentStage();
    const filePath = EnvironmentConfigManager.getCurrentEnvFilePath();

    logger.info(`${dryRun ? "[DRY RUN] " : ""}Starting key rotation for "${currentEnvKey}"...`);

    try {
      // Step 1: Validate rotation is needed
      await SecretKeyRotationManager.Validator.validateRotationNecessary(
        currentEnvKey,
        forceRotation,
      );

      // Step 2: Get old key before rotation
      const oldKey = await SecretKeyRotationManager.Secret.getOldSecretKey(currentEnvKey);
      const oldKeyHash = SecretKeyRotationManager.Secret.hashKey(oldKey);

      // Step 3: Decrypt all encrypted variables with old key
      const decryptedVariables =
        await SecretKeyRotationManager.Crypto.decryptAllEnvironmentVariables(
          filePath,
          currentEnvKey,
          oldKey,
        );

      if (dryRun) {
        logger.info(
          `[DRY RUN] Would decrypt and re-encrypt ${decryptedVariables.filter((v) => v.wasEncrypted).length} variables`,
        );
        return SecretKeyRotationManager.Validator.createDryRunResult(
          currentEnvKey,
          currentEnv,
          decryptedVariables,
          startTime,
        );
      }

      // Step 4: Generate new key
      const newKey = await SecretKeyRotationManager.Secret.generateNewSecretKey();
      const newKeyHash = SecretKeyRotationManager.Secret.hashKey(newKey);

      // Step 5: Store new key
      await SecretKeyRotationManager.Secret.storeNewSecretKey(currentEnvKey, newKey);

      // Step 6: Re-encrypt all variables with new key
      const { variablesProcessed, variablesFailed } =
        await SecretKeyRotationManager.Crypto.reEncryptAllVariables(
          filePath,
          decryptedVariables,
          currentEnvKey,
          newKey,
        );

      // Step 7: Update tracking metadata
      await RotationHistoryManager.updateRotationTracking(
        currentEnvKey,
        currentEnv,
        oldKeyHash,
        newKeyHash,
        rotationReason,
        rotationDays,
        performedBy,
        true,
      );

      const duration = Date.now() - startTime;

      logger.info(
        `Key rotation completed successfully for "${currentEnvKey}" ` +
          `(${variablesProcessed} variables re-encrypted in ${duration}ms)`,
      );

      return {
        success: true,
        keyName: currentEnvKey,
        environment: currentEnv,
        variablesProcessed,
        variablesFailed,
        oldKeyHash,
        newKeyHash,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed rotation
      await RotationHistoryManager.updateRotationTracking(
        currentEnvKey,
        currentEnv,
        undefined,
        undefined,
        rotationReason,
        rotationDays,
        performedBy,
        false,
      );

      ErrorHandler.captureError(
        error,
        "rotateKeyWithReEncryption",
        `Failed to rotate key "${currentEnvKey}"`,
      );

      return {
        success: false,
        keyName: currentEnvKey,
        environment: currentEnv,
        variablesProcessed: 0,
        variablesFailed: [],
        duration,
      };
    }
  }

  /**
   * Rotates all expired keys across all environments.
   */
  public static async rotateAllExpiredKeys(
    options: {
      performedBy?: string;
      dryRun?: boolean;
    } = {},
  ): Promise<RotationResult[]> {
    try {
      const { performedBy = SystemInfo.getCurrentUsername(), dryRun = false } = options;

      logger.info(`${dryRun ? "[DRY RUN] " : ""}Checking for expired keys...`);

      const expiredKeys = await SecretMetadataManager.getKeysNeedingRotation();

      if (expiredKeys.length === 0) {
        logger.info("No expired keys found.");
        return [];
      }

      logger.warn(`Found ${expiredKeys.length} expired key(s) that need rotation`);

      const results: RotationResult[] = [];

      for (const keyMetadata of expiredKeys) {
        logger.info(`Processing expired key: ${keyMetadata.keyName} (${keyMetadata.environment})`);

        const result = await this.rotateKeyWithReEncryption({
          rotationReason: "expired",
          performedBy,
          forceRotation: true,
          dryRun,
        });

        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      logger.info(
        `${dryRun ? "[DRY RUN] " : ""}Batch rotation complete: ${successCount}/${results.length} successful`,
      );

      return results;
    } catch (error) {
      ErrorHandler.captureError(error, "rotateAllExpiredKeys", "Failed to rotate expired keys");
      throw error;
    }
  }
}

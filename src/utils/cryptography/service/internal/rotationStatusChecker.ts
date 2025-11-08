import EnvironmentConfigManager from "../../../environment/manager/handlers/environmentConfigManager.js";
import SecretKeyRotationManager from "../../rotation/manager/secretKeyRotationManager.js";
import SecretMetadataManager from "../../rotation/manager/secretMetadataManager.js";
import SecretAuditManager from "../../rotation/manager/secretAuditManager.js";
import type { RotationStatusResult } from "../../rotation/types/rotation.types.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";

export default class RotationStatusChecker {
  /**
   * Checks if key rotation is needed and returns recommendation.
   */
  public static async checkRotationStatus(): Promise<RotationStatusResult> {
    try {
      const currentEnvKey = EnvironmentConfigManager.getCurrentEnvSecretKey();
      const filePath = EnvironmentConfigManager.getCurrentEnvFilePath();

      // Check expiration status
      const rotationStatus = await SecretMetadataManager.checkKeyRotationStatus(currentEnvKey);
      const metadata = await SecretMetadataManager.getKeyMetadata(currentEnvKey);

      // Count encrypted variables
      const encryptedCount =
        await SecretKeyRotationManager.Crypto.countEncryptedVariables(filePath);

      let recommendation = "";
      if (rotationStatus.needsRotation) {
        recommendation = `🔴 URGENT: Key expired ${Math.abs(rotationStatus.daysUntilExpiration)} days ago. Rotate immediately.`;
      } else if (rotationStatus.status === "expiring_soon") {
        recommendation = `🟡 WARNING: Key expires in ${rotationStatus.daysUntilExpiration} days. Plan rotation soon.`;
      } else {
        recommendation = `🟢 OK: Key is valid for ${rotationStatus.daysUntilExpiration} more days.`;
      }

      return {
        needsRotation: rotationStatus.needsRotation,
        recommendation,
        details: {
          daysUntilExpiration: rotationStatus.daysUntilExpiration,
          status: rotationStatus.status,
          encryptedVariableCount: encryptedCount,
          metadata: metadata
            ? {
                createdAt: metadata.createdAt,
                rotationCount: metadata.rotationCount,
                lastRotatedAt: metadata.lastRotatedAt,
              }
            : undefined,
        },
      };
    } catch (error) {
      ErrorHandler.captureError(error, "checkRotationStatus", "Failed to check rotation status");
      throw error;
    }
  }

  /**
   * Checks all tracked keys and reports their rotation status.
   */
  public static async auditAllSecretKeys(): Promise<void> {
    try {
      await SecretAuditManager.auditAllSecretKeys();
    } catch (error) {
      ErrorHandler.captureError(error, "auditAllSecretKeys", "Failed to audit secret keys");
      throw error;
    }
  }
}

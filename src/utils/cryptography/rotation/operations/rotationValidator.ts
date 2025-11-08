import SecretMetadataManager from "../manager/secretMetadataManager.js";
import type { RotationResult } from "../types/rotation.types.js";
import type { DecryptedVariable } from "../types/decryptedVariable.types.js";
import logger from "../../../logger/loggerManager.js";

export default class RotationValidator {
  /**
   * Creates dry run result without performing actual rotation.
   */
  public static createDryRunResult(
    keyName: string,
    environment: string,
    decryptedVariables: DecryptedVariable[],
    startTime: number,
  ): RotationResult {
    const encryptedCount = decryptedVariables.filter((v) => v.wasEncrypted).length;

    return {
      success: true,
      keyName,
      environment,
      variablesProcessed: encryptedCount,
      variablesFailed: [],
      duration: Date.now() - startTime,
    };
  }

  /**
   * Validates that rotation is necessary or forced.
   */
  public static async validateRotationNecessary(keyName: string, force: boolean): Promise<void> {
    if (force) {
      logger.info("Force rotation enabled - skipping validation");
      return;
    }

    const rotationStatus = await SecretMetadataManager.checkKeyRotationStatus(keyName);

    if (!rotationStatus.needsRotation && rotationStatus.status === "active") {
      const daysRemaining = rotationStatus.daysUntilExpiration;
      throw new Error(
        `Key "${keyName}" does not need rotation yet (${daysRemaining} days remaining). ` +
          `Use forceRotation: true to rotate anyway.`,
      );
    }
  }
}

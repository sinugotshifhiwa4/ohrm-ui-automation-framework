import SecretFileManager from "../../rotation/manager/secretFileManager.js";
import EnvironmentConfigManager from "../../../environment/manager/handlers/environmentConfigManager.js";
import SecretMetadataManager from "../../rotation/manager/secretMetadataManager.js";
import SystemInfo from "../../../shared/systemInfo.js";
import CryptoConstants from "../../rotation/types/cryptoConstants.js";
import type {
  SecretKeyRotationEntry,
  SecretKeyRotationFile,
  RotationHistoryEntry,
} from "../../rotation/types/rotation.types.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export default class RotationHistoryManager {
  /**
   * Gets rotation history for the current secret key.
   */
  public static async getRotationHistory(limit: number = 10): Promise<RotationHistoryEntry[]> {
    try {
      const currentEnvKey = EnvironmentConfigManager.getCurrentEnvSecretKey();
      const history = await this.getKeyRotationHistory(currentEnvKey, limit);

      return history.map((entry) => ({
        keyName: entry.keyName,
        rotationDate: entry.rotationDate,
        rotationReason: entry.rotationReason,
        performedBy: entry.performedBy,
        success: entry.success,
      }));
    } catch (error) {
      ErrorHandler.captureError(error, "getRotationHistory", "Failed to get rotation history");
      throw error;
    }
  }

  /**
   * Gets rotation history for a specific key.
   */
  public static async getKeyRotationHistory(
    keyName: string,
    limit?: number,
  ): Promise<SecretKeyRotationEntry[]> {
    try {
      const rotationFile = await this.loadRotationHistory();
      const keyRotations = rotationFile.rotations.filter((r) => r.keyName === keyName);

      return limit ? keyRotations.slice(0, limit) : keyRotations;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "getKeyRotationHistory",
        `Failed to get rotation history for key "${keyName}"`,
      );
      return [];
    }
  }

  /**
   * Records a key rotation event in the rotation history.
   */
  public static async recordRotation(
    keyName: string,
    environment: string,
    options: {
      rotationReason?: "scheduled" | "manual" | "compromised" | "expired";
      previousKeyHash?: string;
      newKeyHash?: string;
      performedBy?: string;
      success?: boolean;
    } = {},
  ): Promise<void> {
    try {
      const {
        rotationReason = "scheduled",
        previousKeyHash,
        newKeyHash,
        performedBy = SystemInfo.getCurrentUsername(),
        success = true,
      } = options;

      const rotationFile = await this.loadRotationHistory();
      const now = new Date().toISOString();

      const rotationEntry: SecretKeyRotationEntry = {
        keyName,
        environment,
        rotationDate: now,
        previousKeyHash,
        newKeyHash,
        rotationReason,
        performedBy,
        success,
      };

      rotationFile.rotations.unshift(rotationEntry);
      rotationFile.lastRotation = now;

      await this.saveRotationHistory(rotationFile);

      logger.info(
        `Rotation recorded for key "${keyName}" - Reason: ${rotationReason}, Success: ${success}`,
      );
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "recordRotation",
        `Failed to record rotation for key "${keyName}"`,
      );
      throw error;
    }
  }

  /**
   * Updates rotation tracking metadata.
   */
  public static async updateRotationTracking(
    keyName: string,
    environment: string,
    oldKeyHash: string | undefined,
    newKeyHash: string | undefined,
    rotationReason: "scheduled" | "manual" | "compromised" | "expired",
    rotationDays: number,
    performedBy: string,
    success: boolean,
  ): Promise<void> {
    try {
      await SecretMetadataManager.trackSecretKey(keyName, environment, {
        rotationDays,
        isRotation: true,
        algorithm: "base64",
        keyLength: 256,
        performedBy,
      });

      await this.recordRotation(keyName, environment, {
        rotationReason,
        ...(oldKeyHash !== undefined && { previousKeyHash: oldKeyHash }),
        ...(newKeyHash !== undefined && { newKeyHash }),
        performedBy,
        success,
      });

      logger.debug(`Rotation tracking updated for "${keyName}"`);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "updateRotationTracking",
        "Failed to update rotation tracking",
      );
      // Don't throw - tracking failure shouldn't break the rotation
    }
  }

  // ==================== PRIVATE FILE OPERATIONS ====================

  private static async loadRotationHistory(): Promise<SecretKeyRotationFile> {
    const filePath = SecretFileManager.getFilePath(CryptoConstants.ROTATION_FILE);
    return SecretFileManager.loadJsonFile<SecretKeyRotationFile>(filePath, {
      rotations: [],
      lastRotation: new Date().toISOString(),
    });
  }

  private static async saveRotationHistory(data: SecretKeyRotationFile): Promise<void> {
    const filePath = SecretFileManager.getFilePath(CryptoConstants.ROTATION_FILE);
    await SecretFileManager.saveJsonFile(filePath, data);
  }
}

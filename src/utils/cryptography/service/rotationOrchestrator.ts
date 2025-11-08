import RotationExecutor from "./internal/rotationExecutor.js";
import RotationHistoryManager from "./internal/rotationHistoryManager.js";
import RotationStatusChecker from "./internal/rotationStatusChecker.js";
import type {
  RotationOptions,
  RotationResult,
  SecretKeyRotationEntry,
  RotationHistoryEntry,
  RotationStatusResult,
} from "../rotation/types/rotation.types.js";

export default class RotationOrchestrator {
  /**
   * Performs complete key rotation with decryption and re-encryption.
   */
  public static async rotateKeyWithReEncryption(
    options: RotationOptions = {},
  ): Promise<RotationResult> {
    return RotationExecutor.rotateKeyWithReEncryption(options);
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
    return RotationExecutor.rotateAllExpiredKeys(options);
  }

  /**
   * Checks if key rotation is needed and returns recommendation.
   */
  public static async checkRotationStatus(): Promise<RotationStatusResult> {
    return RotationStatusChecker.checkRotationStatus();
  }

  /**
   * Checks all tracked keys and reports their rotation status.
   */
  public static async auditAllSecretKeys(): Promise<void> {
    return RotationStatusChecker.auditAllSecretKeys();
  }

  /**
   * Gets rotation history for the current secret key.
   */
  public static async getRotationHistory(limit: number = 10): Promise<RotationHistoryEntry[]> {
    return RotationHistoryManager.getRotationHistory(limit);
  }

  /**
   * Gets rotation history for a specific key.
   */
  public static async getKeyRotationHistory(
    keyName: string,
    limit?: number,
  ): Promise<SecretKeyRotationEntry[]> {
    return RotationHistoryManager.getKeyRotationHistory(keyName, limit);
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
    return RotationHistoryManager.recordRotation(keyName, environment, options);
  }
}

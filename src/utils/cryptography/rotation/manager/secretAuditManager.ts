import SecretMetadataManager from "./secretMetadataManager.js";
import KeyExpirationCalculator from "../utils/keyExpirationCalculator.js";
import SecretFileManager from "./secretFileManager.js";
import TimestampFormatter from "../../../shared/timestampFormatter.js";
import CryptoConstants from "../types/cryptoConstants.js";
import type { AuditLogEntry, AuditLogFile } from "../types/audit.types.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export default class SecretAuditManager {
  /**
   * Logs an audit entry.
   */
  public static async logAudit(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    try {
      const auditFile = await this.loadAuditLog();
      const now = TimestampFormatter.getUTCTimestamp();

      const auditEntry: AuditLogEntry = {
        timestamp: now,
        ...entry,
      };

      auditFile.logs.unshift(auditEntry); // Add to beginning
      auditFile.totalEntries++;
      auditFile.lastAudit = now;

      // Keep only last 10000 entries to prevent file bloat
      if (auditFile.logs.length > 10000) {
        auditFile.logs = auditFile.logs.slice(0, 10000);
      }

      await this.saveAuditLog(auditFile);
    } catch (error) {
      ErrorHandler.captureError(error, "logAudit", "Failed to log audit");
      // Don't throw on audit log failures to prevent blocking operations
    }
  }

  /**
   * Checks all tracked keys and reports their rotation status.
   */
  public static async auditAllSecretKeys(): Promise<void> {
    try {
      logger.info("=== SECRET KEY ROTATION AUDIT ===");

      const keysNeedingRotation = await SecretMetadataManager.getKeysNeedingRotation();
      const keysExpiringSoon = await SecretMetadataManager.getKeysExpiringSoon();
      const allKeys = await SecretMetadataManager.getAllTrackedKeys();

      if (keysNeedingRotation.length > 0) {
        logger.warn(`\n🔴 EXPIRED KEYS (${keysNeedingRotation.length}):`);
        for (const key of keysNeedingRotation) {
          const daysExpired = Math.abs(
            KeyExpirationCalculator.calculateDaysUntilExpiration(key.expiresAt),
          );
          logger.warn(`  - ${key.keyName} (${key.environment}): EXPIRED ${daysExpired} days ago`);
        }
      }

      if (keysExpiringSoon.length > 0) {
        logger.info(`\n🟡 EXPIRING SOON (${keysExpiringSoon.length}):`);
        for (const key of keysExpiringSoon) {
          const daysRemaining = KeyExpirationCalculator.calculateDaysUntilExpiration(key.expiresAt);
          logger.info(`  - ${key.keyName} (${key.environment}): ${daysRemaining} days remaining`);
        }
      }

      const activeKeys = allKeys.filter((k) => k.status === "active");
      if (activeKeys.length > 0) {
        logger.info(`\n🟢 ACTIVE KEYS (${activeKeys.length}):`);
        for (const key of activeKeys) {
          const daysRemaining = KeyExpirationCalculator.calculateDaysUntilExpiration(key.expiresAt);
          logger.info(
            `  - ${key.keyName} (${key.environment}): ${daysRemaining} days remaining ` +
              `(Rotated ${key.rotationCount} time(s))`,
          );
        }
      }

      if (allKeys.length === 0) {
        logger.info("\nNo secret keys are currently tracked.");
      } else {
        logger.info(`\nTotal tracked keys: ${allKeys.length}`);
      }
    } catch (error) {
      ErrorHandler.captureError(error, "auditAllSecretKeys", "Failed to audit secret keys");
      throw error;
    }
  }

  /**
   * Gets recent audit logs.
   */
  public static async getAuditLogs(
    limit?: number,
    filters?: { action?: string; keyName?: string; status?: string },
  ): Promise<AuditLogEntry[]> {
    try {
      const auditFile = await this.loadAuditLog();
      let logs = auditFile.logs;

      // Apply filters
      if (filters) {
        if (filters.action) {
          logs = logs.filter((log) => log.action === filters.action);
        }
        if (filters.keyName) {
          logs = logs.filter((log) => log.keyName === filters.keyName);
        }
        if (filters.status) {
          logs = logs.filter((log) => log.status === filters.status);
        }
      }

      return limit ? logs.slice(0, limit) : logs;
    } catch (error) {
      ErrorHandler.captureError(error, "getAuditLogs", "Failed to get audit logs");
      return [];
    }
  }

  private static async loadAuditLog(): Promise<AuditLogFile> {
    const filePath = SecretFileManager.getFilePath(CryptoConstants.AUDIT_FILE);
    return SecretFileManager.loadJsonFile<AuditLogFile>(filePath, {
      logs: [],
      totalEntries: 0,
      lastAudit: new Date().toISOString(),
    });
  }

  private static async saveAuditLog(data: AuditLogFile): Promise<void> {
    const filePath = SecretFileManager.getFilePath(CryptoConstants.AUDIT_FILE);
    await SecretFileManager.saveJsonFile(filePath, data);
  }
}

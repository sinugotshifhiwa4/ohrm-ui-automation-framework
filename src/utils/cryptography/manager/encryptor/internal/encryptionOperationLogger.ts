import { SyncFileManager } from "../../../../fileManager/syncFileManager.js";
import ErrorHandler from "../../../../errorHandling/errorHandler.js";
import logger from "../../../../logger/loggerManager.js";

export class EncryptionOperationLogger {
  public async logOperationSummary(
    filePath: string,
    variablesToEncrypt: Record<string, string>,
    encryptedCount: number,
  ): Promise<void> {
    try {
      const totalVariables = Object.keys(variablesToEncrypt).length;
      const skippedCount = totalVariables - encryptedCount;

      if (encryptedCount === 0) {
        logger.info(`No variables needed encryption in ${filePath}`);
        return;
      }

      const fileName = SyncFileManager.getBaseNameWithExtension(filePath);
      const summary = `Encryption completed. ${encryptedCount} variables processed from '${fileName}'`;
      const details = skippedCount > 0 ? `, ${skippedCount} skipped` : "";

      logger.info(`${summary}${details}`);
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "logOperationSummary",
        `Failed to log encryption summary for ${filePath}`,
      );
      throw error;
    }
  }
}

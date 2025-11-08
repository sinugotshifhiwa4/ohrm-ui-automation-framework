import crypto from "crypto";
import SecureKeyGenerator from "../../key/secureKeyGenerator.js";
import SecretFilePathResolver from "../../../environment/manager/resolvers/secretFilePathResolver.js";
import SecretFileManager from "../../../environment/manager/handlers/secretFileManager.js";

import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export default class SecretKeyOperations {
  /**
   * Generates a new secret key.
   */
  public static async generateNewSecretKey(): Promise<string> {
    try {
      return SecureKeyGenerator.generateBase64SecretKey();
    } catch (error) {
      ErrorHandler.captureError(error, "generateNewSecretKey", "Failed to generate new secret key");
      throw error;
    }
  }

  /**
   * Retrieves the current/old secret key before rotation.
   */
  public static async getOldSecretKey(keyName: string): Promise<string> {
    try {
      const secretFilePath = SecretFilePathResolver.getSecretFilePath();
      const oldKey = await SecretFileManager.getKeyValue(secretFilePath, keyName);

      if (!oldKey) {
        throw new Error(`Secret key "${keyName}" not found in secret file`);
      }

      logger.debug(`Retrieved old key for "${keyName}"`);
      return oldKey;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "getOldSecretKey",
        `Failed to retrieve old key "${keyName}"`,
      );
      throw error;
    }
  }

  /**
   * Stores the newly generated secret key.
   */
  public static async storeNewSecretKey(keyName: string, newKey: string): Promise<void> {
    try {
      const secretFilePath = SecretFilePathResolver.getSecretFilePath();

      await SecretFileManager.storeKeyInFile(secretFilePath, keyName, newKey, {
        skipIfExists: false, // Force overwrite
      });

      await SecretFileManager.ensureSecretKeyExists(keyName);

      logger.info(`New key stored successfully for "${keyName}"`);
    } catch (error) {
      ErrorHandler.captureError(error, "storeNewSecretKey", `Failed to store new key "${keyName}"`);
      throw error;
    }
  }

  /**
   * Creates SHA-256 hash of a key for audit purposes.
   */
  public static hashKey(key: string): string {
    try {
      return crypto.createHash("sha256").update(key, "utf8").digest("hex").substring(0, 16);
    } catch (error) {
      ErrorHandler.captureError(error, "hashKey", "Failed to hash key for audit purposes");
      throw error;
    }
  }
}

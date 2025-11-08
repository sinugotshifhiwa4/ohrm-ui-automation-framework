import CryptoEngineFacade from "../../engine/cryptoEngineFacade.js";
import StagesFileManager from "../../../environment/manager/handlers/stagesFileManager.js";
import type { DecryptedVariable } from "../types/decryptedVariable.types.js";
import { FileEncoding } from "../../../fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export default class CryptoOperations {
  private static textDecoder = new TextDecoder(FileEncoding.UTF8);

  /**
   * Decrypts all encrypted environment variables using the old key.
   */
  public static async decryptAllEnvironmentVariables(
    filePath: string,
    keyName: string,
    oldKey: string,
  ): Promise<DecryptedVariable[]> {
    try {
      logger.info(`Decrypting variables from "${filePath}" with old key...`);

      const envFileLines = await StagesFileManager.readEnvironmentFileAsLines(filePath);
      const allVariables = StagesFileManager.extractEnvironmentVariables(envFileLines);

      const decryptedVariables: DecryptedVariable[] = [];
      const encryptedVars: string[] = [];
      const failedVars: string[] = [];

      for (const [key, value] of Object.entries(allVariables)) {
        const trimmedValue = value.trim();

        if (!trimmedValue || !CryptoEngineFacade.Validation.isEncrypted(trimmedValue)) {
          // Not encrypted - keep as is
          decryptedVariables.push({
            key,
            originalValue: value,
            decryptedValue: value,
            wasEncrypted: false,
          });
          continue;
        }

        try {
          encryptedVars.push(key);
          const decryptedValue = await this.decryptWithKey(trimmedValue, oldKey);

          decryptedVariables.push({
            key,
            originalValue: value,
            decryptedValue,
            wasEncrypted: true,
          });

          logger.debug(`✓ Decrypted: ${key}`);
        } catch (decryptError) {
          failedVars.push(key);
          logger.error(`Failed to decrypt "${key}": ${decryptError}`);
          throw new Error(`Failed to decrypt variable "${key}". Cannot proceed with rotation.`);
        }
      }

      logger.info(
        `Decryption complete: ${encryptedVars.length} encrypted variables processed, ` +
          `${failedVars.length} failed`,
      );

      if (failedVars.length > 0) {
        throw new Error(
          `Failed to decrypt ${failedVars.length} variable(s): ${failedVars.join(", ")}`,
        );
      }

      return decryptedVariables;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "decryptAllEnvironmentVariables",
        "Failed to decrypt environment variables",
      );
      throw error;
    }
  }

  /**
   * Re-encrypts all variables with the new key and updates the file.
   */
  public static async reEncryptAllVariables(
    filePath: string,
    decryptedVariables: DecryptedVariable[],
    keyName: string,
    newKey: string,
  ): Promise<{ variablesProcessed: number; variablesFailed: string[] }> {
    try {
      logger.info(`Re-encrypting variables with new key...`);

      const variablesToEncrypt = decryptedVariables.filter((v) => v.wasEncrypted);
      const encryptedVariables: Record<string, string> = {};
      const failedVariables: string[] = [];

      for (const variable of variablesToEncrypt) {
        try {
          const encryptedValue = await this.encryptWithKey(variable.decryptedValue, newKey);

          encryptedVariables[variable.key] = encryptedValue;
          logger.debug(`Re-encrypted: ${variable.key}`);
        } catch (encryptError) {
          failedVariables.push(variable.key);
          logger.error(`✗ Failed to re-encrypt "${variable.key}": ${encryptError}`);
        }
      }

      if (failedVariables.length > 0) {
        throw new Error(
          `Failed to re-encrypt ${failedVariables.length} variable(s): ${failedVariables.join(", ")}`,
        );
      }

      // Update all re-encrypted variables in the file
      const envFileLines = await StagesFileManager.readEnvironmentFileAsLines(filePath);
      const updatedLines = StagesFileManager.updateMultipleEnvironmentVariables(
        envFileLines,
        encryptedVariables,
      );

      await StagesFileManager.writeEnvironmentFileLines(filePath, updatedLines);

      logger.info(
        `Re-encryption complete: ${Object.keys(encryptedVariables).length} variables processed`,
      );

      return {
        variablesProcessed: Object.keys(encryptedVariables).length,
        variablesFailed: failedVariables,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "reEncryptAllVariables", "Failed to re-encrypt variables");
      throw error;
    }
  }

  /**
   * Encrypts a value using a provided key (bypasses environment lookup).
   */
  public static async encryptWithKey(value: string, secretKey: string): Promise<string> {
    try {
      CryptoEngineFacade.Validation.validateSecretKey(secretKey);
      CryptoEngineFacade.Validation.validateInputs(value, secretKey, "encrypt");

      const { salt, iv, encryptionKey, hmacKey } =
        await CryptoEngineFacade.Encryption.generateEncryptionComponents(secretKey);

      const { raw } = await CryptoEngineFacade.Encryption.createEncryptedPayload(
        value,
        salt,
        iv,
        encryptionKey,
        hmacKey,
      );

      return raw;
    } catch (error) {
      ErrorHandler.captureError(error, "encryptWithKey", "Failed to encrypt with provided key");
      throw error;
    }
  }

  /**
   * Decrypts a value using a provided key (bypasses environment lookup).
   */
  public static async decryptWithKey(encryptedData: string, secretKey: string): Promise<string> {
    try {
      CryptoEngineFacade.Validation.validateSecretKey(secretKey);
      CryptoEngineFacade.Validation.validateInputs(encryptedData, secretKey, "decrypt");

      const { salt, iv, cipherText, receivedHmac } =
        CryptoEngineFacade.Decryption.parseEncryptedData(encryptedData);
      const { encryptionKey, hmacKey } = await CryptoEngineFacade.Argon2.deriveKeysWithArgon2(
        secretKey,
        salt,
      );

      await CryptoEngineFacade.HMAC.verifyHMACIntegrity(
        salt,
        iv,
        cipherText,
        receivedHmac,
        hmacKey,
      );

      const decryptedBuffer = await CryptoEngineFacade.Decryption.performDecryption(
        iv,
        encryptionKey,
        cipherText,
      );

      return CryptoOperations.textDecoder.decode(new Uint8Array(decryptedBuffer));
    } catch (error) {
      ErrorHandler.captureError(error, "decryptWithKey", "Failed to decrypt with provided key");
      throw error;
    }
  }

  /**
   * Counts encrypted variables in the environment file.
   */
  public static async countEncryptedVariables(filePath: string): Promise<number> {
    try {
      const envFileLines = await StagesFileManager.readEnvironmentFileAsLines(filePath);
      const allVariables = StagesFileManager.extractEnvironmentVariables(envFileLines);

      return Object.values(allVariables).filter((value) =>
        CryptoEngineFacade.Validation.isEncrypted(value.trim()),
      ).length;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "countEncryptedVariables",
        "Failed to count encrypted variables",
      );
      return 0;
    }
  }
}

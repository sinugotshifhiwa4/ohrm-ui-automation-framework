import { CryptoService } from "../../../service/cryptoService.js";
import StagesFileManager from "../../../../environment/manager/handlers/stagesFileManager.js";
import EncryptionUtils from "./encryptionUtils.js";
import type { EncryptionExecutionResult } from "../types/environmentFileEncryptor.type.js";
import ErrorHandler from "../../../../errorHandling/errorHandler.js";
import logger from "../../../../logger/loggerManager.js";

export class VariableEncryptionExecutor {
  public async encryptVariables(
    envFileLines: string[],
    variablesToEncrypt: Record<string, string>,
    secretKeyVariable: string,
  ): Promise<EncryptionExecutionResult> {
    try {
      const encryptedValues = await this.encryptAllValues(variablesToEncrypt, secretKeyVariable);
      const updatedLines = this.applyEncryptedValues(envFileLines, encryptedValues);

      return {
        updatedLines,
        encryptedCount: Object.keys(encryptedValues).length,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "encryptVariables", "Failed to encrypt variable values");
      throw error;
    }
  }

  private async encryptAllValues(
    variables: Record<string, string>,
    secretKeyVariable: string,
  ): Promise<Record<string, string>> {
    const encrypted: Record<string, string> = {};
    const failed: string[] = [];

    for (const [key, value] of Object.entries(variables)) {
      try {
        const trimmedValue = EncryptionUtils.trimSafely(value) || value;
        encrypted[key] = await CryptoService.encrypt(trimmedValue, secretKeyVariable);
        logger.debug(`Successfully encrypted variable: ${key}`);
      } catch (error) {
        failed.push(key);
        logger.error(`Failed to encrypt variable '${key}': ${error}`);
        throw error;
      }
    }

    EncryptionUtils.logIfNotEmpty(failed, (vars) =>
      logger.warn(`Failed to encrypt variables: ${vars.join(", ")}`),
    );

    return encrypted;
  }

  private applyEncryptedValues(
    fileLines: string[],
    encryptedValues: Record<string, string>,
  ): string[] {
    return StagesFileManager.updateMultipleEnvironmentVariables(fileLines, encryptedValues);
  }
}

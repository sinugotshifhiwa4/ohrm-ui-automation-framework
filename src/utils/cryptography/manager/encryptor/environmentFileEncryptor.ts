import EnvironmentDetector from "../../../environment/detector/environmentDetector.js";
import StagesFileManager from "../../../environment/manager/handlers/stagesFileManager.js";
import EnvironmentConfigManager from "../../../environment/manager/handlers/environmentConfigManager.js";
import EncryptionTrackerManager from "../../rotation/manager/encryptionTrackerManager.js";
import { EncryptionVariableResolver } from "./internal/encryptionVariableResolver.js";
import { VariableEncryptionExecutor } from "./internal/variableEncryptionExecutor.js";
import { EncryptionOperationLogger } from "./internal/encryptionOperationLogger.js";
import type { VariableResolutionResult } from "./types/environmentFileEncryptor.type.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";
import logger from "../../../logger/loggerManager.js";

export class EnvironmentFileEncryptor {
  private readonly variableResolver: EncryptionVariableResolver;
  private readonly encryptionExecutor: VariableEncryptionExecutor;
  private readonly encryptionLogger: EncryptionOperationLogger;

  constructor(
    variableResolver: EncryptionVariableResolver,
    encryptionExecutor: VariableEncryptionExecutor,
    encryptionLogger: EncryptionOperationLogger,
  ) {
    this.variableResolver = variableResolver;
    this.encryptionExecutor = encryptionExecutor;
    this.encryptionLogger = encryptionLogger;
  }

  public async encryptEnvironmentVariables(targetVariables?: string[]): Promise<void> {
    return this.wrapWithErrorHandling(
      async () => {
        const filePath = EnvironmentConfigManager.getCurrentEnvFilePath();
        const secretKey = EnvironmentConfigManager.getCurrentEnvSecretKey();
        await this.processEncryption(filePath, secretKey, targetVariables);
      },
      "encryptEnvironmentVariables",
      "Failed to encrypt environment variables",
    );
  }

  private async processEncryption(
    filePath: string,
    secretKeyVariable: string,
    targetVariables?: string[],
  ): Promise<void> {
    const startTime = Date.now();

    // Load and parse environment file
    const envFileLines = await StagesFileManager.readEnvironmentFileAsLines(filePath);
    const allVariables = StagesFileManager.extractEnvironmentVariables(envFileLines);

    if (Object.keys(allVariables).length === 0) {
      logger.warn(`No environment variables found in ${filePath}`);
      return;
    }

    // Resolve which variables to encrypt
    const resolutionResult = this.variableResolver.resolveEncryptableVariables(
      allVariables,
      targetVariables,
    );

    if (Object.keys(resolutionResult.toEncrypt).length === 0) {
      return;
    }

    // Execute encryption
    const executionResult = await this.encryptionExecutor.encryptVariables(
      envFileLines,
      resolutionResult.toEncrypt,
      secretKeyVariable,
    );

    // Persist changes
    if (executionResult.encryptedCount > 0) {
      await StagesFileManager.writeEnvironmentFileLines(filePath, executionResult.updatedLines);
    }

    // Track and log operation
    await this.trackEncryptionOperation(
      secretKeyVariable,
      resolutionResult,
      Date.now() - startTime,
    );

    await this.encryptionLogger.logOperationSummary(
      filePath,
      resolutionResult.toEncrypt,
      executionResult.encryptedCount,
    );
  }

  private async trackEncryptionOperation(
    secretKeyVariable: string,
    resolutionResult: VariableResolutionResult,
    durationMs: number,
  ): Promise<void> {
    const environment = EnvironmentDetector.getCurrentEnvironmentStage();

    await EncryptionTrackerManager.trackEncryption(secretKeyVariable, environment, {
      variablesEncrypted: Object.keys(resolutionResult.toEncrypt),
      alreadyEncrypted: resolutionResult.alreadyEncrypted,
      emptyVariables: resolutionResult.emptyValues,
      durationMs,
    });
  }

  private async wrapWithErrorHandling<T>(
    operation: () => Promise<T>,
    methodName: string,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      ErrorHandler.captureError(error, methodName, errorMessage);
      throw error;
    }
  }
}

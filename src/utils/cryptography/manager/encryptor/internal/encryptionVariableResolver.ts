import StagesFileManager from "../../../../environment/manager/handlers/stagesFileManager.js";
import EncryptionUtils from "./encryptionUtils.js";
import type { VariableResolutionResult } from "../types/environmentFileEncryptor.type.js";
import logger from "../../../../logger/loggerManager.js";

export class EncryptionVariableResolver {
  public resolveEncryptableVariables(
    allVariables: Record<string, string>,
    targetVariables?: string[],
  ): VariableResolutionResult {
    const candidates = this.selectCandidateVariables(allVariables, targetVariables);
    return this.categorizeVariables(candidates.variables, candidates.notFound);
  }

  private selectCandidateVariables(
    allVariables: Record<string, string>,
    targetVariables?: string[],
  ): { variables: Record<string, string>; notFound: string[] } {
    if (!targetVariables?.length) {
      return { variables: { ...allVariables }, notFound: [] };
    }

    return this.filterRequestedVariables(allVariables, targetVariables);
  }

  private filterRequestedVariables(
    allVariables: Record<string, string>,
    targetVariables: string[],
  ): { variables: Record<string, string>; notFound: string[] } {
    const variables: Record<string, string> = {};
    const notFound: string[] = [];

    for (const rawKey of targetVariables) {
      const key = EncryptionUtils.trimSafely(rawKey);
      if (!key) continue;

      const value = StagesFileManager.findEnvironmentVariableByKey(allVariables, key);

      if (value === undefined) {
        notFound.push(key);
      } else {
        variables[key] = value;
      }
    }

    if (notFound.length > 0) {
      logger.warn(`Environment variables not found: ${notFound.join(", ")}`);
    }

    return { variables, notFound };
  }

  private categorizeVariables(
    candidates: Record<string, string>,
    notFound: string[],
  ): VariableResolutionResult {
    const toEncrypt: Record<string, string> = {};
    const alreadyEncrypted: string[] = [];
    const emptyValues: string[] = [];

    for (const [key, value] of Object.entries(candidates)) {
      const trimmedValue = EncryptionUtils.trimSafely(value);

      if (!trimmedValue) {
        emptyValues.push(key);
        continue;
      }

      if (EncryptionUtils.isAlreadyEncrypted(trimmedValue)) {
        alreadyEncrypted.push(key);
        continue;
      }

      toEncrypt[key] = value;
    }

    this.logCategorizationResults(toEncrypt, alreadyEncrypted, emptyValues);

    return { toEncrypt, alreadyEncrypted, emptyValues, notFound };
  }

  private logCategorizationResults(
    toEncrypt: Record<string, string>,
    alreadyEncrypted: string[],
    emptyValues: string[],
  ): void {
    EncryptionUtils.logIfNotEmpty(alreadyEncrypted, (vars) =>
      logger.info(`Variables already encrypted — skipping: ${vars.join(", ")}`),
    );

    EncryptionUtils.logIfNotEmpty(emptyValues, (vars) =>
      logger.warn(`Variables with empty values — skipping: ${vars.join(", ")}`),
    );

    EncryptionUtils.logIfNotEmpty(Object.keys(toEncrypt), (vars) =>
      logger.info(`Variables ready for encryption: ${vars.join(", ")}`),
    );
  }
}

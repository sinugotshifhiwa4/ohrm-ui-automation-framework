// ErrorAnalyzer.ts
import DataSanitizer from "../../sanitization/dataSanitizer.js";
import { ErrorCacheManager } from "./errorCacheManager.js";
import type { ErrorDetails, MatcherResult, MatcherError } from "../type/error-handler.types.js";

export default class ErrorAnalyzer {
  private static readonly MESSAGE_PROPS = ["message"];

  public static createErrorDetails(error: unknown, source: string, context = ""): ErrorDetails {
    if (!error) {
      return this.createEmptyErrorDetails(source, context);
    }

    const message = this.getErrorMessage(error);
    const additionalDetails = this.isErrorObject(error) ? this.extractAllErrorDetails(error) : {};

    const details: ErrorDetails = {
      source,
      context,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || "dev",
      ...additionalDetails,
    };

    // Explicitly remove matcherResult if it somehow made it through
    delete details.matcherResult;

    return details;
  }

  public static getErrorMessage(error: unknown): string {
    if (!error) return "";

    if (error instanceof Error) {
      return ErrorCacheManager.getSanitizedMessage(error.message);
    }

    if (typeof error === "string") {
      return ErrorCacheManager.getSanitizedMessage(error);
    }

    if (this.isErrorObject(error)) {
      return this.handleObjectError(error);
    }

    return String(error);
  }

  private static extractAllErrorDetails(error: Record<string, unknown>): Record<string, unknown> {
    const details: Record<string, unknown> = {};

    // Extract stack trace
    const stack = this.getStackTrace(error);
    if (stack) details.stack = stack;

    // Extract error type/name
    const errorType = this.getErrorType(error);
    if (errorType) details.errorType = errorType;

    // Check for matcher error (Playwright/Jest) - extract fields but don't include raw matcherResult
    if (this.isMatcherError(error)) {
      Object.assign(details, this.extractMatcherDetails(error.matcherResult));
    }

    // Use DataSanitizer to get all other properties
    const sanitizedError = DataSanitizer.sanitizeErrorObject(error);

    // Skip these keys that we either already extracted or don't want
    const skipKeys = new Set(["name", "stack", "message", "constructor", "matcherResult"]);

    // Merge sanitized properties, avoiding duplicates and unwanted keys
    for (const [key, value] of Object.entries(sanitizedError)) {
      if (!skipKeys.has(key) && !(key in details) && value != null) {
        details[key] = value;
      }
    }

    return details;
  }

  private static getStackTrace(error: Record<string, unknown>): string | undefined {
    if ("stack" in error && typeof error.stack === "string") {
      const sanitized = ErrorCacheManager.getSanitizedMessage(error.stack);
      return sanitized.substring(0, 2000);
    }
    return undefined;
  }

  private static getErrorType(error: Record<string, unknown>): string | undefined {
    // Check if it's an Error instance
    if (error instanceof Error) {
      return error.constructor.name;
    }

    // Check for name property
    if ("name" in error && typeof error.name === "string" && error.name !== "Error") {
      return error.name;
    }

    return undefined;
  }

  private static extractMatcherDetails(matcher: MatcherResult): Record<string, unknown> {
    const details: Record<string, unknown> = {
      pass: matcher.pass,
      matcherName: matcher.name,
    };

    if (matcher.expected !== undefined) details.expected = matcher.expected;
    if (matcher.actual !== undefined) details.received = matcher.actual;
    else if (matcher.received !== undefined) details.received = matcher.received;

    // Include log if present (Playwright)
    if ("log" in matcher && Array.isArray(matcher.log)) {
      details.log = matcher.log;
    }

    return details;
  }

  private static isMatcherError(error: unknown): error is MatcherError {
    return (
      this.hasProperty(error, "matcherResult") && this.isValidMatcherResult(error.matcherResult)
    );
  }

  private static isValidMatcherResult(matcherResult: unknown): matcherResult is MatcherResult {
    return (
      typeof matcherResult === "object" &&
      matcherResult !== null &&
      this.hasProperty(matcherResult, "message") &&
      this.hasProperty(matcherResult, "pass") &&
      typeof matcherResult.message === "string" &&
      typeof matcherResult.pass === "boolean"
    );
  }

  private static hasProperty<T extends PropertyKey>(
    obj: unknown,
    prop: T,
  ): obj is Record<T, unknown> {
    return typeof obj === "object" && obj !== null && prop in obj;
  }

  private static createEmptyErrorDetails(source: string, context: string): ErrorDetails {
    return {
      source,
      context,
      message: "Unknown error",
      timestamp: new Date().toISOString(),
      environment: process.env.ENV || "dev",
    };
  }

  private static isErrorObject(error: unknown): error is Record<string, unknown> {
    return error !== null && typeof error === "object";
  }

  private static handleObjectError(error: Record<string, unknown>): string {
    // Try common message properties first
    for (const prop of this.MESSAGE_PROPS) {
      const value = error[prop];
      if (typeof value === "string" && value.trim()) {
        return ErrorCacheManager.getSanitizedMessage(value);
      }
    }

    return this.stringifyErrorObject(error);
  }

  private static stringifyErrorObject(errorObj: Record<string, unknown>): string {
    try {
      const stringified = JSON.stringify(errorObj);
      return stringified === "{}" ? "Empty object" : stringified;
    } catch {
      return "Object with circular references";
    }
  }
}

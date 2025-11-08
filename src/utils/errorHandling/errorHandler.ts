import type { ErrorDetails } from "./type/error-handler.types.js";
import ErrorAnalyzer from "./internals/errorAnalyzer.js";
import { ErrorCacheManager } from "./internals/errorCacheManager.js";
import logger from "../logger/loggerManager.js";

export default class ErrorHandler {
  public static captureError(error: unknown, source: string, context = ""): void {
    if (!error || !ErrorCacheManager.shouldLogError(error)) return;

    try {
      const details = ErrorAnalyzer.createErrorDetails(error, source, context);
      this.logStructuredError(details);
    } catch (loggingError) {
      this.handleLoggingFailure(loggingError, source);
    }
  }

  public static logAndThrow(source: string, message: string): never {
    const error = new Error(message);
    this.captureError(error, source);
    throw error;
  }

  public static clearErrorCache(): void {
    ErrorCacheManager.clearAll();
  }

  private static logStructuredError(details: ErrorDetails): void {
    try {
      logger.error(JSON.stringify(details, null, 2));
    } catch {
      console.error("Error:", details);
    }
  }

  private static handleLoggingFailure(loggingError: unknown, source: string): void {
    const fallbackError = {
      source,
      context: "Error Handler Failure",
      message: ErrorAnalyzer.getErrorMessage(loggingError),
      timestamp: new Date().toISOString(),
    };

    try {
      logger.error(fallbackError);
    } catch {
      console.error("ErrorHandler failure:", fallbackError);
    }
  }
}

import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import { FileEncoding } from "../../../fileManager/internal/file-encoding.enum.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";

export default class CryptoValidation {
  public static isEncrypted(value: string): boolean {
    try {
      if (!value || typeof value !== "string") return false;
      if (!value.startsWith(CRYPTO_CONSTANTS.FORMAT.PREFIX)) return false;

      const parts = value
        .replace(CRYPTO_CONSTANTS.FORMAT.PREFIX, "")
        .split(CRYPTO_CONSTANTS.FORMAT.SEPARATOR);

      // Now expect version + 4 parts = 5
      if (parts.length !== CRYPTO_CONSTANTS.FORMAT.EXPECTED_PARTS + 1) return false;

      const [version, ...cryptoParts] = parts;
      if (version !== CRYPTO_CONSTANTS.FORMAT.VERSION) return false;

      return cryptoParts.every(this.isValidBase64);
    } catch {
      return false;
    }
  }

  public static isValidBase64(value: string): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(value) || value.length % 4 !== 0) {
      return false;
    }

    try {
      Buffer.from(value, FileEncoding.BASE64);
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, "isValidBase64", "Failed to validate base64 string");
      return false;
    }
  }

  public static validateBase64String(value: string, fieldName: string): void {
    if (!value || typeof value !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateBase64String",
        `${fieldName} must be a non-empty string`,
      );
    }

    if (!this.isValidBase64(value)) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateBase64String",
        `${fieldName} is not a valid base64 string`,
      );
    }
  }

  public static validateSecretKey(secretKey: string): void {
    if (!secretKey || typeof secretKey !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateSecretKey",
        "Secret key must be a non-empty string",
      );
    }

    if (secretKey.length < 16) {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateSecretKey",
        `Secret key must be at least 16 characters long`,
      );
    }
  }

  public static validateInputs(value: string, secretKey: string, operation: string): void {
    if (!value || typeof value !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateInputs",
        `${operation}: Value must be a non-empty string`,
      );
    }
    if (!secretKey || typeof secretKey !== "string") {
      ErrorHandler.logAndThrow(
        "CryptoEngine.validateSecretKey",
        `${operation}: Secret key must be a non-empty string`,
      );
    }
  }
}

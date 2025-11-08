import { CRYPTO_CONSTANTS } from "../../../types/crypto.config.js";

export default class EncryptionUtils {
  /**
   * Checks whether the provided value is already encrypted.
   * It verifies both the prefix and version pattern, e.g. "ENC2:v1:".
   */
  public static isAlreadyEncrypted(value: string): boolean {
    if (!value) return false;

    const { PREFIX, VERSION } = CRYPTO_CONSTANTS.FORMAT;
    const fullMarker = `${PREFIX}${VERSION}:`;

    return value.startsWith(fullMarker);
  }

  public static trimSafely(value: string | null | undefined): string {
    return value?.trim() || "";
  }

  public static logIfNotEmpty(items: string[], logFn: (items: string[]) => void): void {
    if (items.length > 0) {
      logFn(items);
    }
  }
}

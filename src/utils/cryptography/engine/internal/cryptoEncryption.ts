import * as crypto from "crypto";
import SecureKeyGenerator from "../../key/secureKeyGenerator.js";
import CryptoArgon2 from "./cryptoArgon2.js";
import CryptoEnvironment from "./cryptoEnvironment.js";
import CryptoWebOperations from "./cryptoWebOperations.js";
import CryptoHmac from "./cryptoHmac.js";
import { CRYPTO_CONSTANTS } from "../../types/crypto.config.js";
import CryptoValidation from "./cryptoValidation.js";
import { FileEncoding } from "../../../fileManager/internal/file-encoding.enum.js";

export default class CryptoEncryption {
  /**
   * Helper to validate encryption prerequisites
   */
  public static async validateEncryptionPrerequisites(
    value: string,
    secretKeyVariable: string,
  ): Promise<string> {
    const actualSecretKey = await CryptoEnvironment.getSecretKeyFromEnvironment(secretKeyVariable);
    CryptoValidation.validateSecretKey(actualSecretKey);
    CryptoValidation.validateInputs(value, actualSecretKey, "encrypt");
    return actualSecretKey;
  }

  /**
   * Generates all components needed for encryption
   * Returns Web Crypto API compatible types
   */
  public static async generateEncryptionComponents(secretKey: string): Promise<{
    salt: string;
    iv: Uint8Array;
    encryptionKey: crypto.webcrypto.CryptoKey;
    hmacKey: crypto.webcrypto.CryptoKey;
  }> {
    const salt = SecureKeyGenerator.generateBase64Salt();
    const iv = SecureKeyGenerator.generateWebCryptoIV();

    const { encryptionKey, hmacKey } = await CryptoArgon2.deriveKeysWithArgon2(secretKey, salt);

    return {
      salt,
      iv,
      encryptionKey,
      hmacKey,
    };
  }

  private static formatEncryptedPayload(
    salt: string,
    iv: string,
    cipherText: string,
    hmac: string,
  ): string {
    const { PREFIX, VERSION, SEPARATOR } = CRYPTO_CONSTANTS.FORMAT;
    return `${PREFIX}${VERSION}${SEPARATOR}${salt}${SEPARATOR}${iv}${SEPARATOR}${cipherText}${SEPARATOR}${hmac}`;
  }

  // }

  public static async createEncryptedPayload(
    value: string,
    salt: string,
    iv: Uint8Array,
    encryptionKey: crypto.webcrypto.CryptoKey,
    hmacKey: crypto.webcrypto.CryptoKey,
  ): Promise<{
    raw: string;
    components: { salt: string; iv: string; cipherText: string; hmac: string };
  }> {
    // Encrypt the value
    const encryptedBuffer = await CryptoWebOperations.encryptBuffer(iv, encryptionKey, value);
    const cipherText = Buffer.from(encryptedBuffer).toString(FileEncoding.BASE64);
    const ivBase64 = Buffer.from(iv).toString(FileEncoding.BASE64);

    // Compute HMAC using consolidated method
    const dataToHmac = CryptoHmac.prepareHMACData(salt, ivBase64, cipherText);
    const hmacBase64 = await CryptoWebOperations.computeHMAC(hmacKey, dataToHmac);

    const formatted = this.formatEncryptedPayload(salt, ivBase64, cipherText, hmacBase64);
    return {
      raw: formatted,
      components: { salt, iv: ivBase64, cipherText, hmac: hmacBase64 },
    };
  }
}

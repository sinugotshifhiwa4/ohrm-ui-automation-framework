import CryptoValidation from "./internal/cryptoValidation.js";
import CryptoEnvironment from "./internal/cryptoEnvironment.js";
import CryptoWebOperations from "./internal/cryptoWebOperations.js";
import CryptoArgon2 from "./internal/cryptoArgon2.js";
import CryptoHmac from "./internal/cryptoHmac.js";
import CryptoEncryption from "./internal/cryptoEncryption.js";
import CryptoDecryption from "./internal/cryptoDecryption.js";

export default class CryptoEngineFacade {
  static Validation = CryptoValidation;
  static Environment = CryptoEnvironment;
  static Web = CryptoWebOperations;
  static Argon2 = CryptoArgon2;
  static HMAC = CryptoHmac;
  static Encryption = CryptoEncryption;
  static Decryption = CryptoDecryption;
}

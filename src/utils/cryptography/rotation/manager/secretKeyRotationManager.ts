import SecretKeyOperations from "../operations/secretKeyOperations.js";
import CryptoOperations from "../operations/cryptoOperations.js";
import RotationValidator from "../operations/rotationValidator.js";

export default class SecretKeyRotationManager {
  static Secret = SecretKeyOperations;
  static Crypto = CryptoOperations;
  static Validator = RotationValidator;
}

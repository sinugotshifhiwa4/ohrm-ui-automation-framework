import SecretFileManager from "../../../environment/manager/handlers/secretFileManager.js";
import SecretFilePathResolver from "../../../environment/manager/resolvers/secretFilePathResolver.js";
import ErrorHandler from "../../../errorHandling/errorHandler.js";

export default class CryptoEnvironment {
  public static async getSecretKeyFromEnvironment(secretKeyVariable: string): Promise<string> {
    try {
      const secretKeyValue = await SecretFileManager.getKeyValue(
        SecretFilePathResolver.getSecretFilePath(),
        secretKeyVariable,
      );

      if (!secretKeyValue) {
        ErrorHandler.logAndThrow(
          "CryptoEngine.getSecretKeyFromEnvironment",
          `Secret key variable '${secretKeyVariable}' not found in environment file`,
        );
      }

      return secretKeyValue;
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "getSecretKeyFromEnvironment",
        `Failed to load secret key variable '${secretKeyVariable}`,
      );
      throw error;
    }
  }
}

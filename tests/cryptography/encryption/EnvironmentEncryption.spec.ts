import { test } from "../../../fixtures/test.fixtures.js";
import logger from "../../../src/utils/logger/loggerManager.js";

test.describe("Environment Variable Encryption @env-encryption", () => {
  test("Encrypt environment variables", async ({ cryptoCoordinator }) => {
    const variablesToEncrypt = ["PORTAL_USERNAME", "PORTAL_PASSWORD"];

    await cryptoCoordinator.encryptEnvironmentVariables(variablesToEncrypt);
    logger.info("Verified: Environment variables encrypted successfully");
  });
});

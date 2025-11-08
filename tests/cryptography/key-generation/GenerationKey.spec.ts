import { test, expect } from "../../../fixtures/test.fixtures.js";
import SystemInfo from "../../../src/utils/shared/systemInfo.js";
import logger from "../../../src/utils/logger/loggerManager.js";

test.describe.serial("Encryption Flow @generate-key", () => {
  test("Generate secret key", async ({ cryptoCoordinator }) => {
    const currentEnvKeyName = await cryptoCoordinator.getSecretKeyName();
    const secretKey = await cryptoCoordinator.generateAndStoreSecretKey({
      rotationDays: 90,
      performedBy: SystemInfo.getCurrentUsername(),
    });

    expect(secretKey).toBeTruthy();
    expect(secretKey.length).toBeGreaterThan(0);

    logger.info(`Verified: Secret key for '${currentEnvKeyName}' generated successfully`);
  });
});

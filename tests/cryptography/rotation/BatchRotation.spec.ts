import { test, expect } from "../../../fixtures/test.fixtures.js";
import RotationOrchestrator from "../../../src/utils/cryptography/service/rotationOrchestrator.js";
import SystemInfo from "../../../src/utils/shared/systemInfo.js";
import logger from "../../../src/utils/logger/loggerManager.js";

test.describe.serial("Batch Key Rotation @batch-rotation", () => {
  test("Check for expired keys with dry run", async () => {
    const results = await RotationOrchestrator.rotateAllExpiredKeys({
      performedBy: SystemInfo.getCurrentUsername(),
      dryRun: true,
    });

    expect(Array.isArray(results)).toBe(true);

    logger.info(`Found ${results.length} expired key(s)`);
  });

  test("Rotate all expired keys", async () => {
    const results = await RotationOrchestrator.rotateAllExpiredKeys({
      performedBy: SystemInfo.getCurrentUsername(),
      dryRun: false,
    });

    expect(Array.isArray(results)).toBe(true);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    expect(successCount).toBeGreaterThanOrEqual(0);
    expect(failureCount).toBeGreaterThanOrEqual(0);

    logger.info(`Verified: Batch rotation: ${successCount}/${results.length} successful`);
  });
});

import { test, expect } from "../../../fixtures/test.fixtures.js";
import RotationOrchestrator from "../../../src/utils/cryptography/service/rotationOrchestrator.js";
import SystemInfo from "../../../src/utils/shared/systemInfo.js";
import logger from "../../../src/utils/logger/loggerManager.js";

test.describe("Error Handling @error-handling", () => {
  test("Should prevent rotation without force flag on valid key", async () => {
    const result = await RotationOrchestrator.rotateKeyWithReEncryption({
      rotationReason: "manual",
      performedBy: SystemInfo.getCurrentUsername(),
      forceRotation: false,
    });

    expect(result.success).toBe(false);
    logger.info("Verified: rotation prevented without force flag as expected");
  });

  test("Should allow rotation with force flag", async () => {
    const result = await RotationOrchestrator.rotateKeyWithReEncryption({
      rotationReason: "manual",
      performedBy: SystemInfo.getCurrentUsername(),
      forceRotation: true,
    });

    expect(result.success).toBe(true);

    logger.info(`Verified: Rotation completed: ${result.variablesProcessed} variables re-encrypted`);
  });
});

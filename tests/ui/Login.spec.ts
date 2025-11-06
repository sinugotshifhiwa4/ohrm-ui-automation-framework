import { test } from "../../fixtures/test.fixtures.js";
import logger from "../../src/utils/logger/loggerManager.js";

test.describe("Login Test Suite @regression @sanity", () => {
  test.beforeEach(async ({ loginOrchestrator }) => {
    await loginOrchestrator.navigateToPortal();
  });

  test("should login successfully with valid credentials", async () => {
    logger.info("Verified: Login successful");
  });

  test("should display error for invalid credentials", async ({ loginOrchestrator, loginPage }) => {
    await loginOrchestrator.loginToPortal("General-user", "Password@123", false);
    await loginPage.verifyInvalidLoginErrorMessageIsVisible();
    logger.info("Verified: Login failed");
  });
});

import { test } from "../../fixtures/test.fixtures.js";
import logger from "../../src/utils/logger/loggerManager.js";

test.describe("Sidebar Menu Test Suite @regression @sanity", () => {
  test.beforeEach(async ({ loginOrchestrator }) => {
    await loginOrchestrator.navigateToPortal();
  });

  test("should display all side menus  @sanity", async ({ sideBarMenu }) => {
    await sideBarMenu.verifySideBarElementsAreVisible();
    logger.info("Verified: All side menus are visible");
  });
});

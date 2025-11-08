import { test as authentication } from "../../../fixtures/test.fixtures.js";
import logger from "../../../src/utils/logger/loggerManager.js";

/**
 * Authentication Test Fixture
 *
 * This test handles the portal authentication setup for other tests.
 * It retrieves portal credentials from the environment resolver and
 * performs login via the login orchestrator. The session state is
 * saved for reuse in subsequent tests to avoid repeated logins.
 *
 * Tags:
 *  - @authenticate : Marks this as an authentication test
 *  - @sanity       : Can be included in sanity test runs
 *  - @regression   : Can be included in regression test runs
 */
authentication(`Authenticate @authenticate @sanity @regression`, async ({ environmentResolver, loginOrchestrator }) => {
  const { username, password } = await environmentResolver.getPortalCredentials();

  await loginOrchestrator.loginToPortal(username, password);

  logger.info("Verified: Authentication session state setup completed and saved successfully.");
});

import { test as baseTest, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

import { AsyncFileManager } from "../src/utils/fileManager/asyncFileManager.js";
import AuthenticationFileManager from "../src/utils/auth/storage/authenticationFileManager.js";
import AuthenticationFilter from "../src/utils/auth/authenticationFilter.js";

import { EnvironmentFileEncryptor } from "../src/utils/cryptography/manager/environmentFileEncryptor.js";
import { CryptoEngine } from "../src/utils/cryptography/engine/cryptoEngine.js";
import { CryptoService } from "../src/utils/cryptography/service/cryptoService.js";
import { CryptoCoordinator } from "../src/utils/cryptography/service/cryptoCoordinator.js";

import { EnvironmentResolver } from "../src/utils/environment/resolver/environmentResolver.js";
import { AuthenticationStatePersister } from "../src/utils/auth/state/authenticationStatePersister.js";

import { LoginPage } from "../src/layers/ui/pages/loginPage.js";
import { LoginOrchestrator } from "../src/utils/auth/state/loginOrchestrator.js";

type TestFixtures = {
  /**
   * Determines if authentication state should be saved for the test
   */
  shouldSaveAuthenticationState: boolean;

  /**
   * Playwright TestInfo object
   */
  testInfo: TestInfo;

  // Crypto
  environmentFileEncryptor: EnvironmentFileEncryptor;
  cryptoEngine: CryptoEngine;
  cryptoService: CryptoService;
  cryptoCoordinator: CryptoCoordinator;

  environmentResolver: EnvironmentResolver;
  authenticationStatePersister: AuthenticationStatePersister;

  loginPage: LoginPage;
  loginOrchestrator: LoginOrchestrator;
};

export const test = baseTest.extend<TestFixtures>({
  shouldSaveAuthenticationState: [true, { option: true }],
  testInfo: async ({}, use, testInfo: TestInfo) => {
    await use(testInfo);
  },

  // Crypto
  environmentFileEncryptor: async ({}, use) => {
    await use(new EnvironmentFileEncryptor());
  },
  cryptoEngine: async ({}, use) => {
    await use(new CryptoEngine());
  },
  cryptoService: async ({}, use) => {
    await use(new CryptoService());
  },
  cryptoCoordinator: async ({ environmentFileEncryptor }, use) => {
    await use(new CryptoCoordinator(environmentFileEncryptor));
  },

  environmentResolver: async ({}, use) => {
    await use(new EnvironmentResolver());
  },

  authenticationStatePersister: async ({ page }, use) => {
    await use(new AuthenticationStatePersister(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  loginOrchestrator: async (
    { page, environmentResolver, authenticationStatePersister, loginPage },
    use,
  ) => {
    await use(
      new LoginOrchestrator(page, environmentResolver, authenticationStatePersister, loginPage),
    );
  },

  /**
   * Provides the storage state file path for browser authentication persistence.
   *
   * Returns the path to saved authentication state when:
   * - Authentication state persistence is enabled
   * - The test requires authentication (not skipped)
   * - A saved state file exists
   *
   * Otherwise returns undefined to start a fresh browser session.
   *
   * @param shouldSaveAuthenticationState - Flag indicating whether to persist auth state
   * @param testInfo - Playwright test metadata for filtering
   * @param use - Playwright fixture function to provide the storage state value
   */
  storageState: async ({ shouldSaveAuthenticationState, testInfo }, use) => {
    // Check if this test should skip authentication (e.g., "Invalid Credentials" tests)
    const shouldSkipAuthentication = AuthenticationFilter.shouldSkipAuthenticationIfNeeded(
      testInfo,
      ["Invalid Credentials"],
    );

    // Use saved authentication state if enabled and not skipped
    if (shouldSaveAuthenticationState && !shouldSkipAuthentication) {
      const storagePath = AuthenticationFileManager.getFilePath();
      const fileExists = await AsyncFileManager.doesFileExist(storagePath);

      await use(fileExists ? storagePath : undefined);
    } else {
      await use(undefined);
    }
  },
});

export { expect };

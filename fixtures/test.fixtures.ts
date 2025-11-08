import { test as baseTest, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

import { AsyncFileManager } from "../src/utils/fileManager/asyncFileManager.js";
import AuthenticationFileManager from "../src/utils/auth/storage/authenticationFileManager.js";
import AuthenticationFilter from "../src/utils/auth/authenticationFilter.js";

import { EncryptionVariableResolver } from "../src/utils/cryptography/manager/encryptor/internal/encryptionVariableResolver.js";
import { VariableEncryptionExecutor } from "../src/utils/cryptography/manager/encryptor/internal/variableEncryptionExecutor.js";
import { EncryptionOperationLogger } from "../src/utils/cryptography/manager/encryptor/internal/encryptionOperationLogger.js";
import { EnvironmentFileEncryptor } from "../src/utils/cryptography/manager/encryptor/environmentFileEncryptor.js";
import { CryptoService } from "../src/utils/cryptography/service/cryptoService.js";
import { CryptoCoordinator } from "../src/utils/cryptography/service/cryptoCoordinator.js";

import { EnvironmentResolver } from "../src/utils/environment/resolver/environmentResolver.js";

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
  encryptionVariableResolver: EncryptionVariableResolver;
  variableEncryptionExecutor: VariableEncryptionExecutor;
  encryptionOperationLogger: EncryptionOperationLogger;
  environmentFileEncryptor: EnvironmentFileEncryptor;
  cryptoService: CryptoService;
  cryptoCoordinator: CryptoCoordinator;

  environmentResolver: EnvironmentResolver;
};

export const test = baseTest.extend<TestFixtures>({
  shouldSaveAuthenticationState: [true, { option: true }],
  testInfo: async ({}, use, testInfo: TestInfo) => {
    await use(testInfo);
  },

  // Crypto
  encryptionVariableResolver: async ({}, use) => {
    await use(new EncryptionVariableResolver());
  },
  variableEncryptionExecutor: async ({}, use) => {
    await use(new VariableEncryptionExecutor());
  },
  encryptionOperationLogger: async ({}, use) => {
    await use(new EncryptionOperationLogger());
  },
  environmentFileEncryptor: async (
    { encryptionVariableResolver, variableEncryptionExecutor, encryptionOperationLogger },
    use,
  ) => {
    await use(
      new EnvironmentFileEncryptor(
        encryptionVariableResolver,
        variableEncryptionExecutor,
        encryptionOperationLogger,
      ),
    );
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

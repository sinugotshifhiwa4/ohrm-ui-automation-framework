import { defineConfig, devices } from "@playwright/test";
import EnvironmentDetector from "./src/utils/environment/detector/environmentDetector.js";
import WorkerAllocator from "./src/utils/allocator/workerAllocator.js";
import { TIMEOUTS } from "./src/utils/timeouts/timeout.config.js";
import { shouldSkipBrowserInit } from "./src/utils/shared/skipBrowserInitFlag.js";

/**
 * Checks if the current execution is running in a Continuous Integration (CI) environment.
 */
const isCI = EnvironmentDetector.isCI();

/**
 * Determines whether browser initialization should be skipped.
 *
 * Controlled by the environment variable `SKIP_BROWSER_INIT`, typically used
 * when running encryption or API-only tests.
 *
 * @returns {boolean} True if browser initialization should be skipped.
 */
const shouldSkipBrowserInitialization = shouldSkipBrowserInit();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: "src/utils/environment/global/globalSetup.ts",
  timeout: TIMEOUTS.test,
  expect: {
    timeout: TIMEOUTS.expect,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: WorkerAllocator.getOptimalWorkerCount("10-percent"),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */

  /**
   * Configures Playwright reporters and test filtering behavior.
   *
   * - In CI environments: generates only a blob report for aggregation and uploads.
   * - In local runs: generates multiple reports (HTML, Ortoni, and dot) for easier debugging and visualization.
   *
   * The `grep` option enables running tests by tag or keyword.
   * You can set the `PLAYWRIGHT_GREP` environment variable (e.g., `@regression`, `@sanity`) to filter which tests run.
   */
  reporter: isCI
    ? [["blob", { outputDir: "blob-report", alwaysReport: true }]]
    : [["html", { open: "never" }], ["dot"]],
  grep:
    typeof process.env.PLAYWRIGHT_GREP === "string"
      ? new RegExp(process.env.PLAYWRIGHT_GREP)
      : process.env.PLAYWRIGHT_GREP || /.*/,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /**
     * Test artifacts & browser mode.
     * - In CI: optimize for performance and smaller artifacts.
     * - In local dev: maximize visibility for debugging.
     */
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "on",
    headless: isCI ? true : false,

    /**
     * Test artifacts & browser mode.
     * - In CI: optimize for performance and smaller artifacts.
     * - In local dev: maximize visibility for debugging.
     */
    launchOptions: {
      args: isCI
        ? [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--enable-features=VaapiVideoDecoder",
            "--enable-gpu-rasterization",
            "--enable-zero-copy",
            "--ignore-gpu-blocklist",
            "--use-gl=egl",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-extensions",
            "--disable-plugins",
            "--no-first-run",
            "--disable-default-apps",
            "--disable-translate",
          ]
        : [],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    /**
     * Defines the list of Playwright projects used for test execution.
     *
     * - The optional `setup` project initializes the authentication state before other projects run,
     *   unless browser initialization is explicitly skipped.
     * - Each browser project (`chromium`, `firefox`, `webkit`) reuses the authentication state
     *   provided by the `storageState` fixture, which dynamically resolves the correct state path
     *   through `AuthenticationFileManager` and related auth utilities.
     * - The `dependencies` property ensures that all browser projects wait for the `setup` project
     *   to complete before starting.
     *
     * When the environment variable `SKIP_BROWSER_INIT=true` is set, the `shouldSkipBrowserInitialization`
     * flag disables the authentication setup process entirely. This allows running non-UI or backend tests
     * (e.g. encryption) without performing a login or launching browser sessions.
     */
    ...(!shouldSkipBrowserInitialization
      ? [
          {
            name: "setup",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined,
      },
      dependencies: shouldSkipBrowserInitialization ? [] : ["setup"],
    },
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     storageState: undefined,
    //   },
    //   dependencies: shouldSkipBrowserInitialization ? [] : ["setup"],
    // },
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //     storageState: undefined,
    //   },
    //   dependencies: shouldSkipBrowserInitialization ? [] : ["setup"],
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

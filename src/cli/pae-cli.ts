#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import boxen from "boxen";
import { execa } from "execa";
import type { PaeCliOptions } from "./pae-cli.type.js";

const program = new Command();

/* eslint-disable no-console */
// Welcome message
console.log(
  boxen(chalk.cyan(figlet.textSync("Playwright AE", { horizontalLayout: "default" })), {
    padding: 1,
    margin: 1,
    borderColor: "cyan",
    align: "center",
  }),
);
console.log(chalk.gray.bold("🔐 Key Lifecycle Management and Encryption\n"));

// Constants
const ALLOWED_ENVIRONMENTS = ["dev", "qa", "uat", "preprod"];

// Utility: Structured logging with timestamps
const log = (msg: string) => console.log(chalk.gray(`[${new Date().toISOString()}]`), msg);

/**
 * Validates an environment variable by checking if it is present in the list of allowed environments.
 * If the environment is invalid, logs an error message and exits the process with a non-zero status code.
 * @param {string} [env] - Optional environment variable to validate.
 */
function validateEnv(env?: string): void {
  if (env && !ALLOWED_ENVIRONMENTS.includes(env)) {
    console.error(
      chalk.red(`Invalid environment "${env}". Allowed: ${ALLOWED_ENVIRONMENTS.join(", ")}`),
    );
    process.exit(1);
  }
}

/**
 * Initializes a Playwright test run for the specified environment.
 * @param {string} tag - A tag to identify the test run
 * @param {string} [env] - The environment to run the test for (optional)
 * @returns A promise that resolves when the test run is complete
 * @example
 * await initialize("cryptography", "dev");
 */
async function initialize(tag: string, env?: string): Promise<void> {
  const spinner = ora(`Running ${tag} for ${env ?? "all environments"}...`).start();

  try {
    const envVars = {
      SKIP_BROWSER_INIT: "true",
      PLAYWRIGHT_GREP: `@${tag}`,
      ...(env ? { ENV: env } : {}),
    };

    await execa("npm", ["run", "test:cryptography"], {
      stdio: "inherit",
      env: { ...process.env, ...envVars },
    });

    spinner.succeed(chalk.green(`✔ ${tag} completed successfully`));
    log(chalk.green(`Operation completed for ${env ?? "all environments"}`));
  } catch (err) {
    spinner.fail(chalk.red(`✖ ${tag} failed`));
    console.error(chalk.red((err as Error).message));
    log(chalk.red(`Operation failed: ${(err as Error).message}`));
    process.exit(1);
  }
}

/**
 * Registers a new command for the Pae CLI
 * @param {string} name - The name of the command
 * @param {string} desc - A description of the command
 * @param {string} tag - A tag to identify the command
 * @example
 * registerEnvCommand("test:cryptography", "Runs cryptography tests for the specified environment", "cryptography");
 */
function registerEnvCommand(name: string, desc: string, tag: string): void {
  program
    .command(name)
    .description(desc)
    .requiredOption("--env <env>", `Target environment (${ALLOWED_ENVIRONMENTS.join("|")})`)
    .action(async (opts: PaeCliOptions) => {
      validateEnv(opts.env);
      await initialize(tag, opts.env);
    });
}

// Program configuration
program
  .name("pae")
  .description("Playwright CLI for key lifecycle management and encryption")
  .version("1.0.0")
  .option("--config <path>", "Path to custom config file (optional)");

// Register environment-specific commands
registerEnvCommand(
  "generate-key",
  "Generate a new encryption key for a specific environment",
  "generate-key",
);

registerEnvCommand(
  "encrypt-env",
  "Encrypt environment variables for a specific environment",
  "env-encryption",
);

registerEnvCommand(
  "rotate-key",
  "Rotate the encryption key for a specific environment",
  "key-rotation",
);

registerEnvCommand("audit", "Run key audit checks for a specific environment", "key-audit");

// Batch rotation command (no environment required)
program
  .command("batch-rotation")
  .description("Rotate all environments' keys at once")
  .action(() => initialize("batch-rotation"));

// Add usage examples
program.addHelpText(
  "after",
  `
${chalk.bold("Examples:")}
  ${chalk.cyan("$ pae generate-key --env dev")}
  ${chalk.cyan("$ pae encrypt-env --env qa")}
  ${chalk.cyan("$ pae rotate-key --env preprod")}
  ${chalk.cyan("$ pae audit --env uat")}
  ${chalk.cyan("$ pae batch-rotation")}

${chalk.bold("Environment Options:")}
  ${ALLOWED_ENVIRONMENTS.map((env) => chalk.yellow(env)).join(", ")}
`,
);

// Graceful exit handling
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n⚠️  Operation cancelled by user."));
  /* eslint-enable no-console */
  process.exit(0);
});

// Parse arguments
program.parse(process.argv);

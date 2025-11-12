import { assertSnapshot } from "jsr:@std/testing@^1.0.0/snapshot";
import { join } from "jsr:@std/path@^1.0.8";

interface TestEnv {
  tempDir: string;
  dataFile: string;
  cleanup: () => void;
}

function setupTestEnv(
  inputData: { nextVersionName: string; testMode: boolean },
  packageName = "test-package",
  initialVersion = "1.0.0",
): TestEnv {
  const tempDir = Deno.makeTempDirSync();

  const packageJson = {
    name: packageName,
    version: initialVersion,
    description: "Test package for log testing",
    main: "index.js",
  };
  Deno.writeTextFileSync(
    join(tempDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
  Deno.writeTextFileSync(
    join(tempDir, "index.js"),
    "module.exports = { test: true };",
  );

  const dataFile = Deno.makeTempFileSync();
  Deno.writeTextFileSync(dataFile, JSON.stringify(inputData));

  return {
    tempDir,
    dataFile,
    cleanup: () => {
      try {
        Deno.removeSync(tempDir, { recursive: true });
        Deno.removeSync(dataFile);
      } catch (_e) {
        // Ignore cleanup errors
      }
    },
  };
}

async function runScriptWithLogs(
  testEnv: TestEnv,
  mockAlreadyDeployed?: boolean,
) {
  const env: Record<string, string> = {
    DATA_FILE_PATH: testEnv.dataFile,
  };

  if (mockAlreadyDeployed !== undefined) {
    env.DECAF_SCRIPT_NPM_DID_ALREADY_DEPLOY = mockAlreadyDeployed
      ? "true"
      : "false";
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-all",
      "--no-lock",
      "script.ts",
      "--package-path",
      testEnv.tempDir,
    ],
    env,
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await command.output();
  return new TextDecoder().decode(stdout);
}

Deno.test("console logs: version update confirmation", async (t) => {
  const testEnv = setupTestEnv({
    nextVersionName: "2.0.0",
    testMode: true,
  });

  try {
    const logs = await runScriptWithLogs(testEnv, false);
    await assertSnapshot(t, logs);
  } finally {
    testEnv.cleanup();
  }
});

Deno.test("console logs: already deployed message", async (t) => {
  const testEnv = setupTestEnv({
    nextVersionName: "1.5.0",
    testMode: false,
  });

  try {
    const logs = await runScriptWithLogs(testEnv, true);
    await assertSnapshot(t, logs);
  } finally {
    testEnv.cleanup();
  }
});

Deno.test("console logs: test mode deployment with dry-run", async (t) => {
  const testEnv = setupTestEnv({
    nextVersionName: "3.0.0",
    testMode: true,
  });

  try {
    const logs = await runScriptWithLogs(testEnv, false);
    await assertSnapshot(t, logs);
  } finally {
    testEnv.cleanup();
  }
});


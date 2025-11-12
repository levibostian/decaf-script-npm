import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.10";
import { join } from "jsr:@std/path@^1.0.8";
import $ from "@david/dax";

interface TestEnvOptions {
  inputData: {
    nextVersionName: string;
    testMode: boolean;
  };
  mockAlreadyDeployed?: boolean;
  packageName?: string;
  initialVersion?: string;
}

function setupTestEnv(options: TestEnvOptions) {
  const {
    inputData,
    mockAlreadyDeployed,
    packageName = "test-package",
    initialVersion = "1.0.0",
  } = options;

  // Create temporary directory for the test package
  const tempDir = Deno.makeTempDirSync();

  // Create package.json
  const packageJson = {
    name: packageName,
    version: initialVersion,
    description: "Test package",
    main: "index.js",
  };
  Deno.writeTextFileSync(
    join(tempDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );

  // Create a dummy index.js file
  Deno.writeTextFileSync(
    join(tempDir, "index.js"),
    "module.exports = { test: true };",
  );

  // Create temporary file for input data
  const dataFile = Deno.makeTempFileSync();
  Deno.writeTextFileSync(dataFile, JSON.stringify(inputData));

  return {
    tempDir,
    dataFile,
    mockAlreadyDeployed,
  };
}

async function runScript(
  dataFilePath: string,
  packagePath: string,
  mockAlreadyDeployed?: boolean,
) {
  const env: Record<string, string> = {
    DATA_FILE_PATH: dataFilePath,
  };

  if (mockAlreadyDeployed !== undefined) {
    env.DECAF_SCRIPT_NPM_DID_ALREADY_DEPLOY = mockAlreadyDeployed
      ? "true"
      : "false";
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--quiet",
      "--allow-all",
      "--no-lock",
      "script.ts",
      "--package-path",
      packagePath,
    ],
    env,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();
  const stdoutText = new TextDecoder().decode(stdout);
  const stderrText = new TextDecoder().decode(stderr);

  console.log(stdoutText)
  console.log(stderrText)

  // not sure why, but the stderr is what contains the command outputs.
  // stripAnsi removes weird characters in the output for changing color. 
  const commandsExecuted = $.stripAnsi(stderrText).split("\n").filter((line) =>
    line.startsWith("> ")
  // remove the "> " prefix
  ).map((line) => line.slice(2).trim());

  return {
    exitCode: code,
    stdout: stdoutText,
    stderr: stderrText,
    commandsExecuted
  };
}

Deno.test("updates package.json version to nextVersionName", async () => {
  const testEnv = setupTestEnv({
    inputData: {
      nextVersionName: "2.3.4",
      testMode: true,
    },
    initialVersion: "1.0.0",
    mockAlreadyDeployed: false,
  });

  assertEquals(
    JSON.parse(Deno.readTextFileSync(join(testEnv.tempDir, "package.json")))
      .version,
    "1.0.0",
  );
  const result = await runScript(
    testEnv.dataFile,
    testEnv.tempDir,
    testEnv.mockAlreadyDeployed,
  );

  assertEquals(result.exitCode, 0);
  assertEquals(
    JSON.parse(Deno.readTextFileSync(join(testEnv.tempDir, "package.json")))
      .version,
    "2.3.4",
  );
});

Deno.test("exits with error if package.json not found", async () => {
  const inputData = {
    nextVersionName: "2.0.0",
    testMode: false,
  };

  const dataFile = Deno.makeTempFileSync();
  Deno.writeTextFileSync(dataFile, JSON.stringify(inputData));

  const emptyDir = Deno.makeTempDirSync();

  const result = await runScript(dataFile, emptyDir);

  assertEquals(result.exitCode, 1);
  // Error message goes to stderr, not stdout
  const output = result.stdout + result.stderr;
  assertStringIncludes(output, "No package.json file found");
});

Deno.test("skips publishing when already deployed", async () => {
  const testEnv = setupTestEnv({
    inputData: {
      nextVersionName: "3.0.0",
      testMode: false,
    },
    mockAlreadyDeployed: true,
  });

  const result = await runScript(testEnv.dataFile, testEnv.tempDir, true);

  assertEquals(result.exitCode, 0);
  assertStringIncludes(result.stdout, "already deployed");
  assertStringIncludes(result.stdout, "skip publishing");
});

Deno.test("publishes in test mode with --dry-run flag", async () => {
  const testEnv = setupTestEnv({
    inputData: {
      nextVersionName: "4.0.0",
      testMode: true,
    },
    mockAlreadyDeployed: false,
  });

  const result = await runScript(testEnv.dataFile, testEnv.tempDir, false);

  assertEquals(result.exitCode, 0);
  const publishCommand = result.commandsExecuted.find(cmd => cmd.includes("npm publish"));
  assertEquals(publishCommand, "npm publish '--dry-run'");
});

Deno.test("publishes without --dry-run when not in test mode", async () => {
  const testEnv = setupTestEnv({
    inputData: {
      nextVersionName: "5.0.0",
      testMode: false,
    },
    mockAlreadyDeployed: false,
  });

  // Note: we actually run npm publish here without mocking, but it will fail 
  // because of auth. we just want to verify the command executed. 
  const result = await runScript(testEnv.dataFile, testEnv.tempDir, false);

  assertStringIncludes(result.stdout, "Publishing to npm");
  const publishCommand = result.commandsExecuted.find(cmd => cmd.includes("npm publish"));
  assertEquals(publishCommand, "npm publish");
});

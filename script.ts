#!/usr/bin/env -S deno run --quiet --allow-all --no-lock

import { getDeployStepInput } from "@levibostian/decaf-sdk";
import $ from "@david/dax";
import { parseArgs } from "@std/cli/parse-args";

// Parse the command line arguments to configure the script
const args = parseArgs(Deno.args, {
  string: ["package-path"],
});

const absolutePathToPackage = Deno.realPathSync(args["package-path"] ?? ".");
try {
  if (!Deno.statSync(`${absolutePathToPackage}/package.json`).isFile) {
    console.log(
      `No package.json file found at ${absolutePathToPackage}. Exiting.`,
    );
    Deno.exit(1);
  }
} catch (_e) {
  console.log(
    `No package.json file found at ${absolutePathToPackage}. Exiting.`,
  );
  Deno.exit(1);
}

const input = getDeployStepInput();

// log an intro message
console.log("Time to deploy npm package!");
console.log("");

// Update the package.json version to the new version
const nameOfNpmPackage =
  (await $`npm pkg get name`.cwd(absolutePathToPackage).text()).trim().replace(
    /"/g,
    "",
  );

console.log(
  `Updating package.json version to ${input.nextVersionName}...`,
);
await $`npm version ${input.nextVersionName} --no-git-tag-version`.cwd(
  absolutePathToPackage,
).printCommand();

// assert the version was updated correctly.
const packageJsonContent = await Deno.readTextFile(
  `${absolutePathToPackage}/package.json`,
);
if (!packageJsonContent.includes(`"version": "${input.nextVersionName}"`)) {
  console.log(
    `Failed to update version in ${absolutePathToPackage}/package.json`,
  );
  Deno.exit(1);
}
console.log("✓ Version updated in the package.json file successfully");

console.log(
  `Checking if version ${input.nextVersionName} of ${nameOfNpmPackage} is already deployed...`,
);
const didAlreadyDeployToNpm = await (async () => {
  // simple mocking mechanism for testing. 
  const mockResult = Deno.env.get("DECAF_SCRIPT_NPM_DID_ALREADY_DEPLOY");
  if (mockResult === "true") return true;
  if (mockResult === "false") return false;

  const didAlreadyDeployToNpm =
    (await $`npx is-it-deployed --package-manager npm --package-name ${nameOfNpmPackage} --package-version ${input.nextVersionName}`
      .cwd(absolutePathToPackage).noThrow()).code === 0;

  return didAlreadyDeployToNpm;
})();

if (didAlreadyDeployToNpm) {
  console.log(
    `✓ Version ${input.nextVersionName} of ${nameOfNpmPackage} is already deployed to npm`,
  );
  console.log(
    "Therefore, I'm going to skip publishing to npm right now. Deploying to npm complete!",
  );
  Deno.exit(0);
}
console.log(
    `✓ Version ${input.nextVersionName} has not yet been deployed to npm. Proceeding to publish...`,
  );

// Publish the package to npm
const argsToPushToNpm = [`publish`];
if (input.testMode) {
  argsToPushToNpm.push(`--dry-run`);
}

console.log(`Publishing to npm...`);
await $`npm ${argsToPushToNpm}`.cwd(absolutePathToPackage).printCommand();
console.log(
  `✓ Successfully published ${nameOfNpmPackage}@${input.nextVersionName} to npm!`,
);

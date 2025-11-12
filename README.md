# decaf-script-npm

A script specifically designed for the [decaf](https://github.com/levibostian/decaf) deployment automation tool. This script automates the deployment of npm packages by updating the package version and publishing to the npm registry.

**Important**: This is exclusively for use with decaf. You must use decaf to utilize this script - it's not a standalone tool for general use.

## What does this script do?

This is a decaf deploy step script that handles npm package deployment. When decaf has determined a new version should be released, this script will:

1. **Update the package.json version** to match the release version determined by decaf
2. **Check if the version is already deployed** to npm (to avoid the script throwing an error because of npm not allowing you to publish the same version multiple times)
3. **Publish the package to npm** 

# Getting Started

**No installation required!** We just need to tell decaf how to run this script (via `npx`, `deno`, or a compiled binary).

Here are some simple examples for how to run this script with decaf on GitHub Actions or from the command line.

**GitHub Actions Example**

```yaml
- uses: levibostian/decaf
  with:
    deploy: npx @levibostian/decaf-script-npm
    # Other decaf arguments...
```

**Command Line Example**

```bash
decaf \
  --deploy "npx @levibostian/decaf-script-npm"
```

> Note: The above examples use `npx` and are arguably the easiest way to run the script. See below for alternative installation methods.

### Alternative Installation Methods

The above examples use `npx` and are arguably the easiest way to run the script. But, you have a few other options too:

1. **Run with Deno** (requires Deno installed)

```yaml
deploy: deno run --allow-all --quiet jsr:@levibostian/decaf-script-npm
```

2. **Run as a compiled binary**

Great option that doesn't depend on node or deno. This just installs a binary from GitHub and runs it for your operating system.

```yaml
deploy: curl -fsSL https://github.com/levibostian/decaf-script-npm/blob/HEAD/install?raw=true | bash -s "0.1.0" && ./decaf-script-npm

# Or, always run the latest version (less stable, but always up-to-date)
deploy: curl -fsSL https://github.com/levibostian/decaf-script-npm/blob/HEAD/install?raw=true | bash && ./decaf-script-npm
```

# Configuration

This script requires minimal configuration and works automatically with decaf's deploy step.

### Command Line Options

- `--package-path` - (Optional) Path to the directory containing the package.json file. Defaults to the current directory.

**Example:**

```bash
npx @levibostian/decaf-script-npm --package-path ./packages/my-package
```

### NPM Authentication

This script simply runs `npm publish`, so you'll need to ensure your npm authentication is set up correctly in the environment where decaf is running.

See the [npm documentation](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow) and choose the method that best fits your CI/CD environment.



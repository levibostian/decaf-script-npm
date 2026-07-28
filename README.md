# decaf-script-npm

A script specifically designed for the [decaf](https://github.com/levibostian/decaf) deployment automation tool. This script automates the deployment of npm packages by updating the package version and publishing to the npm registry.

## What does this script do?

This is a decaf deploy step script that handles npm package deployment. When decaf has determined a new version should be released, this script will:

1. **Update the package.json version** to match the release version determined by decaf
2. **Check if the version is already deployed** to npm (to avoid the script throwing an error because of npm not allowing you to publish the same version multiple times)
3. **Publish the package to npm** 

# Getting Started

Run using decaf's `shebang` command in your deployment workflow.

**GitHub Actions Example**

```yaml
- uses: levibostian/decaf
  with:
    deploy: |
      # your deployment scripts here...
      # at some point run the npm deploy script 
      decaf shebang https://github.com/levibostian/decaf-script-npm.git/shebang.sh@<version-here>
    # Other decaf arguments...
```

Replace `<version-here>` with a [release](https://github.com/levibostian/decaf-script-npm/releases). Latest: ![GitHub Release](https://img.shields.io/github/v/release/levibostian/decaf-script-npm)

**Command Line Example**

```bash
decaf \
  --deploy "decaf shebang https://github.com/levibostian/decaf-script-npm.git/shebang.sh@<version-here>"
```

# Configuration

This script requires minimal configuration and works automatically with decaf's deploy step.

### Command Line Options

- `--package-path` - (Optional) Path to the directory containing the package.json file. Defaults to the current directory.

**Example:**

```bash
decaf shebang https://github.com/levibostian/decaf-script-npm.git/shebang.sh@<version-here> --package-path ./packages/my-package
```

### NPM Authentication

This script simply runs `npm publish`, so you'll need to ensure your npm authentication is set up correctly in the environment where decaf is running.

See the [npm documentation](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow) and choose the method that best fits your CI/CD environment.

#!/usr/bin/env bash

# Script that runs via decaf's shebang feature.

REPO="levibostian/decaf-script-npm"

if [ "$DECAF_SHEBANG_REF" = "tag" ]; then
  # if shebang ran for a tag, download pre-built binary and run it. 
  URL="https://github.com/$REPO/releases/download/$DECAF_SHEBANG_REF_NAME/install.sh"

  curl -fsSL "$URL" | sh
  $HOME/.local/bin/decaf-script-npm "$@"
else
  # else, run via deno. 
  deno task --quiet run "$@"
fi

#!/usr/bin/env bash
# Only Connect — Home Game : update to the latest version from GitHub
set -eo pipefail
cd "$(dirname "$0")"

# Make an nvm-installed Node available if needed.
if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
  command -v node >/dev/null 2>&1 || nvm use --lts >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
fi

if [ ! -d .git ]; then
  echo "✗ This folder isn't a git clone, so it can't self-update."
  echo "  Re-clone it with:  gh repo clone Ellian-Eorwyn/only-connect"
  exit 1
fi

echo "==> Fetching the latest version…"
git pull --ff-only
echo "==> Updating dependencies…"
npm install --no-audit --no-fund
echo ""
echo "✓ Up to date. Start the game with ./run.sh"

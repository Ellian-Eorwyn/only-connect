#!/usr/bin/env bash
# Only Connect — Home Game : start the app (Linux/macOS)
set -eo pipefail
cd "$(dirname "$0")"

# Make an nvm-installed Node available even in a fresh shell.
if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
fi
if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node not found. Run ./install.sh first."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "==> First run — installing dependencies…"
  npm install
fi

URL="http://localhost:5173"
echo "==> Starting Only Connect at ${URL}   (press Ctrl+C to stop)"

# Best-effort: open the browser once the server has had a moment to start.
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v sensible-browser >/dev/null 2>&1; then sensible-browser "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 || true
  fi
) &

exec npm run dev

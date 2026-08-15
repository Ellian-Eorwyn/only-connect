#!/usr/bin/env bash
# Only Connect — Home Game : one-step installer (Linux/macOS)
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Only Connect — Home Game — setup"

if ! command -v node >/dev/null 2>&1; then
  cat <<'EOF'
✗ Node.js is not installed.

Install Node 18 or newer, then re-run ./install.sh. Options:
  • Recommended (no sudo, any distro) — nvm:
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
        # restart your shell, then:
        nvm install --lts
  • Debian/Ubuntu:  sudo apt update && sudo apt install -y nodejs npm
  • Fedora:         sudo dnf install -y nodejs npm
  • Arch:           sudo pacman -S nodejs npm
EOF
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node $(node -v) found, but Node 18+ is required. Please upgrade (https://github.com/nvm-sh/nvm)."
  exit 1
fi

echo "✓ Node $(node -v) / npm $(npm -v)"
echo "==> Installing dependencies…"
npm install

cat <<'EOF'

✓ All set!

Start the game:
    ./run.sh                 (starts the app and opens your browser)

Or build a single, double-clickable file (no server needed):
    npm run build            → then open dist/index.html in a browser
EOF

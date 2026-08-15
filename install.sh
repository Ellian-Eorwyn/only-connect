#!/usr/bin/env bash
# Only Connect — Home Game : one-step installer (Linux/macOS)
#
# Installs Node.js automatically (via nvm, no sudo) if it's missing, then
# installs the app's dependencies.
#
#   ./install.sh        # prompts before auto-installing Node (when interactive)
#   ./install.sh -y     # never prompts — install everything automatically
set -eo pipefail
cd "$(dirname "$0")"

NVM_VERSION="v0.40.1"
FORCE_YES="${AUTO_INSTALL:-}"
case "${1:-}" in -y | --yes) FORCE_YES=1 ;; esac

have_recent_node() {
  command -v node >/dev/null 2>&1 || return 1
  [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" -ge 18 ] 2>/dev/null
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
  command -v nvm >/dev/null 2>&1
}

install_node_via_nvm() {
  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    echo "✗ Need 'curl' or 'wget' to auto-install Node. Install one of them, or install Node 18+ yourself."
    return 1
  fi
  echo "==> Installing nvm ${NVM_VERSION} into \$HOME/.nvm (no sudo required)…"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  else
    wget -qO- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  fi
  load_nvm || { echo "✗ nvm did not install correctly."; return 1; }
  echo "==> Installing the latest Node LTS…"
  nvm install --lts
  nvm use --lts >/dev/null
}

ensure_node() {
  have_recent_node && return 0
  # nvm may already be installed but not loaded in this shell
  load_nvm && have_recent_node && return 0

  echo "Node.js 18+ was not found on your PATH."
  if [ -z "$FORCE_YES" ] && [ -t 0 ]; then
    printf "Install the latest Node LTS locally via nvm (no sudo, into ~/.nvm)? [Y/n] "
    read -r ans || ans=""
    case "$ans" in
      [Nn]*)
        echo "Skipped. Install Node 18+ yourself (https://github.com/nvm-sh/nvm) and re-run ./install.sh."
        exit 1
        ;;
    esac
  fi
  install_node_via_nvm || exit 1
  have_recent_node || { echo "✗ Node still isn't available — please install it manually."; exit 1; }
}

echo "==> Only Connect — Home Game — setup"
ensure_node
echo "✓ Node $(node -v) / npm $(npm -v)"
echo "==> Installing dependencies…"
npm install

cat <<'EOF'

✓ All set!

Start the game:
    ./run.sh                 (starts the app and opens your browser)

Or build a single, double-clickable file (no server needed):
    npm run build            → then open dist/index.html in a browser

Note: if Node was just installed via nvm, ./run.sh will pick it up
automatically. For other new terminals, open a fresh shell first.
EOF

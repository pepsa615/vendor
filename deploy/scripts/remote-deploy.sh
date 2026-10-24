#!/usr/bin/env bash
set -euo pipefail

deploy_root="${PEPSA_STATIC_ROOT:-${HOME}/var/www/vendor-frontend}"
cd "$deploy_root"

test -d .git || {
  echo "ERROR: $deploy_root is not a git clone. Clone the vendor frontend repo there first." >&2
  exit 1
}

export PATH="/usr/local/bin:/usr/bin:/bin:${HOME}/.local/bin:${PATH}"
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${HOME}/.nvm/nvm.sh"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  command -v corepack >/dev/null 2>&1 || {
    echo 'ERROR: pnpm and corepack are unavailable' >&2
    exit 1
  }
  corepack enable
  corepack prepare pnpm@12.4.2 --activate
fi

mkdir -p shared
if [[ -f shared/.env ]]; then
  ln -sfn shared/.env .env
fi

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ -z "${VITE_API_URL:-}" ]]; then
  if [[ "$deploy_root" == *staging* ]]; then
    export VITE_API_URL="https://vendorsandbox-api.pepsa.co/api/v1"
  else
    export VITE_API_URL="https://vendor-api.pepsa.co/api/v1"
  fi
fi

echo "Building vendor frontend with VITE_API_URL=$VITE_API_URL"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}"
pnpm install --frozen-lockfile

# Build into a sibling directory and atomically replace dist contents
next_dist="$deploy_root/.dist-next-$$"
prev_dist="$deploy_root/.dist-prev-$$"
rm -rf "$next_dist" "$prev_dist"

pnpm build

# Move build output to temporary location, then move files to deploy_root
test -f "$deploy_root/dist/index.html" || {
  echo "ERROR: build failed to generate dist/index.html" >&2
  exit 1
}

# The Nginx site serves from $deploy_root directly (e.g. root /home/pepsa/var/www/vendor-frontend-staging;)
# Copy generated assets and index.html to deploy_root so nginx can serve them immediately
cp -r "$deploy_root"/dist/* "$deploy_root"/

echo "Vendor frontend built at $(git rev-parse --short HEAD) in $deploy_root"

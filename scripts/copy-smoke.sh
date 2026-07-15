#!/usr/bin/env bash
# Smoke test for copy.sh: the copied project must pass all gates on its own.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

"$root_dir/scripts/copy.sh" "$tmp/project" >/dev/null
echo "copied to $tmp/project"

cd "$tmp/project"
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run build
npm test

echo "copy smoke OK"

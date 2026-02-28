#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== 1/3 Building ==="
bun run build

echo ""
echo "=== 2/3 Inlining CSS ==="
python3 inline-css.py

echo ""
echo "=== 3/3 Deploying to KAS ==="
python3 deploy-full.py

echo ""
echo "=== Deploy complete! ==="

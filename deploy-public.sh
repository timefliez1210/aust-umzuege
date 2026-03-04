#!/usr/bin/env bash
# Deploy public site only (excludes admin dashboard)
set -euo pipefail
cd "$(dirname "$0")"

echo "=== 1/3 Building ==="
bun run build

echo ""
echo "=== 2/3 Inlining CSS ==="
python3 inline-css.py

echo ""
echo "=== 3/3 Deploying (public only) to KAS ==="
python3 deploy-public.py

echo ""
echo "=== Deploy complete! ==="

#!/usr/bin/env bash
# Deploy admin dashboard only (excludes public pages)
set -euo pipefail
cd "$(dirname "$0")"

echo "=== 1/3 Building ==="
bun run build

echo ""
echo "=== 2/3 Inlining CSS ==="
python3 inline-css.py

echo ""
echo "=== 3/3 Deploying (admin only) to KAS ==="
python3 deploy-admin.py

echo ""
echo "=== Deploy complete! ==="

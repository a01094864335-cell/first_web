#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m unittest discover -s tests -q
python scripts/sync-avatar-metadata.py --check
node scripts/test-client.cjs
node scripts/test-demo.cjs
node tests/test_avatar_demo.cjs
node tests/test_avatar_runtime.mjs
node scripts/test-ui.cjs
node avatar02/test-viewer.mjs
python avatar02/tools/validate_assets.py --expected-items 101
python avatar02/tools/test_expansion50.py
node --check script.js
node --check demo-api.js
node --check avatar-runtime.js
printf '\nAll selected automated checks passed. This does not replace browser/device visual QA.\n'

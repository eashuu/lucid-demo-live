#!/usr/bin/env bash
# Behind? Copy a finished checkpoint into your project and keep going.
#   bash scripts/checkpoint.sh cp3-answer-stream
# Tags: cp2-search-api, cp3-answer-stream, cp4-ui, cp5-polish
# It replaces src/, scripts/ and package*.json. Your .env.local, AGENTS.md and docs/ stay as they are.
set -euo pipefail

REFERENCE_REPO="${REFERENCE_REPO:-https://github.com/eashuu/lucid.git}"
TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Usage: bash scripts/checkpoint.sh <tag>"
  echo "Tags:  cp2-search-api  cp3-answer-stream  cp4-ui  cp5-polish"
  exit 1
fi

echo "Fetching $TAG from $REFERENCE_REPO ..."
git fetch --quiet --no-tags "$REFERENCE_REPO" "refs/tags/$TAG:refs/tags/$TAG"

paths=()
for path in src scripts package.json package-lock.json; do
  if git cat-file -e "$TAG:$path" 2>/dev/null; then paths+=("$path"); fi
done
git checkout "$TAG" -- "${paths[@]}"

npm install --no-audit --no-fund
echo
echo "Done: your project now has the code from $TAG."
echo "Restart the dev server (Ctrl+C, then npm run dev) and carry on with the next mission."

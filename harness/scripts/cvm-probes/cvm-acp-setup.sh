#!/bin/bash
# DSH-2.5 task 2 setup: finish the acp profile (allowBuilds patch + re-add).
set -u
export PATH="$HOME/node/bin:$PATH"
export DSH_HOME="$HOME/larry-dsh-home"
cd "$HOME/harness" || exit 1
D=node_modules/@deepseek-ai/dsh/lib/bin.js
WS="$DSH_HOME/profiles/acp/pnpm-workspace.yaml"

if [ -f "$WS" ]; then
  sed -i 's/set this to true or false/false/g' "$WS"
  echo "--- patched allowBuilds:"
  grep -A6 allowBuilds "$WS" || true
fi

echo "=== add base (2nd) ==="
node $D plugin --profile acp add @deepseek-ai/dsh-base@0.1.2-rc.1 2>&1 | tail -2
echo "=== add acp-app ==="
node $D plugin --profile acp add @deepseek-ai/dsh-acp-app@0.1.2-rc.1 2>&1 | tail -2
echo "=== deps count ==="
ls "$DSH_HOME/profiles/acp/node_modules/@deepseek-ai" | wc -l
echo "=== manifest ==="
cat "$DSH_HOME/profiles/acp/package.json"

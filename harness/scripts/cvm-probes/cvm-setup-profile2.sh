#!/bin/bash
# CVM Step 0 setup v2: build sdk profile in an isolated DSH_HOME (correct paths).
set -u
export PATH="$HOME/node/bin:$PATH"
# 默认落 ~/.dsh（凭据在此）；需隔离时由调用方显式传 DSH_HOME=...
# （老大 2026-09-14 纪律：同一环境只用一个 home；larry-dsh-home 不再作运行 home）
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
mkdir -p "$DSH_HOME"
cd "$HOME/harness" || exit 1
DSH="node_modules/@deepseek-ai/dsh/lib/bin.js"

echo "=== dsh entry check ==="
ls -l "$DSH" || exit 1

echo "=== add @deepseek-ai/dsh-base (1st; may exit 1 on pnpm allowBuilds) ==="
node "$DSH" plugin --profile sdk add @deepseek-ai/dsh-base@0.1.2-rc.1 2>&1 | tail -4

WS="$DSH_HOME/profiles/sdk/pnpm-workspace.yaml"
if [ -f "$WS" ]; then
  sed -i 's/set this to true or false/false/g' "$WS"
  echo "--- patched allowBuilds:"
  grep -A6 'allowBuilds' "$WS" || true
fi

echo "=== add @deepseek-ai/dsh-base (2nd; expect exit 0) ==="
node "$DSH" plugin --profile sdk add @deepseek-ai/dsh-base@0.1.2-rc.1 2>&1 | tail -3

echo "=== add @deepseek-ai/dsh-sdk-app ==="
node "$DSH" plugin --profile sdk add @deepseek-ai/dsh-sdk-app@0.1.2-rc.1 2>&1 | tail -3

echo "=== profile manifest ==="
cat "$DSH_HOME/profiles/sdk/package.json"

echo "=== profile node_modules/@deepseek-ai ==="
ls "$DSH_HOME/profiles/sdk/node_modules/@deepseek-ai" 2>/dev/null | head -20

echo "=== profile dir ==="
ls "$DSH_HOME/profiles/sdk"

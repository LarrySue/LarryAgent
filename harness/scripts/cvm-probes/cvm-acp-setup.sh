#!/bin/bash
# DSH-2.5 task 2 setup: finish the acp profile (allowBuilds patch + re-add).
set -u
export PATH="$HOME/node/bin:$PATH"
# 默认落 ~/.dsh（凭据在此）；需隔离时由调用方显式传 DSH_HOME=...
# （老大 2026-09-14 纪律：同一环境只用一个 home；larry-dsh-home 不再作运行 home）
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
# 版本参数化（2026-09-17）：本组脚本原钉 `0.1.2-rc.1`（012 期复现件）。
# 版本字面量已抽为变量：调用方可 `DSH_VERSION=0.1.2-rc.1 ./x.sh` 复现旧代际；
# 不传则取当前代际基线。下同。
DSH_VERSION="${DSH_VERSION:-0.1.5-rc.2}"
cd "$HOME/harness" || exit 1
D=node_modules/@deepseek-ai/dsh/lib/bin.js
WS="$DSH_HOME/profiles/acp/pnpm-workspace.yaml"

if [ -f "$WS" ]; then
  sed -i 's/set this to true or false/false/g' "$WS"
  echo "--- patched allowBuilds:"
  grep -A6 allowBuilds "$WS" || true
fi

echo "=== add base (2nd) ==="
node $D plugin --profile acp add @deepseek-ai/dsh-base@${DSH_VERSION} 2>&1 | tail -2
echo "=== add acp-app ==="
node $D plugin --profile acp add @deepseek-ai/dsh-acp-app@${DSH_VERSION} 2>&1 | tail -2
echo "=== deps count ==="
ls "$DSH_HOME/profiles/acp/node_modules/@deepseek-ai" | wc -l
echo "=== manifest ==="
cat "$DSH_HOME/profiles/acp/package.json"

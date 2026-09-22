#!/bin/bash
# CVM DSH-2.5 Step 0 probe: stdio PoC with cold-start timing and combined RSS sampling.
# usage: bash cvm-step0.sh <default|explicit>
#   default  = 不设 DSH_HOME（落 ~/.dsh，凭据在此）—— 2026-09-14 起的新默认
#   explicit = ⛔ 已退役（2026-09-22 老大裁 A）：原目标 ~/larry-dsh-home 的 sdk / acp 两个
#              profile 已同分区 mv 退役 ⇒ 本模式现为**显式拒绝**（exit 3），参数位保留以防误用
# requires DEEPSEEK_API_KEY in env (injected by caller; never printed)
set -u
export PATH="$HOME/node/bin:$PATH"
cd "$HOME/harness" || exit 1
MODE="${1:-default}"

if [ "$MODE" = "explicit" ]; then
  # 2026-09-22 老大裁 (A)：~/larry-dsh-home 的 sdk / acp 两个 profile 已退役
  #   （备份 = profiles/{sdk,acp}.bak.20260922-*）⇒ 该 home 已不是可用运行面，
  #   「负向对照器材」定位随之终结。
  # ⛔ 此处必须显式拒绝并退出，**不得**删掉本分支让 explicit fallthrough 到 default ——
  #   那会让 `cvm-step0.sh explicit` 静默改在 ~/.dsh（真实库）上跑探针，
  #   把「隔离复跑」变成「打真实库」。
  echo "!! explicit 模式已退役（2026-09-22）：~/larry-dsh-home 的 sdk / acp profile 已删除。" >&2
  echo "!! 该 home 已不是可用运行面；负向对照器材定位随之终结。" >&2
  echo "!! 如仍需隔离复跑，请另立新的独立 home 并更新本脚本，勿复用本分支。" >&2
  exit 3
else
  unset DSH_HOME
fi

echo "=== mode=$MODE  DSH_HOME=${DSH_HOME:-<unset>}  cwd=$PWD ==="
echo "=== node: $($(command -v node) --version) ==="

start=$(date +%s%3N)
node scripts/dsh-prompt.mjs "Reply with exactly: probe ok" > /tmp/step0.out 2> /tmp/step0.err &
pid=$!
peak=0
samples=0
while kill -0 "$pid" 2>/dev/null; do
  ps -eo pid,ppid,rss --no-headers > /tmp/ps.snap 2>/dev/null
  awk -v root="$pid" '
    { par[$1]=$2; rss[$1]=$3 }
    END {
      for (i in par) { kids[par[i]] = kids[par[i]] " " i }
      q[1]=root; h=1; t=1; tot=0
      while (h<=t) { x=q[h++]; tot+=rss[x]; n=split(kids[x], a, " "); for (k=1;k<=n;k++) if (a[k]!="") q[++t]=a[k] }
      print tot
    }' /tmp/ps.snap > /tmp/rss.txt
  cur=$(cat /tmp/rss.txt 2>/dev/null)
  if [ -n "$cur" ] && [ "$cur" -gt "$peak" ] 2>/dev/null; then peak=$cur; fi
  samples=$((samples+1))
  sleep 0.2
done
wait "$pid"; rc=$?
end=$(date +%s%3N)

echo "--- result ---"
echo "exit=$rc  elapsed_ms=$((end-start))  peak_tree_rss_kb=$peak  peak_tree_rss_mb=$((peak/1024))  samples=$samples"
echo "--- stdout ---"
cat /tmp/step0.out
echo "--- stderr ---"
cat /tmp/step0.err

echo "--- DSH_HOME landing check ---"
ls -d "$HOME/.dsh" 2>/dev/null && echo "  -> exists: ~/.dsh"
ls -d "$PWD/.dsh" 2>/dev/null && echo "  -> exists: cwd/.dsh"
if [ "$MODE" = "default" ]; then
  echo "recent session files (last 5 min):"
  find "$HOME" "$PWD" -maxdepth 4 -name '*.jsonl' -newermt '-5 minutes' 2>/dev/null | head -5
fi
echo "--- key leak check (should be empty) ---"
grep -rl "$DEEPSEEK_API_KEY" /tmp/step0.out /tmp/step0.err 2>/dev/null || echo "no key in outputs"

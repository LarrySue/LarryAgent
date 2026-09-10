#!/bin/bash
# CVM DSH-2.5 Step 0 probe: stdio PoC with cold-start timing and combined RSS sampling.
# usage: bash cvm-step0.sh <explicit|default>
# requires DEEPSEEK_API_KEY in env (injected by caller; never printed)
set -u
export PATH="$HOME/node/bin:$PATH"
cd "$HOME/harness" || exit 1
MODE="${1:-explicit}"

if [ "$MODE" = "explicit" ]; then
  export DSH_HOME="$HOME/larry-dsh-home"
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

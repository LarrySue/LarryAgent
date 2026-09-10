#!/bin/bash
# DSH-2.5 task 1 (run+verify): run one prompt with storage-domain routed to the
# externally-pinned SQLite file, then inspect the artifact and the negative control.
# requires DEEPSEEK_API_KEY in env (injected by caller).
set -u
export PATH="$HOME/node/bin:$PATH"
export DSH_HOME="$HOME/larry-dsh-home"
cd "$HOME/harness" || exit 1

echo "=== BEFORE: json storages file count ==="
find "$DSH_HOME/storages" -type f 2>/dev/null | wc -l
echo "=== BEFORE: target dir ==="
ls /home/ubuntu/larry-data 2>&1 || echo "(absent)"

echo "=== RUN: prompt through sdk profile (storage-domain -> sqlite) ==="
node scripts/dsh-prompt.mjs "Reply with exactly: probe ok"
echo "run_exit=$?"

echo "=== AFTER: target dir ==="
ls -la /home/ubuntu/larry-data 2>&1

echo "=== AFTER: file magic (sqlite header = 'SQLite format 3') ==="
head -c 16 /home/ubuntu/larry-data/larry.db | od -c | head -2

echo "=== AFTER: db inspection via node:sqlite ==="
node -e '
const { DatabaseSync } = require("node:sqlite");
const p = "/home/ubuntu/larry-data/larry.db";
const db = new DatabaseSync(p);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = \x27table\x27 ORDER BY name").all();
console.log("tables:", tables.map(t => t.name).join(", "));
console.log("user_version:", JSON.stringify(db.prepare("PRAGMA user_version").get()));
for (const t of tables) {
  const c = db.prepare("SELECT COUNT(*) AS n FROM \x27" + t.name + "\x27").get();
  console.log("  rows[" + t.name + "]=" + c.n);
}
try { console.log("units:", JSON.stringify(db.prepare("SELECT * FROM units").all())); } catch (e) { console.log("units read err:", e.message); }
try { console.log("globals:", JSON.stringify(db.prepare("SELECT * FROM unit_globals").all()).slice(0, 400)); } catch (e) { console.log("globals read err:", e.message); }
'

echo "=== AFTER: negative control - json storages count / recent files ==="
find "$DSH_HOME/storages" -type f 2>/dev/null | wc -l
echo "recent (<2min) json files under storages:"
find "$DSH_HOME/storages" -type f -newermt '-2 minutes' 2>/dev/null | head -5
echo "(empty above === json backend did NOT receive this run)"

echo "=== AFTER: session log still written (independent of storage backend) ==="
find "$DSH_HOME/sessions" -name '*.jsonl*' -newermt '-2 minutes' 2>/dev/null | head -3

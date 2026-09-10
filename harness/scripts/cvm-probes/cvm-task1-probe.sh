#!/bin/bash
# DSH-2.5 task 1 (final): mount our own storage-domain probe and prove OUR data
# lands in the externally pinned SQLite file.
# requires DEEPSEEK_API_KEY in env (injected by caller; never printed).
set -u
export PATH="$HOME/node/bin:$PATH"
export DSH_HOME="$HOME/larry-dsh-home"
cd "$HOME/harness" || exit 1
DSH="node_modules/@deepseek-ai/dsh/lib/bin.js"

echo "=== 1. add @larryagent/plugin-storage-probe (link to local dir) ==="
node "$DSH" plugin --profile sdk add "$HOME/harness/packages/plugin-storage-probe" 2>&1 | tail -5

echo "=== 2. profile patch (storage routing + our probe row) ==="
cat > "$DSH_HOME/profiles/sdk/cordis.patch.yml" <<'EOF'
- id: storage-json
  disabled: true

- insert:
    - id: storage-sqlite
      name: '@deepseek-ai/dsh-storage-sqlite'
      config:
        path: /home/ubuntu/larry-data/larry.db

    - id: larry-storage-probe
      name: '@larryagent/plugin-storage-probe'

- id: storage-domain
  config:
    backend: sqlite
EOF
cat "$DSH_HOME/profiles/sdk/cordis.patch.yml"

echo "=== 3. RUN profile (probe writes on activation) ==="
node scripts/dsh-prompt.mjs "Reply with exactly: probe ok"
echo "run_exit=$?"

echo "=== 4. inspect db: our own domain table ==="
node -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("/home/ubuntu/larry-data/larry.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = \x27table\x27 ORDER BY name").all();
console.log("tables:", tables.map(t => t.name).join(", "));
console.log("units:", JSON.stringify(db.prepare("SELECT * FROM units").all()));
try {
  const rows = db.prepare("SELECT * FROM u_larry_probe_items").all();
  console.log("OUR PROBE ROWS:", JSON.stringify(rows));
} catch (e) {
  console.log("probe table MISSING:", e.message);
}
'

echo "=== 5. file stat ==="
ls -la /home/ubuntu/larry-data/

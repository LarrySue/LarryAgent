#!/bin/bash
# DSH-2.5 task 1 (setup+static): mount storage-sqlite as an external SQLite backend
# for the sdk profile, pointing at a path OUTSIDE DSH_HOME, and disable storage-json
# so any SQLite file proves the routed backend actually switched.
set -u
export PATH="$HOME/node/bin:$PATH"
export DSH_HOME="$HOME/larry-dsh-home"
cd "$HOME/harness" || exit 1
DSH="node_modules/@deepseek-ai/dsh/lib/bin.js"

echo "=== 1. add storage-sqlite as a profile dependency ==="
node "$DSH" plugin --profile sdk add @deepseek-ai/dsh-storage-sqlite@0.1.2-rc.1 2>&1 | tail -5

echo "=== 2. profile manifest ==="
cat "$DSH_HOME/profiles/sdk/package.json"

echo "=== 3. installed package check ==="
ls -d "$DSH_HOME/profiles/sdk/node_modules/@deepseek-ai/dsh-storage-sqlite" 2>&1

echo "=== 4. write profile user patch (external path + backend switch) ==="
cat > "$DSH_HOME/profiles/sdk/cordis.patch.yml" <<'EOF'
# DSH-2.5 task 1: route storage-domain to an externally-pinned SQLite file.
- id: storage-json
  disabled: true

- insert:
    - id: storage-sqlite
      name: '@deepseek-ai/dsh-storage-sqlite'
      config:
        path: /home/ubuntu/larry-data/larry.db

- id: storage-domain
  config:
    backend: sqlite
EOF
cat "$DSH_HOME/profiles/sdk/cordis.patch.yml"

echo "=== 5. dump-config: storage rows after patch ==="
node "$DSH" --profile sdk --dump-config 2>&1 | grep -B1 -A5 -i "storage" | head -50

echo "=== 6. pre-run state of target path (should NOT exist yet) ==="
ls -la /home/ubuntu/larry-data 2>&1 || echo "target dir absent (expected before run)"

echo "=== 7. pre-run storages dir state (json backend would write here) ==="
find "$DSH_HOME/storages" -type f 2>/dev/null | head -5

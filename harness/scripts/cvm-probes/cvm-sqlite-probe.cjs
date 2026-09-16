// 用 Node 内嵌 node:sqlite（DSH 实际运行时）重跑并发正反两组
const { DatabaseSync } = require('node:sqlite');
const { spawn } = require('child_process');
const fs = require('fs');

const DB = process.argv[2];
const TIMEOUT = parseInt(process.argv[3], 10);
const ROLE = process.argv[4];
const N_PROC = 20;
const N_WRITE = 10;

if (ROLE === 'worker') {
  const pid = parseInt(process.argv[5], 10);
  let errs = 0;
  try {
    const db = new DatabaseSync(DB);
    db.exec(`PRAGMA busy_timeout=${TIMEOUT}`);
    const stmt = db.prepare('INSERT INTO t (pid, i) VALUES (?, ?)');
    for (let i = 0; i < N_WRITE; i++) {
      try {
        stmt.run(pid, i);
      } catch (e) {
        errs++;
      }
    }
    db.close();
  } catch (e) {
    // 连接或 prepare 阶段就被锁挡下：整轮计入失败
    errs = N_WRITE;
  }
  fs.writeFileSync(`/tmp/nerr_${pid}`, String(errs));
  process.exit(0);
}

// ---- parent ----
for (const p of [DB, DB + '-wal', DB + '-shm']) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
const db0 = new DatabaseSync(DB);
db0.exec('PRAGMA journal_mode=WAL');
db0.exec('CREATE TABLE t (pid INT, i INT)');
const ver = db0.prepare('select sqlite_version() v').get().v;
db0.close();

const t0 = Date.now();
const jobs = [];
for (let p = 0; p < N_PROC; p++) {
  jobs.push(
    new Promise((res) => {
      const c = spawn(process.execPath, [__filename, DB, String(TIMEOUT), 'worker', String(p)], {
        stdio: 'ignore',
      });
      c.on('close', () => res());
    })
  );
}
Promise.all(jobs).then(() => {
  const el = (Date.now() - t0) / 1000;
  let totalErr = 0;
  for (let p = 0; p < N_PROC; p++) {
    totalErr += parseInt(fs.readFileSync(`/tmp/nerr_${p}`, 'utf8'), 10);
  }
  const db = new DatabaseSync(DB);
  const n = db.prepare('SELECT COUNT(*) c FROM t').get().c;
  db.close();
  console.log(`sqlite_lib=${ver} busy_timeout=${TIMEOUT}ms procs=${N_PROC} writes=${N_PROC * N_WRITE}`);
  console.log(`locked_errors=${totalErr} COUNT=${n} elapsed=${el.toFixed(2)}s`);
});

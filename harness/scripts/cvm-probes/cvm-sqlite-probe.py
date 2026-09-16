import sqlite3, os, sys, time
from multiprocessing import Process

DB = sys.argv[1]
TIMEOUT = int(sys.argv[2])  # busy_timeout in ms
N_PROC = 20
N_WRITE = 10  # total = 200


def worker(pid):
    conn = sqlite3.connect(DB, timeout=TIMEOUT / 1000.0, isolation_level=None)
    conn.execute('PRAGMA busy_timeout=%d' % TIMEOUT)
    errs = 0
    for i in range(N_WRITE):
        try:
            conn.execute('INSERT INTO t (pid, i) VALUES (?,?)', (pid, i))
        except sqlite3.OperationalError as e:
            errs += 1
    conn.close()
    with open('/tmp/err_%d' % pid, 'w') as f:
        f.write(str(errs))


def main():
    for p in [DB, DB + '-wal', DB + '-shm']:
        if os.path.exists(p):
            os.remove(p)
    conn = sqlite3.connect(DB)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('CREATE TABLE t (pid INT, i INT)')
    conn.close()

    ps = [Process(target=worker, args=(p,)) for p in range(N_PROC)]
    t0 = time.time()
    for p in ps:
        p.start()
    for p in ps:
        p.join()
    el = time.time() - t0

    total_err = 0
    for p in range(N_PROC):
        with open('/tmp/err_%d' % p) as f:
            total_err += int(f.read())

    conn = sqlite3.connect(DB)
    n = conn.execute('SELECT COUNT(*) FROM t').fetchone()[0]
    conn.close()
    print('sqlite_lib=%s' % sqlite3.sqlite_version)
    print('busy_timeout=%dms procs=%d writes=%d' % (TIMEOUT, N_PROC, N_PROC * N_WRITE))
    print('locked_errors=%d' % total_err)
    print('COUNT=%d' % n)
    print('elapsed=%.2fs' % el)


if __name__ == '__main__':
    main()

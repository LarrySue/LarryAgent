import { grantArgs, launcherPath, probe } from '@deepseek-ai/node-addon-landlock-run';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const launcher = launcherPath();
const status = probe(launcher);
console.log('user            =', os.userInfo().username, 'uid=', process.getuid());
console.log('launcher        =', launcher);
console.log('probe           =', status);

function run(label, cmd, grants) {
  const argv = [launcher, ...grantArgs(grants), '--', 'bash', '-c', cmd];
  const r = spawnSync(argv[0], argv.slice(1), { encoding: 'utf8' });
  const out = (r.stdout || '').trim().replace(/\n/g, '|');
  const err = (r.stderr || '').trim().replace(/\n/g, '|').slice(0, 120);
  console.log(`${label} exit=${r.status} out="${out}" err="${err}"`);
}

// 正向：写已授权的 readWrite 目录 -> 应成功
run('A 写授权目录 ', 'echo ok > /tmp/work/probe.txt && cat /tmp/work/probe.txt', { readOnly: ['/'], readWrite: ['/tmp/work'] });

// 反向1：写未授权目录 -> 应被拒（fail-closed）
run('B 写未授权   ', 'echo bad > /home/ubuntu/LL_SHOULD_FAIL 2>&1 && echo WROTE_OK', { readOnly: ['/'], readWrite: ['/tmp/work'] });

// 反向2：受限于白名单后读未授权路径 -> 应被拒
run('C 读未授权   ', 'cat /home/ubuntu/.bashrc 2>&1 | head -c 60; echo', { readOnly: ['/usr', '/lib', '/bin'], readWrite: ['/tmp/work'] });

// 关键：sandbox 内能否联网（源码无 LANDLOCK_ACCESS_NET，预期不受限）
run('E 网络外联   ', 'curl -s -o /dev/null -w "net=%{http_code}" --max-time 8 --noproxy "*" http://www.baidu.com; echo', { readOnly: ['/'], readWrite: ['/tmp/work'] });

// 反向3：受限于白名单后读已授权路径 -> 应成功（证明上一条不是"全都拒"）
run('D 读已授权   ', 'cat /etc/hostname 2>&1 | head -c 40; echo', { readOnly: ['/usr', '/lib', '/bin', '/etc'], readWrite: ['/tmp/work'] });

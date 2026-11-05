import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { publish, readConfig } from './deploy-web.mjs';

async function fixture(t) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ps5-deploy-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'ps5-jailbreak-hub');
  const dist = path.join(temporary, 'dist');
  await fs.mkdir(path.join(dist, 'assets'), { recursive: true });
  const config = {
    root,
    basePath: '/ps5/',
    siteUrl: 'https://voidbai.com/ps5/',
  };
  await fs.writeFile(
    path.join(dist, 'site-config.json'),
    JSON.stringify(config),
  );
  await fs.writeFile(
    path.join(dist, 'index.html'),
    '<script src="/ps5/assets/first.js"></script>',
  );
  await fs.writeFile(path.join(dist, 'assets/first.js'), 'first');
  return {
    config,
    dist,
    commit: 'a'.repeat(40),
    build: async () => {},
    check: async () => {},
  };
}
test('发布、旧资源保留、线上失败恢复及人工回退', async (t) => {
  const options = await fixture(t);
  const first = await publish(options);
  await fs.writeFile(path.join(options.dist, 'assets/second.js'), 'second');
  const second = await publish({ ...options, commit: 'b'.repeat(40) });
  const root = options.config.root;
  assert.equal(
    await fs.readFile(path.join(root, 'shared/ps5/assets/first.js'), 'utf8'),
    'first',
  );
  await assert.rejects(
    publish({
      ...options,
      check: async () => {
        throw new Error('wrong release');
      },
    }),
    /已恢复/,
  );
  assert.equal(
    await fs.readlink(path.join(root, 'current')),
    `releases/${second.release}`,
  );
  await publish({ ...options, rollback: first.release });
  assert.equal(
    await fs.readlink(path.join(root, 'current')),
    `releases/${first.release}`,
  );
  await assert.rejects(fs.stat(path.join(root, '.deploy-lock')), {
    code: 'ENOENT',
  });
});
test('首次失败不留下生效链接；构建失败不改变上一版', async (t) => {
  const options = await fixture(t);
  await assert.rejects(
    publish({
      ...options,
      check: async () => {
        throw new Error('offline');
      },
    }),
    /已恢复/,
  );
  await assert.rejects(fs.lstat(path.join(options.config.root, 'current')), {
    code: 'ENOENT',
  });
  const first = await publish(options);
  await assert.rejects(
    publish({
      ...options,
      build: async () => {
        throw new Error('build');
      },
    }),
    /build/,
  );
  assert.equal(
    await fs.readlink(path.join(options.config.root, 'current')),
    `releases/${first.release}`,
  );
});
test('拒绝覆盖非发布目录、资源冲突、未知回退和错误站点', async (t) => {
  const options = await fixture(t);
  await publish(options);
  await fs.writeFile(path.join(options.dist, 'assets/first.js'), 'changed');
  await assert.rejects(publish(options), { code: 'EEXIST' });
  await assert.rejects(
    publish({ ...options, rollback: '../../elsewhere' }),
    /编号无效/,
  );
  await fs.unlink(path.join(options.config.root, 'current'));
  await fs.mkdir(path.join(options.config.root, 'current'));
  await assert.rejects(publish(options), /不是发布链接/);
  assert.throws(
    () => readConfig('VITE_BASE_PATH=/\nPS5_WEB_ROOT=/var/www'),
    /生产网址/,
  );
});
test('CI SSH 使用严格主机校验，凭据临时文件在退出后删除', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ps5-ssh-test-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(temporary, 'ssh'),
    '#!/bin/bash\nset -eu\n[[ "$*" == *StrictHostKeyChecking=yes* ]]\n[[ "$(stat -c %a "$2" 2>/dev/null || stat -f %Lp "$2")" == 600 ]]\ncat >/dev/null\n',
    { mode: 0o755 },
  );
  execFileSync('bash', ['scripts/ci-deploy.sh'], {
    env: {
      ...process.env,
      PATH: `${temporary}:${process.env.PATH}`,
      RUNNER_TEMP: temporary,
      SSH_HOST: 'example.com',
      SSH_USER: 'deploy',
      SSH_PRIVATE_KEY: 'fake-test-key',
      SSH_KNOWN_HOSTS: 'fake-public-host',
      DEPLOY_SHA: 'a'.repeat(40),
    },
  });
  assert.deepEqual(await fs.readdir(temporary), ['ssh']);
});
test('服务端只快进 main，拒绝过期任务和脏工作区，正常退出清锁', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ps5-git-test-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const git = (cwd, ...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const source = path.join(temporary, 'source');
  const server = path.join(temporary, 'server');
  await fs.mkdir(source);
  git(source, 'init', '-b', 'main');
  git(source, 'config', 'user.email', 'test@example.com');
  git(source, 'config', 'user.name', 'Test');
  await fs.mkdir(path.join(source, 'scripts'));
  await fs.copyFile(
    'scripts/prod-update.sh',
    path.join(source, 'scripts/prod-update.sh'),
  );
  await fs.writeFile(
    path.join(source, 'scripts/docker-deploy.sh'),
    '#!/bin/bash\necho fixture worker\n',
  );
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'fixture');
  git(temporary, 'clone', source, server);
  const sha = git(source, 'rev-parse', 'HEAD');
  execFileSync('bash', ['scripts/prod-update.sh', sha], {
    cwd: server,
    stdio: 'pipe',
  });
  await assert.rejects(fs.stat(path.join(server, '.git/ps5-update.lock')), {
    code: 'ENOENT',
  });
  assert.throws(
    () =>
      execFileSync('bash', ['scripts/prod-update.sh', 'b'.repeat(40)], {
        cwd: server,
        stdio: 'pipe',
      }),
    /已过期/,
  );
  await fs.writeFile(path.join(server, 'dirty'), 'keep');
  assert.throws(
    () =>
      execFileSync('bash', ['scripts/prod-update.sh', sha], {
        cwd: server,
        stdio: 'pipe',
      }),
    /有改动/,
  );
  assert.equal(await fs.readFile(path.join(server, 'dirty'), 'utf8'), 'keep');
});
test('Docker 发布隔离构建上下文，同用户挂载，不操作现有服务', async (t) => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'ps5-docker-test-'),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'ps5-jailbreak-hub');
  await fs.mkdir(root);
  const log = path.join(temporary, 'calls');
  await fs.writeFile(
    path.join(temporary, 'docker'),
    '#!/bin/bash\nset -eu\nprintf "%s\\n" "$*" >> "$TEST_DOCKER_LOG"\nif [[ "$*" == *--input-type=module* ]]; then printf "%s\\n" "$TEST_WEB_ROOT"; fi\n',
    { mode: 0o755 },
  );
  execFileSync('bash', ['scripts/docker-deploy.sh', 'deploy', 'a'.repeat(40)], {
    env: {
      ...process.env,
      PATH: `${temporary}:${process.env.PATH}`,
      TEST_DOCKER_LOG: log,
      TEST_WEB_ROOT: root,
    },
  });
  const calls = (await fs.readFile(log, 'utf8')).split('\n');
  assert.match(calls[0], /deploy\/docker$/);
  assert.match(calls[1], /readonly/);
  assert.match(calls[2], /--user \d+:\d+ --network host/);
  assert.match(calls[2], /node scripts\/deploy-web.mjs deploy a{40}/);
  assert.doesNotMatch(
    calls.join('\n'),
    /docker.sock|privileged|compose|restart|systemctl/,
  );
});
test('拉取连接中断后重试；持续失败不更新提交、不启动发布且释放锁', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'ps5-fetch-test-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  const git = (cwd, ...args) =>
    execFileSync(realGit, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const source = path.join(temporary, 'source');
  const server = path.join(temporary, 'server');
  const bin = path.join(temporary, 'bin');
  const count = path.join(temporary, 'count');
  const marker = path.join(temporary, 'worker');
  await fs.mkdir(path.join(source, 'scripts'), { recursive: true });
  await fs.mkdir(bin);
  git(source, 'init', '-b', 'main');
  git(source, 'config', 'user.email', 'test@example.com');
  git(source, 'config', 'user.name', 'Test');
  await fs.copyFile(
    'scripts/prod-update.sh',
    path.join(source, 'scripts/prod-update.sh'),
  );
  await fs.writeFile(
    path.join(source, 'scripts/docker-deploy.sh'),
    '#!/bin/bash\nprintf "%s" "$2" > "$TEST_WORKER"\n',
  );
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'initial');
  git(temporary, 'clone', source, server);
  const initial = git(server, 'rev-parse', 'HEAD');
  await fs.writeFile(path.join(source, 'new-file'), 'new commit');
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'next');
  const latest = git(source, 'rev-parse', 'HEAD');
  await fs.writeFile(
    path.join(bin, 'git'),
    `#!/bin/bash
set -eu
if [[ "$1" == fetch ]]; then
  count=0
  if [[ -f "$TEST_COUNT" ]]; then read -r count < "$TEST_COUNT"; fi
  count=$((count + 1))
  printf '%s\\n' "$count" > "$TEST_COUNT"
  if [[ "$TEST_ALWAYS_FAIL" == 1 || "$count" -le 2 ]]; then echo 'GnuTLS recv error (-110)' >&2; exit 128; fi
fi
exec "$TEST_REAL_GIT" "$@"
`,
    { mode: 0o755 },
  );
  await fs.writeFile(path.join(bin, 'sleep'), '#!/bin/bash\nexit 0\n', {
    mode: 0o755,
  });
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    TEST_COUNT: count,
    TEST_WORKER: marker,
    TEST_REAL_GIT: realGit,
    TEST_ALWAYS_FAIL: '1',
  };
  assert.throws(
    () =>
      execFileSync('bash', ['scripts/prod-update.sh', latest], {
        cwd: server,
        env,
        stdio: 'pipe',
      }),
    /连续 3 次拉取失败/,
  );
  assert.equal(git(server, 'rev-parse', 'HEAD'), initial);
  await assert.rejects(fs.stat(marker), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(server, '.git/ps5-update.lock')), {
    code: 'ENOENT',
  });
  await fs.unlink(count);
  execFileSync('bash', ['scripts/prod-update.sh', latest], {
    cwd: server,
    env: { ...env, TEST_ALWAYS_FAIL: '0' },
    stdio: 'pipe',
  });
  assert.equal((await fs.readFile(count, 'utf8')).trim(), '3');
  assert.equal(git(server, 'rev-parse', 'HEAD'), latest);
  assert.equal(await fs.readFile(marker, 'utf8'), latest);
});

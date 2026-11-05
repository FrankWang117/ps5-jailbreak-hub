import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const releasePattern = /^[a-f0-9]{40}-[0-9]+-[a-f0-9-]{36}$/;
const exists = async (name) => {
  try {
    return await fs.lstat(name);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};
export function readConfig(text) {
  const config = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^(VITE_BASE_PATH|VITE_SITE_URL|PS5_WEB_ROOT)=(.*)$/,
    );
    if (match)
      config[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  if (
    config.VITE_BASE_PATH !== '/ps5/' ||
    config.VITE_SITE_URL !== 'https://voidbai.com/ps5/'
  )
    throw new Error('生产网址必须为 https://voidbai.com/ps5/');
  const root = config.PS5_WEB_ROOT;
  if (
    !root ||
    !path.isAbsolute(root) ||
    path.resolve(root) !== root ||
    path.basename(root) !== 'ps5-jailbreak-hub'
  )
    throw new Error(
      'PS5_WEB_ROOT 必须为专用绝对目录，末级为 ps5-jailbreak-hub',
    );
  return {
    root,
    basePath: config.VITE_BASE_PATH,
    siteUrl: config.VITE_SITE_URL,
  };
}
async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.'))
      throw new Error('发布目录不能包含符号链接或隐藏文件');
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory())
      result.push(...(await files(path.join(directory, entry.name), relative)));
    else if (entry.isFile()) result.push(relative);
    else throw new Error('发布目录包含特殊文件');
  }
  return result;
}
async function releaseInfo(root, id) {
  if (!releasePattern.test(id)) throw new Error('发布编号无效');
  const directory = path.join(root, 'releases', id);
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('发布目录无效');
  const info = JSON.parse(
    await fs.readFile(path.join(directory, 'ps5/release.json'), 'utf8'),
  );
  if (info.release !== id || info.commit !== id.slice(0, 40))
    throw new Error('发布标记不匹配');
  return info;
}
async function pointer(root, name) {
  const location = path.join(root, name);
  const stat = await exists(location);
  if (!stat) return null;
  if (!stat.isSymbolicLink())
    throw new Error(`${name} 已存在且不是发布链接，停止操作`);
  const target = await fs.readlink(location);
  if (target !== `releases/${path.basename(target)}`)
    throw new Error('链接指向非本项目目录');
  await releaseInfo(root, path.basename(target));
  return path.basename(target);
}
async function switchPointer(root, name, id) {
  const temporary = path.join(root, `.${name}-${randomUUID()}`);
  await fs.symlink(`releases/${id}`, temporary);
  try {
    await fs.rename(temporary, path.join(root, name));
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
export async function probe(siteUrl, info) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const options = {
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      };
      const response = await fetch(
        `${siteUrl}release.json?deployment=${info.release}`,
        options,
      );
      if (!response.ok) throw new Error(`线上版本请求 ${response.status}`);
      const actual = await response.json();
      if (actual.commit !== info.commit || actual.release !== info.release)
        throw new Error('线上发布编号不匹配');
      for (const route of ['', 'about']) {
        const page = await fetch(
          `${siteUrl}${route}?deployment=${info.release}`,
          { ...options, signal: AbortSignal.timeout(8000) },
        );
        if (!page.ok || !(await page.text()).includes('/ps5/assets/'))
          throw new Error('首页或深层路由检查失败');
      }
      return;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw lastError;
}
export async function publish({
  config,
  dist,
  commit,
  rollback,
  build,
  check = probe,
}) {
  const { root, siteUrl } = config;
  if (!path.isAbsolute(root) || path.basename(root) !== 'ps5-jailbreak-hub')
    throw new Error('发布根目录无效');
  await fs.mkdir(root, { recursive: true, mode: 0o755 });
  if ((await fs.lstat(root)).isSymbolicLink())
    throw new Error('发布根目录不能是符号链接');
  for (const directory of ['releases', 'shared']) {
    const target = path.join(root, directory);
    await fs.mkdir(target, { recursive: true, mode: 0o755 });
    if ((await fs.lstat(target)).isSymbolicLink())
      throw new Error('发布子目录不能是符号链接');
  }
  const lock = path.join(root, '.deploy-lock');
  await fs.mkdir(lock); // 并发或遗留锁均停止，不擅自清锁。
  try {
    const old = await pointer(root, 'current');
    await pointer(root, 'previous');
    let id = rollback;
    if (!rollback) {
      if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('提交编号无效');
      await build();
      const list = await files(dist);
      const site = JSON.parse(
        await fs.readFile(path.join(dist, 'site-config.json'), 'utf8'),
      );
      if (
        site.basePath !== config.basePath ||
        site.siteUrl !== siteUrl ||
        !(await fs.readFile(path.join(dist, 'index.html'), 'utf8')).includes(
          '/ps5/assets/',
        )
      )
        throw new Error('构建地址不匹配');
      if (!list.some((name) => name.startsWith(`assets${path.sep}`)))
        throw new Error('缺少构建资源');
      id = `${commit}-${Date.now()}-${randomUUID()}`;
      const destination = path.join(root, 'releases', id, 'ps5');
      await fs.mkdir(destination, { recursive: true, mode: 0o755 });
      await fs.cp(dist, destination, { recursive: true });
      await fs.writeFile(
        path.join(destination, 'release.json'),
        JSON.stringify({ commit, release: id }),
        { mode: 0o644 },
      );
      // 保留旧哈希资源，避免打开旧页面的用户在切换发布后加载失败。
      for (const name of list.filter((name) =>
        name.startsWith(`assets${path.sep}`),
      )) {
        const source = await fs.readFile(path.join(dist, name));
        const target = path.join(root, 'shared', 'ps5', name);
        await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o755 });
        try {
          await fs.writeFile(target, source, { flag: 'wx', mode: 0o644 });
        } catch (error) {
          if (
            error.code !== 'EEXIST' ||
            !(await fs.readFile(target)).equals(source)
          )
            throw error;
        }
      }
    }
    const info = await releaseInfo(root, id);
    await switchPointer(root, 'current', id);
    try {
      await check(siteUrl, info);
    } catch (error) {
      if (old) await switchPointer(root, 'current', old);
      else await fs.unlink(path.join(root, 'current'));
      throw new Error(`线上检查失败，已恢复发布前链接：${error.message}`, {
        cause: error,
      });
    }
    if (old && old !== id) await switchPointer(root, 'previous', old);
    return info;
  } finally {
    await fs.rmdir(lock);
  }
}
async function main() {
  process.umask(0o022);
  const project = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  );
  const [mode, value] = process.argv.slice(2);
  if (
    !['deploy', 'rollback'].includes(mode) ||
    !value ||
    process.argv.length !== 4
  )
    throw new Error(
      '用法：deploy-web.mjs deploy <sha> 或 rollback <release-id>',
    );
  const config = readConfig(
    await fs.readFile(path.join(project, '.env.production'), 'utf8'),
  );
  if (
    config.root === project ||
    config.root.startsWith(`${project}${path.sep}`)
  )
    throw new Error('发布目录不能在源码目录内');
  const build = async () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 12))
      throw new Error('需要 Node >=22.12');
    const version = execFileSync('pnpm', ['--version'], { encoding: 'utf8' });
    if (!version.startsWith('10.')) throw new Error('需要 pnpm 10');
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: project,
      encoding: 'utf8',
    }).trim();
    if (head !== value) throw new Error('工作区提交不匹配');
    const env = {
      ...process.env,
      CI: 'true',
      VITE_BASE_PATH: config.basePath,
      VITE_SITE_URL: config.siteUrl,
    };
    for (const args of [
      ['install', '--frozen-lockfile', '--prod=false'],
      ['--filter', '@ps5/web', 'build'],
    ])
      execFileSync('pnpm', args, { cwd: project, env, stdio: 'inherit' });
  };
  const result = await publish({
    config,
    dist: path.join(project, 'apps/web/dist'),
    commit: value,
    rollback: mode === 'rollback' ? value : undefined,
    build,
  });
  console.log(`发布成功：${result.release}`);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

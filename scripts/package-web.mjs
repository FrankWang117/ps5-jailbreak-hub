import { readFile, mkdir, cp, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'apps/web/dist');
const config = JSON.parse(
  await readFile(path.join(dist, 'site-config.json'), 'utf8'),
);
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(config.basePath))
  throw new Error('构建路径不合法，未打包');
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const dirty =
  execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
const release = path.join(
  root,
  'artifacts/web-release',
  `${commit}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(release, { recursive: true });
const target = path.join(release, config.basePath.slice(1));
await cp(dist, target, { recursive: true, errorOnExist: true, force: false });
const files = {};
async function digest(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await digest(file);
    else if (entry.isFile())
      files[path.relative(release, file).split(path.sep).join('/')] =
        createHash('sha256')
          .update(await readFile(file))
          .digest('hex');
  }
}
await digest(target);
await writeFile(
  path.join(release, 'manifest.json'),
  JSON.stringify({ commit, dirty, ...config, files }, null, 2) + '\n',
);
console.log(
  `静态包：${release}\n包含公开构建设置和文件摘要，不包含 .env 文件；未上传或修改服务器。`,
);

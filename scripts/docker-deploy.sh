#!/usr/bin/env bash
# 在 Linux 腾讯云宿主机以 deploy 用户运行；不重启现有容器。
set -Eeuo pipefail
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
[[ $# -eq 2 && ( "$1" == deploy || "$1" == rollback ) ]] || { echo '用法：docker-deploy.sh deploy <sha> 或 rollback <release-id>' >&2; exit 1; }
[[ "$project_dir" != *,* ]] || { echo '源码路径不能包含逗号。' >&2; exit 1; }
command -v docker >/dev/null || { echo '需要 deploy 用户可用的 Docker，无需宿主机 Node/pnpm。' >&2; exit 1; }
image=ps5-web-builder:node22.14-pnpm10.10
docker build --tag "$image" --file "$project_dir/deploy/docker/Dockerfile" "$project_dir/deploy/docker"
# 配置解析在只读源码挂载中执行，不 source 环境文件，不把配置写入镜像。
web_root=$(docker run --rm --user "$(id -u):$(id -g)" \
  --mount "type=bind,source=$project_dir,target=$project_dir,readonly" \
  --workdir "$project_dir" "$image" node --input-type=module -e \
  'import {readFileSync} from "node:fs"; import {readConfig} from "./scripts/deploy-web.mjs"; console.log(readConfig(readFileSync(".env.production", "utf8")).root);')
[[ "$web_root" =~ ^/[a-zA-Z0-9_./-]+/ps5-jailbreak-hub$ && -d "$web_root" && ! -L "$web_root" && -w "$web_root" && "$web_root" != "$project_dir" && "$web_root" != "$project_dir/"* ]] || { echo '请先由 ubuntu 创建专用静态根目录并授权 deploy；检查 PS5_WEB_ROOT。' >&2; exit 1; }
# 同 UID/GID 写文件，避免 root 所有；Linux host 网络供 HTTPS 线上检查使用。
# 只挂载本项目与静态目录，不挂 Docker socket，不启用 privileged。
docker run --rm --user "$(id -u):$(id -g)" --network host \
  --env HOME=/tmp --env CI=true \
  --mount "type=bind,source=$project_dir,target=$project_dir" \
  --mount "type=bind,source=$web_root,target=$web_root" \
  --workdir "$project_dir" "$image" node scripts/deploy-web.mjs "$1" "$2"

#!/usr/bin/env bash
# GitHub Actions / deploy 用户入口：只快进更新 main，再调用该提交中的发布器。
set -Eeuo pipefail

main() {
  local project_dir expected target
  local cleanup
  project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
  cd -- "$project_dir"
  if [[ "${1:-}" == "--rollback" ]]; then
    [[ $# -eq 2 ]] || { echo '用法：bash scripts/prod-update.sh --rollback <release-id>' >&2; return 1; }
    bash scripts/docker-deploy.sh rollback "$2"
    return
  fi
  expected=${1:-}
  [[ $# -le 1 && ( -z "$expected" || "$expected" =~ ^[0-9a-f]{40}$ ) ]] || { echo '提交号必须是完整 40 位 SHA。' >&2; return 1; }
  [[ "$(git branch --show-current)" == main ]] || { echo '服务端工作分支必须是 main。' >&2; return 1; }
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] || { echo '服务端工作区有改动，停止更新；不会覆盖文件。' >&2; return 1; }
  lock_dir=$(git rev-parse --git-path ps5-update.lock)
  mkdir "$lock_dir" 2>/dev/null || { echo '另一次更新正在进行或遗留锁存在，请先核对进程。' >&2; return 1; }
  printf -v cleanup 'rmdir -- %q 2>/dev/null || true' "$lock_dir"
  trap "$cleanup" EXIT
  export GIT_TERMINAL_PROMPT=0
  git fetch --no-tags origin main
  target=$(git rev-parse 'origin/main^{commit}')
  [[ -z "$expected" || "$target" == "$expected" ]] || { echo 'main 已前进，本次 Actions 提交已过期；请使用最新任务。' >&2; return 1; }
  git merge --ff-only "$target"
  # main 函数在更新前已解析；发布器从更新后的磁盘加载，避免使用旧发布逻辑。
  bash scripts/docker-deploy.sh deploy "$target"
}
main "$@"

#!/usr/bin/env bash
# GitHub Actions / deploy 用户入口：只快进更新 main，再调用该提交中的发布器。
set -Eeuo pipefail

main() {
  local project_dir expected target attempt fetch_status
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
  # 网络偶发中断时有限重试；持续失败就停止，不使用旧 origin/main 发布。
  for attempt in 1 2 3; do
    if git fetch --no-tags origin main; then
      fetch_status=0
      break
    else
      fetch_status=$?
    fi
    if [[ "$attempt" -eq 3 ]]; then
      echo '连续 3 次拉取失败，停止发布；请检查服务器到 GitHub 的网络。' >&2
      return "$fetch_status"
    fi
    echo "拉取失败（第 $attempt/3 次），稍后重试。" >&2
    sleep "$((attempt * 2))"
  done
  target=$(git rev-parse 'origin/main^{commit}')
  [[ -z "$expected" || "$target" == "$expected" ]] || { echo 'main 已前进，本次 Actions 提交已过期；请使用最新任务。' >&2; return 1; }
  git merge --ff-only "$target"
  # main 函数在更新前已解析；发布器从更新后的磁盘加载，避免使用旧发布逻辑。
  bash scripts/docker-deploy.sh deploy "$target"
}
main "$@"

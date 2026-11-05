#!/usr/bin/env bash
# 仅由 GitHub runner 调用；凭据只写到 runner 临时目录，不打印值。
set -Eeuo pipefail
: "${SSH_HOST:?缺少 SSH_HOST}"
: "${SSH_USER:?缺少 SSH_USER}"
: "${SSH_PRIVATE_KEY:?缺少 SSH_PRIVATE_KEY}"
: "${SSH_KNOWN_HOSTS:?缺少 SSH_KNOWN_HOSTS}"
: "${DEPLOY_SHA:?缺少 DEPLOY_SHA}"
SSH_PORT=${SSH_PORT:-22}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/apps/ps5-jailbreak-hub}
[[ "$SSH_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.:-]*$ && "$SSH_USER" =~ ^[a-z_][a-z0-9_-]*$ ]] || { echo 'SSH 主机或用户名格式错误。' >&2; exit 1; }
[[ "$SSH_PORT" =~ ^[0-9]{1,5}$ && "$SSH_PORT" -ge 1 && "$SSH_PORT" -le 65535 ]] || { echo 'SSH 端口无效。' >&2; exit 1; }
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ && "$DEPLOY_PATH" =~ ^/[a-zA-Z0-9_./-]+$ && "$DEPLOY_PATH" != *'/../'* ]] || { echo '提交或项目目录无效。' >&2; exit 1; }
umask 077
task_tmp=$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/ps5-ssh.XXXXXX")
trap 'rm -f "$task_tmp/key" "$task_tmp/known_hosts"; rmdir "$task_tmp"' EXIT
printf '%s\n' "$SSH_PRIVATE_KEY" > "$task_tmp/key"
printf '%s\n' "$SSH_KNOWN_HOSTS" > "$task_tmp/known_hosts"
unset SSH_PRIVATE_KEY SSH_KNOWN_HOSTS
printf -v remote_args '%q %q' "$DEPLOY_PATH" "$DEPLOY_SHA"
ssh -i "$task_tmp/key" -p "$SSH_PORT" \
  -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
  -o "UserKnownHostsFile=$task_tmp/known_hosts" -o ConnectTimeout=15 \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=6 \
  "${SSH_USER}@${SSH_HOST}" "bash -s -- $remote_args" <<'REMOTE'
set -Eeuo pipefail
if [[ "$(id -un)" == deploy ]]; then
  cd -- "$1"
  bash scripts/prod-update.sh "$2"
else
  sudo -n -iu deploy bash -s -- "$1" "$2" <<'AS_DEPLOY'
set -Eeuo pipefail
cd -- "$1"
bash scripts/prod-update.sh "$2"
AS_DEPLOY
fi
REMOTE

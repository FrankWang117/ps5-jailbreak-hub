# 腾讯云发布：GitHub Actions → SSH → 静态目录

更新：2026-11-05。主地址 `https://voidbai.com/ps5/`，`ps5.voidbai.com` 跳转到此。只发布 Web；不运行 Host、不改 daily-patch、不操作数据库。当前已写好脚本，尚未推送、运行 Actions 或连接腾讯云。

## 日常发布

首次完成下述配置后，推送 main 会运行 `.github/workflows/deploy-web.yml`，也可在 Actions 选择 main 手动运行。流程：

1. GitHub runner 安装锁定依赖，执行 `pnpm check`。
2. 使用 OpenSSH 和严格主机密钥校验，连接已有服务器账号。凭据只放 runner 临时目录，退出删除，不打印。
3. 以 deploy 用户运行 `bash scripts/prod-update.sh <Actions提交SHA>`。只允许干净 main 工作区、只快进，不 reset、不覆盖修改。若远端 main 已前进，停止过期任务，使用最新任务。
4. 服务器用 `scripts/docker-deploy.sh` 启动临时 Node/pnpm 工具容器，读取 `.env.production`，安装锁定依赖、构建 Web，复制到新的 releases 目录。切换 current 符号链接，检查真实 HTTPS 发布编号、首页和深层路由；失败恢复原链接（首次失败移除新链接）。恢复后仍需人工确认线上恢复情况。

工作流串行执行；服务器另有更新锁和发布锁。正常失败清锁；断电/强制杀进程可能留下锁，先确认没有发布进程，再手动清理，不能直接重复删除锁。每次静态发布不需要 reload Nginx。保留旧发布和哈希资源，暂不自动清理，需留意磁盘空间。

## 用户提供的服务器检查（2026-11-05）

用户在 ubuntu 会话提供：`nginx -t` 成功；宿主机 `/etc/nginx/sites-enabled/www.voidbai.com` 包含 `server_name www.voidbai.com voidbai.com`，HTTPS 转发 `127.0.0.1:28080`。用户随后确认软链接实际指向 `/etc/nginx/sites-available/www.voidbai.com`，首个 server 为 HTTPS，`location /` 继续反代官网。用户按指南添加 PS5 片段及 include 后回传 `nginx -t` 成功，reload 后 `systemctl is-active nginx` 为 active；未回传完整修改文件，未验证 PS5 线上页面。

`sudo -n -iu deploy` 成功；deploy 可用 Git 2.34.1，但 PATH 无 Node/pnpm。后续检查 Docker 29.5.3、Compose v5.1.4，deploy 可以列出运行容器，官网 `voidbai-web` 监听回环 28080。因此改用临时 Docker 构建/发布；这些为用户终端回传记录，不是代理直接登录核验。尚未运行本项目真实工具镜像或发布；Nginx 配置由用户手动完成并回传检查结果。

## 先确定实际 Nginx 入口和目录

在腾讯云控制台终端或你自己的 SSH 会话运行（均为只读，不会 reload）：

```bash
whoami
command -v nginx
sudo nginx -t
sudo nginx -T 2>&1 | awk '/^# configuration file / || /^[[:space:]]*(listen|server_name|root|alias|proxy_pass|include|ssl_certificate|ssl_certificate_key)[[:space:]]/ {print}'
ls -l /etc/nginx/sites-enabled
```

有些服务器没有 sites-enabled；以 `nginx -T` 的配置文件路径为准。如有软链接，用 `readlink -f /etc/nginx/sites-enabled/实际文件名` 找源文件。需要的是包含 `server_name voidbai.com`、监听 443 的 **宿主机 HTTPS server** 所在文件，以及它使用的 include。不要直接改官网 Docker 容器里的 Nginx。本地 voidbai 项目显示容器可能监听回环 28080，但尚未验证线上。

可提供上述筛选结果和实际路径，不需要完整配置、`.env`、密码、私钥内容。`ssl_certificate_key` 只需路径，不要打开其中的文件。如果仍需确定容器入口，可用 `docker ps --format 'table {{.Names}}\t{{.Ports}}'` 只读查看。

建议固定两条新路径（可调整，调整后同步相关配置）：

| 用途           | 默认路径                      | 配置位置                                          |
| -------------- | ----------------------------- | ------------------------------------------------- |
| 服务端源码     | `/opt/apps/ps5-jailbreak-hub` | GitHub Actions Variable `DEPLOY_PATH`             |
| 独立静态根目录 | `/var/www/ps5-jailbreak-hub`  | `.env.production` 的 `PS5_WEB_ROOT` 与 Nginx root |

## ubuntu 与 deploy 的职责（已对照 daily-patch）

本地 `daily-patch/docs/engineering/tencent-cloud-deploy.md` 明确约定：

| 用户                | 职责                                                             | 本项目对应操作                                                  |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `ubuntu`（可 sudo） | 系统管理：软件安装、宿主机 Nginx、certbot、systemd、目录首次授权 | 查询/修改 Nginx、检查并 reload、首次创建并授权专用目录          |
| `deploy`            | 应用运维：拉取代码、构建发布、应用环境文件、业务备份/cron        | 克隆仓库、维护 `.env.production`、执行更新/回退、写静态发布目录 |

普通 ubuntu 会话不能直接读取 deploy 所有的 600 环境文件；有 sudo 权限的管理员仍可通过提权访问，不能将文件权限视为与管理员隔离。

daily-patch 的 server/admin 工作流使用 `SSH_USER` 登录后 `sudo -iu deploy`；飞书网关工作流则直接指定 `username: deploy`。这只能证明仓库配置，不能确定 GitHub Secret `SSH_USER` 的实际值，也不能证明线上 sudo 规则。本项目脚本兼容两者：登录 deploy 时直接发布，登录 ubuntu 时用 `sudo -n -iu deploy` 切换，要求既有无需交互密码的授权。Nginx 系统管理不纳入日常自动发布。

后面的 Nginx/证书命令请在 ubuntu 会话执行；应用命令以 deploy 执行，或按示例从 ubuntu 使用 `sudo -iu deploy`。本轮只读核查 daily-patch 文件，没有连接服务器或读取凭据。

## 首次准备服务器

以下为你确认路径后的手动操作，不是本代理已执行的命令。服务器需要 deploy 用户、Git 和可用 Docker，并允许访问 GitHub、Docker 镜像仓库与 npm registry；宿主机不需要 Node/pnpm。先以实际执行用户确认：

```bash
sudo -n -iu deploy bash -c 'git --version; docker --version; docker compose version; docker ps --format "table {{.Names}}\t{{.Ports}}"'
```

若 deploy 尚不存在，先由服务器管理员创建。不要复用 daily-patch 的数据库/容器更新脚本。项目当前为公开仓库，git fetch 使用 HTTPS 无需服务器保存 GitHub 私钥；若以后转私有仓库，需要另配只读拉取权限。

```bash
sudo install -d -o deploy -g deploy -m 0755 /opt/apps/ps5-jailbreak-hub /var/www/ps5-jailbreak-hub
sudo -iu deploy git clone https://github.com/FrankWang117/ps5-jailbreak-hub.git /opt/apps/ps5-jailbreak-hub
sudo -iu deploy bash -c 'cd /opt/apps/ps5-jailbreak-hub && cp .env.example .env.production && chmod 600 .env.production'
```

克隆要求目标为空；已存在仓库则先检查 `git status` / `git remote -v`，不要覆盖。检查所有者为 deploy，不需要全局 `safe.directory`。根 `.env.production` 保持以下内容（均非密钥，文件不提交）：

```dotenv
VITE_BASE_PATH=/ps5/
VITE_SITE_URL=https://voidbai.com/ps5/
PS5_WEB_ROOT=/var/www/ps5-jailbreak-hub
```

脚本只解析这三个键，不 source/eval 文件。静态目录必须是专用绝对目录、末级名为 ps5-jailbreak-hub，不能放在源码目录里。工具镜像从 `deploy/docker/Dockerfile` 构建（Node 22.14.0、pnpm 10.10.0），镜像上下文只含该目录，不打包源码或环境文件。临时容器按 deploy 的 UID/GID 挂载源码和专用静态目录，使用 Linux host 网络完成公网健康检查，退出自动删除；不挂 Docker socket、不重启现有容器。Compose 版本只作现有环境核查，本项目使用 Docker build/run，无需新增常驻服务。回退同样使用该工具镜像。首次拉取基础镜像需要服务器可访问 Docker Hub。若 SSH 登录账号不是 deploy，必须已有无需交互密码的 `sudo -n -iu deploy` 权限；优先像 daily-patch 一样复用已有部署账号与授权。

## 首次配置 Nginx

文件布局由发布脚本创建：

```text
/var/www/ps5-jailbreak-hub/
  releases/<sha>-<时间>-<随机编号>/ps5/  # index.html、release.json 等
  current -> releases/<当前编号>
  previous -> releases/<上一编号>
  shared/ps5/assets/                    # 累积保留的哈希 JS/CSS
```

将仓库 `deploy/nginx/voidbai-ps5.locations.conf` 复制到宿主机，例如 `/etc/nginx/snippets/ps5.locations.conf`，并在**已有 voidbai.com 的 HTTPS server 块内部**加入：

```nginx
include /etc/nginx/snippets/ps5.locations.conf;
```

不要替换整个站点文件。片段单独接管 `/ps5` 和 `/ps5/`，不会接管 `/daily-patch/` 或 `/`。HTML/普通文件禁止缓存；资源从 shared 目录读取、长期缓存；未知前端路由回退到 `/ps5/index.html`，缺失资源返回 404。若现有配置已定义相同 location，先合并冲突。静态根路径调整时要改片段中的所有 root。

确认 Nginx 用户可穿越父目录且可读静态文件；默认脚本使用目录 755/文件 644，不放环境文件。备份实际站点配置后，先测试再生效：

```bash
sudo nginx -t
# 仅上一步成功后：
sudo systemctl reload nginx
```

首次发布前 current 尚不存在，`/ps5/` 会暂时不可用；这不影响其他路径。不要用 Vite preview 作为线上服务，也无需新开 Web 端口。

子域名另参考 `deploy/nginx/ps5-redirect.conf.example`：DNS 指向服务器，证书覆盖 ps5.voidbai.com，HTTP/HTTPS 跳转到主地址并保留路径和查询。模板证书路径只是示例；先核对现有证书，不能直接照抄假定存在。可运行 `sudo ls -l /etc/letsencrypt/live/` 查看目录；用 `sudo openssl x509 -in 实际fullchain.pem路径 -noout -ext subjectAltName` 查看公开证书域名，不读取私钥。子域名尚未配置时，主地址可以独立发布。

## GitHub 配置

在 **PS5 仓库** Settings → Secrets and variables → Actions 配置：

| 类型     | 名称              | 用途                                             |
| -------- | ----------------- | ------------------------------------------------ |
| Secret   | `SSH_HOST`        | 腾讯云 SSH 主机，不含协议                        |
| Secret   | `SSH_USER`        | 已有登录用户                                     |
| Secret   | `SSH_PRIVATE_KEY` | 该账号对应部署私钥，直接在 GitHub 输入，不发聊天 |
| Secret   | `SSH_PORT`        | 可选，默认 22                                    |
| Secret   | `SSH_KNOWN_HOSTS` | 可信服务器公钥对应的 known_hosts 行              |
| Variable | `DEPLOY_PATH`     | 可选，默认 `/opt/apps/ps5-jailbreak-hub`         |

daily-patch 使用前四个 SSH 名称；本工作流采用 runner 内置 OpenSSH。**另一个仓库的 Secrets 不会自动共享**；请在本仓库另配，或确认组织 Secret 已允许此仓库访问。Actions 的 `GITHUB_TOKEN` 只有 contents:read。

获取 `SSH_KNOWN_HOSTS`：在可信腾讯云控制台终端读取 **.pub 公钥**，先查看指纹：

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
# 将 your-host 替换为 SSH_HOST 的相同主机名或 IP；22 端口：
sudo awk -v host='your-host' '{print host " " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
# 非 22 端口，例 2222：
sudo awk -v host='[your-host]:2222' '{print host " " $1 " " $2}' /etc/ssh/ssh_host_ed25519_key.pub
```

把生成的一整行填入 Secret；不能填私钥。若使用其他公钥算法，读取对应 `.pub`。不要关闭主机校验来绕过错误；服务器更换密钥时，先经可信控制台核实。此流程不需要向代理提供任何凭据。

## 首次运行与回退

确认服务器准备和 Nginx 配置后，再推送工作流到 main，或手动运行 main 的工作流。进入 Actions 日志查看检查、SSH、服务器构建与线上检查。防火墙必须允许 runner 的 SSH 连接；本轮未验证现有入站规则。发布后检查：

- `https://voidbai.com/ps5/` 首页；`/ps5/about` 直接打开和刷新；页面主题、查询、反馈入口。
- `/ps5/release.json` 的 commit/release 与任务一致；不存在的 `/ps5/assets/missing.js` 返回 404。
- 官网首页与 `/daily-patch/` 正常；若已配子域名，检查 HTTPS 重定向。

查看版本并人工回退（在服务器，以 deploy 运行）：

```bash
cd /opt/apps/ps5-jailbreak-hub
readlink /var/www/ps5-jailbreak-hub/current
readlink /var/www/ps5-jailbreak-hub/previous
ls /var/www/ps5-jailbreak-hub/releases
bash scripts/prod-update.sh --rollback 实际完整发布编号
```

回退只切静态版本，不修改 git HEAD，不重新构建；下一次部署仍发布 main。线上检查失败时自动恢复链接不保证外部 CDN 已清缓存；若域名经过 CDN，必须排除 HTML、release.json 和深层路由缓存，防止错误验收。不要删除 shared 或仍被 current/previous 使用的发布；清理策略留到实际磁盘状况确认后再定。

## 本地开发与验证边界

本地从 `.env.example` 复制为 `.env.local`；`pnpm dev:web` 仍用 `/`。`pnpm preview:web` 预览生产 `/ps5/`；`pnpm package:web` 生成忽略目录 artifacts/web-release 下的静态包和 SHA-256 摘要，不上传。VITE_ 设置为公开内容，不能放密钥。

`pnpm test:deploy` 使用临时文件、Git 仓库和模拟 SSH，验证切换/回退、旧资源、失败保护和凭据清理，不连接服务器。`pnpm check` 包含这些检查。Nginx 实际语法、服务器路径/权限、Actions Secrets、DNS/TLS 和真实线上操作需要首次部署验证；不能用本地通过替代。

参考：[GitHub Secrets 的范围](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)、[Actions concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency)、[Nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)。

## 本地 main 提交交接

用户已授权将子目录适配、Docker 自动发布、Nginx 模板及相关文档提交到本地 main；本次不推送，不触发 Actions。首次远端运行前仍需确认专用目录、克隆源码、创建 `.env.production` 与 PS5 仓库 Secrets。实际提交号以 Git 日志为准。

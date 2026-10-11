# 腾讯云博客部署与 CI/CD 调查

调查日期：2026-10-11（北京时间）。目标：SSH 别名 `tencentCloud`，公网入口 `https://49.232.126.241/`。

本次只读检查了服务器、GitHub 配置和现有部署代码；没有启动或删除远端容器，没有改动远端 Nginx、数据库、证书、防火墙或 GitHub 工作流。另在本地安装锁定的前端依赖，执行了构建、lint 和后端测试。

## 建议路线

沿用服务器已有的宿主机 Nginx 和 IP HTTPS，使用 Compose V2 管理博客，GitHub Actions 构建 `linux/amd64` 镜像，通过可达镜像仓库分发，再用专用 SSH 部署脚本更新前后端。

第一阶段优先考虑 GHCR：仓库已经在 GitHub，Actions 可使用 `GITHUB_TOKEN` 发布镜像，服务器的 GHCR Registry 入口可达。腾讯云 TCR 是可选方案，需先确认账户中的仓库、访问凭据和所选服务规格。两者均需在首次实施时验证真实镜像分层下载。

监控服务独立于业务发布。服务器只有约 2 GB 内存且已有常驻服务，建议先上线业务，再测量资源余量决定监控同机运行、放在其他机器，或扩容。当前环境无需为博客上线额外安装运维面板；如后续安装 1Panel/宝塔，需专门规划现有 Nginx 与 80/443 的迁移。

## 已确认的服务器状态

| 项目 | 实测结果 | 部署影响 |
|---|---|---|
| SSH | `mari@49.232.126.241:22`，密钥登录成功 | 当前账号有 sudo、docker 权限 |
| 系统/架构 | Ubuntu 22.04.5 LTS，x86_64 | CI 镜像构建目标为 `linux/amd64` |
| CPU/内存 | 2 核，1.9 GiB；快照可用约 892 MiB | 避免在服务器构建镜像；监控同机需要容量验证 |
| Swap | 4 GiB，已使用约 144 MiB | Swap 不能代替实际内存余量 |
| 根磁盘 | 50 GB，已用 17 GB，可用约 31 GB | 配置镜像、日志、指标数据保留和备份策略 |
| Docker | 29.1.3 | 引擎可用 |
| Compose | 仅 `docker-compose` 1.29.2；没有 `docker compose` | 实施前安装 Compose V2 插件 |
| 入口服务 | 宿主机 Nginx 1.18.0 已监听 80、443 | 博客前端不能继续映射宿主机 `80:80` |
| 当前网页 | HTTPS 返回 200，标题为“tencentCloud · HTTPS 已启用” | 当前入口是已有静态页；切换需保留 ACME 路由 |
| 证书 | Let's Encrypt IP 证书，TLS 验证成功 | 可以沿用现有 IP HTTPS |
| 证书到期 | 2026-10-15 09:56:12 北京时间 | 短期证书必须保持自动续期 |
| 自动续期 | `certbot-renew.timer` 存在，最近 service 结果成功；存在 `reload-nginx.sh` deploy hook | 本次没有执行续期或 dry-run；迁移时验证钩子和挑战目录 |
| 运维面板 | 未发现 `/opt/1panel`、`/www/server/panel` | 未发现 1Panel/宝塔安装，不代表已扫描所有可能安装目录 |
| 防火墙 | UFW inactive | 腾讯云安全组未通过本次 SSH 调查核实 |
| 其他服务 | 有 OpenClaw、Tailscale 等常驻进程 | 保留现有服务，不占用其端口、不清理其资源 |

证书使用 `shortlived` profile 和 `webroot=/var/www/html`。Let's Encrypt 已提供短期 IP 证书，官方说明见 [IP 证书发布说明](https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability)。

## 旧博客与数据

- `blog-db`：镜像 `mysql:5.7`，已停止，退出码 0，配置 `restart=always`。
- `blog-backend`：已停止，退出码 2，未配置自动重启，没有 OOM 标记。有限错误摘要不足以确定退出原因。
- `blog-frontend`：已停止，退出码 0，未配置自动重启。
- 三个旧容器使用已有 `blog-network`；本次没有操作它们。
- MySQL 是 bind mount：`/opt/mysql_data` → `/var/lib/mysql`，目录约 199 MB，包含 `blog_db`。这只能确认数据目录存在，未确认表数据完整性和备份可恢复性。
- 旧后端没有上传目录挂载，可写层未发现 `uploads` 路径变化。正式迁移前仍应核对文章中的图片引用和可恢复文件。

建议先保留旧容器与原始目录，备份后在隔离环境检查旧 MySQL 5.7，逻辑导出 `blog_db`，再导入新 MySQL 8.0 的独立数据卷。不要在未执行升级检查和备份的情况下让新版本直接使用原始数据目录。需要核对用户/文章数量、编码和图片引用，再做入口切换。

MySQL 官方支持逻辑导出/导入升级，并要求升级前检查兼容性：[升级准备](https://dev.mysql.com/doc/refman/8.0/en/upgrade-prerequisites.html)、[逻辑升级说明](https://dev.mysql.com/doc/refman/8.0/en/upgrade-binary-package.html)。如果后续选择 8.4，应按其官方升级路径另行设计，不把 5.7 数据目录直接交给 8.4。

## 镜像仓库调查

从服务器对 Registry `/v2/` 做了无凭据的只读请求：

| 仓库 | 实测 | 建议 |
|---|---|---|
| Docker Hub `registry-1.docker.io` | 连续两次连接超时 | 不继续作为当前默认发布来源 |
| GHCR `ghcr.io` | 约 0.79 秒返回 401，TLS 正常 | 可作为第一阶段候选 |
| 腾讯云 `ccr.ccs.tencentyun.com` | 约 0.10 秒返回 401，TLS 正常 | 国内仓库候选，需要账户配置 |

401 是未认证请求的预期结果，表示 Registry 入口可达；它不证明已有仓库权限，也不证明分层下载/CDN 吞吐稳定。本次没有登录镜像仓库或拉取镜像。

除了前后端应用镜像，首次部署所需的 MySQL、Prometheus、Grafana 镜像也必须验证获取方式。可以在 CI 中将固定版本、已验证 digest 的基础设施镜像同步到同一可达仓库，避免服务器仍依赖 Docker Hub。

GHCR 文档说明 Actions 可以用 `GITHUB_TOKEN` 发布关联镜像，公开包可匿名拉取；包的可见性需要单独确认，公开源码仓库并不保证新包自动公开：[GHCR 文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)。腾讯云个人版初始化及推拉流程见 [TCR 文档](https://intl.cloud.tencent.com/ind/document/product/1051/45257)，具体可用规格以账户控制台为准。

## 现有 CI/CD 的问题

仓库：`Michaelwu0905/gin-react-blog`，公开，默认分支 `main`。

`.github/workflows/ci-cd.yml` 已包含构建和 SSH 部署，最近查询到的运行记录为 2026-02-12 成功。现有 Secret 名称包括 `DOCKER_USERNAME`、`DOCKER_PASSWORD`、`SERVER_HOST`、`SERVER_USER`、`SSH_PRIVATE_KEY`。本次没有读取 Secret 值，不能确认它们仍指向目标服务器或仍然有效。GitHub Actions 已启用，默认 workflow token 权限为 read，没有配置部署 Environment。

当前工作流不适合直接用于本次服务器状态：

1. 每次部署先停止、删除旧前后端，再拉镜像；拉取失败会使服务持续不可用。
2. 前端固定映射 `80:80`，与现有宿主机 Nginx 冲突。
3. 数据库配置在工作流中硬编码，JWT 没有明确的生产环境配置。
4. 镜像只用 `latest`，没有确定的版本配对、发布记录和可靠回滚入口。
5. 直接 `docker run`，与仓库 Compose 和监控配置脱节，也没有上传目录持久化。
6. 没有测试、lint、就绪检查、发布后验证、并发部署锁和失败回滚。
7. `ssh-action@master` 使用浮动引用；第三方 Actions 应审查并固定 commit SHA。

当前监控接入等修改仍在本地工作区，没有提交到 GitHub。应先在分支里替换旧部署流程并完成验证，再合并到 main，避免旧 CD 被意外触发。

## 拟议部署架构

```text
浏览器
  └─ https://49.232.126.241:443
       └─ 现有宿主机 Nginx（TLS / ACME）
            └─ 127.0.0.1:18080
                 └─ 前端 Nginx 容器
                      ├─ React 静态资源
                      ├─ /api → backend:8080
                      └─ /uploads → backend:8080

backend ── 内部网络 ── MySQL
Prometheus ── 内部网络 ── backend:8080/metrics
Grafana ── 内部网络 ── Prometheus
```

- 生产 Compose 使用 `image:` 和不可变 Git SHA 标签/镜像 digest，不在服务器 `build:`。
- 使用新项目名，例如 `gin-react-blog-prod`，避免与旧容器重名；前端代理改用 Compose 服务名 `backend`。
- 生产 Compose 与本地开发 Compose 分开。业务和监控的发布生命周期分开。
- MySQL、上传文件、Prometheus、Grafana 各自持久化；业务更新不删除数据卷。
- 生产秘密保存在服务器受限权限 `.env`，发布版本保存在独立 release 状态文件中，防止回滚覆盖秘密。
- 数据库使用仅限博客库的独立账号；更新已在源码出现的默认密码和 JWT 密钥，管理员初始密码从受控配置提供且不打印到日志。
- 新增数据库连接就绪检查，例如 `/readyz`。当前 `/ping` 只证明进程存活；文章列表也不能作为可靠 DB 健康检查，因为其查询错误没有处理。
- 宿主机及前端 Nginx 显式配置与 10 MB 图片限制匹配的请求体上限，避免默认 1 MB 限制拦截上传。
- 保留 `/.well-known/acme-challenge/` 的原 webroot 路由；博客代理不能抢占它。
- Nginx 修改前备份原配置，执行 `nginx -t` 后 reload；保留原静态入口以便回退。

Docker 官方支持通过独立生产配置部署并只更新目标服务：[Compose 生产部署](https://docs.docker.com/compose/how-tos/production/)。

## 拟议 CI/CD 流程

```text
Pull Request
  └─ Go test + frontend lint/build + 镜像构建验证（不部署）

main / 手动发布
  └─ 同样的 CI 门禁
       └─ 构建两个 linux/amd64 镜像
            └─ 推送同一 Git SHA / 记录 digest
                 └─ SSH 进入专用部署目录
                      ├─ flock / concurrency 防止重叠发布
                      ├─ 先拉取镜像，失败时保留运行中的版本
                      ├─ 保存上一版 release
                      ├─ 只更新 backend/frontend
                      ├─ 等待 readyz 和 Compose healthcheck
                      ├─ HTTPS / API 冒烟检查
                      └─ 失败则恢复上一版镜像并再次检查
```

CI 建议配置：

- Go 按 `go.mod` 安装工具链，执行 `go test ./...`。
- Node 22，使用 `npm ci`、`npm run lint`、`npm run build`。
- 增加 `.dockerignore`，排除 `node_modules`、`dist`、运行时上传目录和本地配置，防止本机依赖覆盖容器依赖。
- GitHub 官方 Docker Actions 使用 Buildx；构建、部署 Actions 固定 commit SHA。
- 镜像发布 job 显式设置 `contents: read`、`packages: write`；其他 job 按需最小权限。
- 配置 `production` Environment、允许的发布分支及运行记录；是否开启人工审批根据日常发布偏好决定。
- 部署阶段 `cancel-in-progress: false`，服务器端再加锁，避免中途取消留下不完整状态。
- 使用专用部署 SSH key 和已验证的主机公钥，避免复用个人长期私钥。限制部署账号或强制命令的能力，注意 Docker 权限本身接近 root 权限。
- 部署脚本使用严格错误处理；不在失败时忽略关键命令的错误。

GitHub 官方说明：[发布 Docker 镜像](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)、[Environment 与部署并发控制](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)。

单副本 Compose 更新前后端会有短暂中断，并不等于零停机。若需要无中断发布，再规划蓝绿实例和入口切换，同时先评估内存。镜像回滚也不能撤销数据库迁移；数据库变更需兼容旧版本并保留可恢复备份。

## 监控与资源

当前 2 GB 机器已有其他常驻服务，快照中最大进程包括 OpenClaw（约 421 MiB RSS）、fwupd、journald 等。不能把主机全部内存视为博客可用。

建议顺序：

1. 部署 MySQL、后端、前端并实测空闲/请求负载下的内存、Swap、CPU。
2. 监控作为独立 profile/Compose，决定同机启动或从其他机器采集；需要整套长期同机运行时，4 GB 或以上提供更充足余量，这不是未经测试的容量保证。
3. 如同机运行，先限制 Prometheus 数据保留时间和大小、日志大小、查询并发，结合 MySQL 缓冲池配置与容器内存上限调整；上限必须留出实际运行空间，避免人为制造 OOM。
4. Grafana 禁用本地练习用的匿名访问。Prometheus 和指标端点不对公网开放。

可以先通过 SSH 隧道查看远端 Grafana，使用 13000 避免与本地练习环境的 3000 冲突：

```bash
ssh -N -L 13000:127.0.0.1:3000 tencentCloud
```

随后访问 `http://localhost:13000`。Tailscale 已存在，也可作为后续内部监控网络的候选，但本次没有改动其配置。

## 本地验证结果

| 检查 | 结果 |
|---|---|
| `cd backend && go test ./...` | 通过 |
| `cd frontend && npm run build` | 通过；存在较大 chunk 提示，不阻断构建 |
| `cd frontend && npm run lint` | 未通过，两处现有错误 |

lint 问题位于 `frontend/src/context/AuthContext.jsx`：第 6 行违反 `react-refresh/only-export-components`，第 28 行有未使用的 `error`。本次调查没有修改这些代码；实施 CI 门禁前需要修复。

## 实施顺序与待确认信息

1. 在独立分支修复 lint、生产秘密与管理员初始化、上传持久化、readyz、Docker 构建上下文和生产 Compose。
2. 替换旧工作流；保留 PR 验证，首个生产部署采用显式手动触发。
3. 验证真实镜像从 GHCR 拉取；若不稳定，再选择已配置的 TCR。同步首次部署需要的基础设施镜像。
4. 安装 Compose V2，确定部署目录、部署身份和安全组规则。
5. 备份并验证旧数据库；完成逻辑迁移及数据核对。保留原始目录和旧容器，明确旧数据库 restart 策略的后续处理，避免重启主机时旧实例意外回到运行状态。
6. 启动新业务并在 loopback 端口验收，随后切换 Nginx；验证 HTTPS、ACME 路由、登录、文章读取、上传持久化、重启恢复及回滚。
7. 基于资源测试部署监控和告警，验证一版 CI/CD 发布与一版回滚，再启用 main 自动部署。

实施前需要确定：是否保留全部旧博客数据和图片、是否要求完整监控同机运行、GHCR/TCR 的最终选择，以及是否接受单副本发布的短暂中断。调查方案默认保留旧数据，沿用现有 HTTPS，优先验证 GHCR，发布时允许短暂中断。

尚未核实：腾讯云安全组详情、TCR 账户配置、现有 GitHub Secret 的值与有效性、旧数据库逻辑完整性、旧后端退出码 2 的根因、镜像真实分层拉取、证书续期 dry-run、完整生产容量。这些属于实施阶段的验收项，不能由本次端点连通性检查替代。

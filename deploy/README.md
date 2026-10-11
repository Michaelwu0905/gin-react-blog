# 腾讯云生产部署

入口为主机 Nginx（80/443），代理到仅监听 `127.0.0.1:18080` 的前端容器；前端代理 `/api` 和 `/uploads` 到 Gin。MySQL 不发布端口。Prometheus/Grafana 仅监听服务器本机，避免把运维入口暴露到公网。

## 发布链路

PR 执行 Go 测试、前端 lint/build、Docker 构建校验。合并 `main` 后构建 Linux amd64 镜像，以完整 commit SHA 推送 GHCR，使用 `production` 环境中的受限 SSH key 部署。手动 `workflow_dispatch` 也可发布指定分支。

服务器只允许该 key 执行 `deploy <40位SHA>` 和只读镜像盘点 `images <40位SHA>`，不允许交互 shell、端口转发或任意命令。服务器 GHCR 分层下载实测较慢，因此 CI 从 GHCR 拉取缺失镜像，通过 SSH 压缩传输、导入后删除临时镜像包；以后通常只传新版本的两个应用镜像。GHCR 使用本次 Actions 的临时令牌，退出即删除 Docker 登录配置。主机日常 SSH key 保持不变。

注意：GitHub Runner 直连服务器同样受到跨境链路限速，直传不是国内加速方案。首次部署可在手动发布时开启 `export_bootstrap`，下载生成的 `bootstrap-images` 构建产物（仅镜像，不含生产 `.env`），通过国内网络 SCP 后 `docker load` 引导；长期应把镜像仓库切换到腾讯云 TCR，并使用国内 runner 或直接从 TCR 拉取。未配置 TCR 时，大改动发布可能较慢。

每次镜像发布也会保留一天 `application-images` 构建产物，包含该 SHA 的前后端镜像，不含数据库/监控镜像或生产配置。跨境下载过慢时，可取消当前部署、从 Actions 下载这个小型产物，经国内 SCP 后 `docker load`，再重新运行 deploy job；服务器缓存命中后不再传完整镜像包。构建产物只用于网络故障兜底，不替代正常自动发布。

镜像先拉取再替换应用，数据库独立持久化。后端 `/api/readyz` 检查数据库连接；应用启动或 HTTPS 就绪验证失败会尝试恢复上一版应用镜像。当前与上一版本记录位于 `current-release` / `previous-release`。单副本发布可能有短暂中断，数据库自动迁移不支持自动降级。

## 服务器目录

- `/opt/gin-react-blog/.env`：数据库、JWT、管理员、Grafana 密钥（权限 600）
- `data/uploads/`：图片持久化
- `releases/<SHA>/`：该版 Compose、发布脚本、监控配置
- `monitoring/`：当前监控配置
- Docker volumes：`gin-react-blog-prod_mysql_data`、`gin-react-blog-prod_prometheus_data`、`gin-react-blog-prod_grafana_data`

不执行 `docker compose down -v`，避免误删数据。修改初始化密码不会自动改变已存在的数据库或管理员密码。

## 基本操作

```bash
ssh tencentCloud
cd /opt/gin-react-blog
export RELEASE_SHA=$(cat current-release)
docker compose --env-file .env -f releases/$RELEASE_SHA/deploy/compose.prod.yml ps
docker compose --env-file .env -f releases/$RELEASE_SHA/deploy/compose.prod.yml logs --tail 100 backend
curl -fsS https://49.232.126.241/api/readyz
```

查看监控，先在本机建立 SSH 隧道（使用日常 SSH key，不是 CI key）：

```bash
ssh -N -L 13000:127.0.0.1:3000 -L 19090:127.0.0.1:9090 tencentCloud
```

然后打开 `http://localhost:13000/d/blog-overview` 和 `http://localhost:19090`。Grafana 凭据位于服务器 `.env`。

## 手动回滚（已缓存镜像）

```bash
cd /opt/gin-react-blog
target=$(cat previous-release)
export RELEASE_SHA=$target
docker compose --env-file .env -f releases/$target/deploy/compose.prod.yml up -d --no-deps --wait backend frontend
curl -fsS https://49.232.126.241/api/readyz
cp current-release previous-release
printf '%s\n' "$target" > current-release
```

回滚只切换应用，不回滚数据库和上传文件。若需要拉取未缓存的私有镜像，应通过 Actions 发布该版本，而不是保存长期 GHCR 令牌到服务器。

## 资源与备份

服务器约 2GB 内存，应用和监控都有内存上限；Prometheus 保留 7 天且限制 256MB。当前没有主机、MySQL exporter 或日志聚合，基础面板包含 HTTP 与 Go 运行时指标。生产环境开启 `MONITORING_ENABLED=true`，Nginx 切换完成后开启 `VERIFY_PUBLIC=true`。

上线后的必要运维工作：定期备份 MySQL 与 uploads 到异机/对象存储，演练恢复，关注短有效期 IP 证书的 certbot 自动续期。证书 HTTP challenge 路径由主机 Nginx 保留；不要让面板覆盖此配置。

# 博客基础监控

后端通过 `/metrics` 暴露指标；Prometheus 每 15 秒采集 `backend:8080`；Grafana 使用 Prometheus 数据源展示预置的 **Blog API Overview** 面板。

## 启动

首次运行时，将根目录 `.env.example` 复制为 `.env`，填写 `GRAFANA_ADMIN_PASSWORD`（可用 `openssl rand -hex 24` 生成），然后运行：

```bash
docker compose up -d --build
docker compose ps
```

本次接入时已生成本机 `.env`，该文件被 Git 忽略。Grafana 允许本机匿名只读查看；如需管理功能，用户名由 `GRAFANA_ADMIN_USER` 指定，密码在 `.env` 中。管理员密码仅在空 Grafana 数据卷首次初始化时生效。

- 博客：http://localhost
- Grafana 面板：http://localhost:3000/d/blog-overview
- Prometheus：http://localhost:9090
- Prometheus 采集目标：http://localhost:9090/targets

监控端口仅绑定 `127.0.0.1`，`/metrics` 没有通过前端 Nginx 公开代理。Prometheus 和 Grafana 数据保存在独立 Docker 数据卷中，Prometheus 保留 15 天数据。

## 指标

| 指标 | 类型 | 用途 |
|---|---|---|
| `blog_http_requests_total` | Counter | 请求量、QPS、4xx/5xx 比例 |
| `blog_http_request_duration_seconds` | Histogram | 各接口 P95 延迟 |
| `blog_http_requests_in_flight` | Gauge | 当前正在处理的请求 |
| `go_*` | Go Collector | 堆内存、goroutine、GC |
| `process_*` | Process Collector | 进程 CPU 和常驻内存 |
| `up{job="blog-backend"}` | Prometheus 自动生成 | 采集成功为 1，失败为 0 |

请求指标排除 `/metrics`，避免采集请求本身影响 QPS。标签只包含 HTTP 方法、路由模板和状态码；例如 `/api/posts/:id`，未知路径统一为 `unmatched`。中间件放在认证和 Recovery 之前，以统计认证拒绝及恢复后的 500 响应。

`up=1` 只说明指标接口可以采集，不能证明数据库或每个业务接口都正常。4xx 单独展示，不算作服务器 5xx 错误。延迟以秒为单位。

## 练习与验证

产生一些正常请求和未认证请求（只读取数据）：

```bash
for i in $(seq 1 30); do
  curl -fsS http://localhost/api/posts >/dev/null
  curl -s -o /dev/null http://localhost/api/my-posts
  sleep 1
done
```

等待至少两次采集（约 30 秒），查看面板中的 QPS、状态码和 P95。没有请求时，接口曲线可能暂时为空；`rate` 至少需要两个样本。

在 Prometheus 中可以执行：

```promql
up{job="blog-backend"}
sum(rate(blog_http_requests_total{job="blog-backend"}[5m]))
sum by (status) (rate(blog_http_requests_total{job="blog-backend"}[5m]))
histogram_quantile(0.95, sum by (le, route) (rate(blog_http_request_duration_seconds_bucket{job="blog-backend"}[5m])))
```

手动练习故障监控时，可运行 `docker compose stop backend`，等待一次采集观察 `up=0`，然后用 `docker compose start backend` 恢复。停止后端期间博客接口会不可用。

## 排查

```bash
docker compose logs --tail=100 backend prometheus grafana
docker compose exec backend wget -qO- http://localhost:8080/metrics
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

若启动提示 80、3000 或 9090 端口被占用，修改 Compose 中对应端口映射。Grafana 查询 Prometheus 时使用容器服务名 `http://prometheus:9090`，不要使用 `localhost`。

后端验证命令：`cd backend && go test ./...`。预置面板由仓库中的 JSON 管理；若需自由修改，可在 Grafana 中复制面板后编辑。

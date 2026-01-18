# Gin-React Blog

一个基于 Go (Gin) 和 React 的全栈博客系统，支持 Markdown 编辑、图片上传和用户权限管理。

## AI 使用声明

本项目在开发过程中使用了 AI 辅助工具：

- **开发工具**: Cursor IDE + Claude AI
- **AI 辅助范围**:
  - 代码架构设计与实现
  - 功能模块开发（用户认证、Markdown 编辑器集成、图片上传等）
  - 代码审查与问题排查
  - 文档编写

所有 AI 生成的代码均经过人工审查和测试。

---

## 技术栈

### 后端
- Go 1.25+
- Gin Web Framework
- GORM (MySQL ORM)
- JWT 认证 (golang-jwt/jwt)
- bcrypt 密码加密

### 前端
- React 19
- Vite 7
- React Router 7
- Axios
- md-editor-rt (Markdown 编辑器)

### 基础设施
- MySQL 8.0
- Docker & Docker Compose
- Nginx (生产环境反向代理)

---

## 项目结构

```
gin-react-blog/
|
|-- backend/                    # Go 后端
|   |-- config/
|   |   +-- database.go         # 数据库连接配置
|   |-- controllers/
|   |   |-- auth_controller.go  # 认证控制器（登录/注册）
|   |   |-- post_controller.go  # 文章控制器（CRUD）
|   |   +-- upload_controller.go # 图片上传控制器
|   |-- middleware/
|   |   +-- auth.go             # JWT 认证中间件
|   |-- models/
|   |   |-- user.go             # 用户模型
|   |   +-- post.go             # 文章模型
|   |-- routes/
|   |   +-- routes.go           # 路由配置
|   |-- uploads/                # 上传图片存储目录
|   |-- main.go                 # 程序入口
|   |-- go.mod
|   +-- Dockerfile
|
|-- frontend/                   # React 前端
|   |-- src/
|   |   |-- api/
|   |   |   +-- client.js       # Axios 客户端配置
|   |   |-- components/
|   |   |   |-- PostList.jsx    # 文章列表
|   |   |   |-- PostDetail.jsx  # 文章详情
|   |   |   |-- CreatePost.jsx  # 创建文章
|   |   |   |-- EditPost.jsx    # 编辑文章
|   |   |   |-- Login.jsx       # 登录页面
|   |   |   +-- Register.jsx    # 注册页面
|   |   |-- context/
|   |   |   +-- AuthContext.jsx # 认证状态管理
|   |   |-- App.jsx             # 主应用组件
|   |   +-- main.jsx            # 入口文件
|   |-- nginx.conf              # Nginx 配置
|   |-- vite.config.js
|   |-- package.json
|   +-- Dockerfile
|
+-- docker-compose.yml          # Docker 编排配置
```

---

## 功能特性

### 用户系统
- 用户注册与登录（JWT Token 认证）
- 角色权限控制（普通用户 / 管理员）
- 第一个注册的用户自动成为管理员
- 默认管理员账户：admin / admin123

### 文章管理
- Markdown 编辑器（支持实时预览）
- 图片上传（拖拽或点击上传）
- 文章的创建、编辑、删除
- 权限控制：用户只能编辑/删除自己的文章，管理员可管理所有文章

### 界面
- Windows XP 复古风格 UI
- 响应式设计

---

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- (可选) Go 1.25+ 和 Node.js 20+（本地开发）

### 方式一：Docker Compose 部署（推荐）

1. 克隆项目

```bash
git clone <repository-url>
cd gin-react-blog
```

2. 启动服务

```bash
docker-compose up -d --build
```

3. 访问应用

- 前端界面: http://localhost
- 默认管理员: admin / admin123

4. 查看日志

```bash
docker-compose logs -f
```

5. 停止服务

```bash
docker-compose down
```

### 方式二：本地开发

#### 1. 启动 MySQL 数据库

确保 MySQL 运行在 localhost:3306，并创建数据库：

```sql
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. 启动后端

```bash
cd backend

# 安装依赖
go mod download

# 设置环境变量（可选，使用默认值）
export DB_HOST=127.0.0.1
export DB_USER=root
export DB_PASSWORD=123456
export DB_NAME=blog_db
export JWT_SECRET=your-secret-key

# 运行
go run main.go
```

后端将运行在 http://localhost:8080

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

前端将运行在 http://localhost:5173

---

## API 接口

### 认证接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 公开 | 用户注册 |
| POST | /api/auth/login | 公开 | 用户登录 |
| GET | /api/auth/me | 需登录 | 获取当前用户信息 |

### 文章接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /api/posts | 公开 | 获取文章列表 |
| GET | /api/posts/:id | 公开 | 获取文章详情 |
| POST | /api/posts | 需登录 | 创建文章 |
| PUT | /api/posts/:id | 作者/管理员 | 更新文章 |
| DELETE | /api/posts/:id | 作者/管理员 | 删除文章 |
| GET | /api/my-posts | 需登录 | 获取我的文章 |

### 上传接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | /api/upload | 需登录 | 上传图片 |

---

## 环境变量

### 后端环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| DB_HOST | 127.0.0.1 | MySQL 主机地址 |
| DB_PORT | 3306 | MySQL 端口 |
| DB_USER | root | MySQL 用户名 |
| DB_PASSWORD | 123456 | MySQL 密码 |
| DB_NAME | blog_db | 数据库名称 |
| JWT_SECRET | my-blog-secret-key-2024 | JWT 签名密钥 |

---

## 注意事项

1. **生产环境安全**
   - 请修改默认数据库密码
   - 请设置强 JWT_SECRET
   - 首次登录后修改默认管理员密码

2. **图片存储**
   - 开发环境：图片存储在 backend/uploads/ 目录
   - 生产环境：建议使用云存储（OSS、S3 等）

3. **数据库迁移**
   - 应用启动时会自动执行数据库迁移
   - 首次启动会自动创建默认管理员账户

---

## 许可证

MIT License

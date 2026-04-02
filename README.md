# SeeBeauty

SeeBeauty 是一个基于 AI 的图片评分与报告平台，提供「正常点评」与「毒舌吐槽」两种模式，支持用户体系、异步任务、报告管理与 Stripe 支付。

## 项目结构

- `frontend`：React + Vite 前端应用（页面、路由、状态管理、API 调用）
- `backend`：Express + Sequelize 后端服务（鉴权、评分任务、报告、支付）
- `database`：数据库初始化 SQL（`seebeauty.sql`）
- `nginx-site.conf`：Nginx 反向代理与静态资源部署配置（传统 VPS 场景）
- `frontend/vercel.json`：Vercel 上 SPA 路由回退

## 技术栈

- 前端：React 18、Vite、TailwindCSS、React Router、Zustand、Axios
- 后端：Node.js、Express、Sequelize、**MySQL**、JWT
- AI：**火山引擎方舟（豆包）** [Responses API](https://www.volcengine.com/docs/82379/1569618)（多模态特征提取 + 文本评分 JSON）
- 支付：Stripe（Checkout + Webhook）

## 重新上线检查清单（离开 AWS 后）

1. **MySQL**：新建实例并执行 `npm run db:init`（或导入 `database/seebeauty.sql`）；在 `backend/.env` 填写 `DB_*`；本地连库设 `DB_SSL=false`，云上按服务商要求设 `DB_SSL`。
2. **豆包 / 方舟**：配置 `ARK_API_KEY`、`ARK_MODEL`（或 `ARK_VISION_MODEL` / `ARK_CHAT_MODEL`）；删除或勿再使用 `OPENAI_API_KEY`、`OPENAI_MODEL`（若仅残留旧变量且未配 `ARK_*`，启动时会打日志提示）。
3. **前端地址**：生产环境设置 `FRONTEND_URL`、`CORS_ALLOWED_ORIGINS`（含 Vercel 域名 `https://xxx.vercel.app` 或自有域名）；勿再依赖已下线的固定 IP。
4. **前端构建**：生产构建前设置 `VITE_API_URL=https://你的后端/api`；`frontend/src/utils/imageUrl.js` 依赖该变量拼接图片绝对地址。
5. **Stripe**：Dashboard 中 Webhook URL 改为新后端 `https://你的域名/api/payments/webhook`，并更新 `STRIPE_WEBHOOK_SECRET` 等。
6. **文件存储**：未配置 S3 时上传落在服务器 `backend/uploads`（无持久卷的重启可能丢失）；生产建议配置 `AWS_*` + `S3_BUCKET_NAME` 或等价对象存储。
7. **Nginx**：若仍用 `nginx-site.conf`，把 `upstream api_backend` 里的地址改成新后端，不要用旧服务器 IP。

## 数据库说明（AWS 下线后是否还能用）

- 本项目使用 **MySQL**，连接配置见 `backend/src/config/database.js`（`DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`）。
- 若原先 **AWS RDS / EC2 上的 MySQL 已随实例删除**，则**旧库不可用**，需要新建任意兼容 MySQL 的实例（如阿里云 RDS、腾讯云、PlanetScale、Railway MySQL、自建 VPS 等），然后：
  1. 导入或执行 `database/seebeauty.sql`（或 `npm run db:init` 初始化表结构）
  2. 把新库的地址与账号写入后端环境变量
- **TLS**：生产环境默认对 MySQL 启用 SSL；本地无证书时在后端设置 `DB_SSL=false`。仅开发环境连远程云库时可设 `DB_SSL=true`。

## 部署到 Vercel（重要）

- **适合上 Vercel 的部分**：`frontend` 静态站点（Vite build）。在 Vercel 控制台将 **Root Directory** 设为 `frontend`，构建命令 `npm run build`，输出目录 `dist`。已附带 `frontend/vercel.json` 做 SPA 路由。
- **不适合直接整包丢上 Vercel 的部分**：当前 `backend` 是**常驻 Express 进程**（文件上传、异步任务、Stripe Webhook、长连接），不是无服务器函数形态。需要单独托管，例如：Railway、Render、Fly.io、自建 VPS、或云厂商容器服务。
- **联调**：在 Vercel 上为前端配置环境变量 `VITE_API_URL=https://你的后端域名/api`，并在后端配置 `CORS_ALLOWED_ORIGINS` / `FRONTEND_URL` 为你的 Vercel 域名。

## 核心功能

- 用户注册、登录、刷新令牌、登出
- 图片上传并创建异步评分任务
- 轮询任务状态并生成评分报告
- 报告查看、删除、分享
- 套餐购买与订阅支付

## 本地开发启动

### 1) 环境要求

- Node.js >= 20
- MySQL 8.x（或兼容版本）

### 2) 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3) 配置环境变量（安全模板）

> 仅在本地或托管平台「环境变量」中填写真实值，**不要提交** `.env` 到仓库。  
> **不要把 API Key 贴在聊天或 issue 里**；若已泄露，请在火山控制台轮换密钥。

#### `backend/.env` 模板

```bash
# 基础运行
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5176
CORS_ALLOWED_ORIGINS=http://localhost:5176

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_NAME=seebeauty
DB_USER=root
DB_PASSWORD=your_db_password
DB_SYNC_MODE=alter
# 本地 MySQL 无 SSL 时
DB_SSL=false

# JWT
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace_with_another_long_random_string
JWT_REFRESH_EXPIRES_IN=30d

# 火山引擎方舟（豆包）— 与官方 curl 一致，使用 Responses API
# 文档：创建模型响应 https://www.volcengine.com/docs/82379/1569618
ARK_API_KEY=your_ark_api_key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
# 模型接入点 ID（控制台创建的推理接入点）
ARK_MODEL=doubao-seed-2-0-mini-260215
# 可选：视觉与文本分开配置（不设置则沿用 ARK_MODEL）
# ARK_VISION_MODEL=doubao-seed-2-0-mini-260215
# ARK_CHAT_MODEL=doubao-seed-2-0-mini-260215
ARK_VISION_MAX_OUTPUT_TOKENS=2048
ARK_CHAT_MAX_OUTPUT_TOKENS=4096
ARK_REQUEST_TIMEOUT_MS=120000

# 也可用 DOUBAO_API_KEY / DOUBAO_MODEL 作为别名（与 ARK_* 二选一即可）

# 方舟调用限流（优先使用 ARK_*；未设置时仍可读 OPENAI_* 旧名以兼容老 .env）
ARK_RPM_LIMIT=3
ARK_RATE_INTERVAL_MS=60000
ARK_MAX_CONCURRENT=1
ARK_RETRY_DELAY_MS=20000
ARK_MAX_RETRIES=3
ARK_MAX_RETRY_DELAY_MS=60000

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PAY_PER_USE=price_xxx
STRIPE_PRICE_SUBSCRIPTION=price_xxx

# 上传与限流（可选）
MAX_IMAGE_SIZE_MB=10
ALLOWED_IMAGE_TYPES=jpeg,jpg,png,webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_USER_CACHE_TTL_MS=10000

# 存储（可选，启用 S3 时填写）
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=

# 日志
LOG_LEVEL=debug

# 代理（可选）
HTTP_PROXY=
HTTPS_PROXY=
```

#### `frontend/.env` 模板

```bash
VITE_API_URL=http://localhost:3000/api
```

### 4) 初始化数据库

```bash
cd backend
npm run db:init
```

### 5) 启动服务

```bash
# 终端 1：启动后端
cd backend
npm run dev

# 终端 2：启动前端
cd frontend
npm run dev
```

默认端口：

- 后端：`3000`
- 前端：`5176`

### 6) 快速验证方舟（豆包）密钥（可选）

```bash
cd backend
npm run test:ark
```

## 生产部署提示

- 传统单机：可用 `nginx-site.conf` 将 `/api` 反代到后端，静态资源指向前端 `dist`。
- 前端构建：`cd frontend && npm run build`。
- 建议将所有密钥放到服务器环境变量或密钥管理系统中，不写死在代码与仓库。

## 安全建议（当前仓库约定）

- `.gitignore` 已忽略 `.env`、`dist`、`logs`、`uploads`、`node_modules` 等敏感/临时文件。
- 提交前可运行：

```bash
git status
git diff --staged
```

确认没有 `.env`、密钥、日志、构建产物后再 push。

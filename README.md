# SeeBeauty

SeeBeauty 是一个基于 AI 的图片评分与报告平台，提供「正常点评」与「毒舌吐槽」两种模式，支持用户体系、异步任务、报告管理与 Stripe 支付。

## 项目结构

- `frontend`：React + Vite 前端应用（页面、路由、状态管理、API 调用）
- `backend`：Express + Sequelize 后端服务（鉴权、评分任务、报告、支付）
- `database`：数据库初始化 SQL（`seebeauty.sql`）
- `nginx-site.conf`：Nginx 反向代理与静态资源部署配置

## 技术栈

- 前端：React 18、Vite、TailwindCSS、React Router、Zustand、Axios
- 后端：Node.js、Express、Sequelize、MySQL、JWT
- AI：OpenAI SDK（视觉解析与文本评分）
- 支付：Stripe（Checkout + Webhook）

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

> 仅在本地填写真实值，**不要提交** `.env` 到仓库。

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

# JWT
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace_with_another_long_random_string
JWT_REFRESH_EXPIRES_IN=30d

# OpenAI
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_RPM_LIMIT=3
OPENAI_RATE_INTERVAL_MS=60000
OPENAI_MAX_CONCURRENT=1
OPENAI_RETRY_DELAY_MS=20000
OPENAI_MAX_RETRIES=3
OPENAI_MAX_RETRY_DELAY_MS=60000

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

## 生产部署提示

- 可以用 `nginx-site.conf` 将 `/api` 反代到后端服务。
- 前端构建命令：`npm run build`（在 `frontend` 目录）。
- 建议将所有密钥放到服务器环境变量或密钥管理系统中，不写死在代码与仓库。

## 安全建议（当前仓库约定）

- `.gitignore` 已忽略 `.env`、`dist`、`logs`、`uploads`、`node_modules` 等敏感/临时文件。
- 提交前可运行：

```bash
git status
git diff --staged
```

确认没有 `.env`、密钥、日志、构建产物后再 push。

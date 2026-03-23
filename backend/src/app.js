import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { sequelize } from './config/database.js';
import logger from './config/logger.js';
import { ensurePortFree } from './utils/portUtils.js';

import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import imageRouter from './routes/image.js';
import reportRouter from './routes/report.js';
import taskRouter from './routes/task.js';
import healthRouter from './routes/health.js';
import paymentRouter from './routes/payment.js';
import { ensureScoreReportColumns } from './scripts/ensureScoreReportColumns.js';
import { ensureTaskStatusTable } from './scripts/ensureTaskStatusTable.js';
import { fixUserAgentColumn } from './scripts/fixUserAgentColumn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_KILL_PORT = /^(1|true|yes)$/i.test(process.env.AUTO_KILL_PORT || 'false');
const PORT_KILL_GRACE_MS = parseInt(process.env.PORT_KILL_GRACE_MS || '800', 10);

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  'https://127.0.0.1:3000',
  'http://13.57.220.226:5173',
  'http://13.57.220.226:5174',
  'http://13.57.220.226:5175',
  'http://13.57.220.226:5176',
  'https://13.57.220.226:5173',
  'https://13.57.220.226:5174',
  'https://13.57.220.226:5175',
  'https://13.57.220.226:5176',
  'http://13.57.220.226:3000',
  'https://13.57.220.226:3000',
  'http://seeurbeauty.com',
  'https://seeurbeauty.com',
  'http://www.seeurbeauty.com',
  'https://www.seeurbeauty.com'
];

const normalizeOrigin = origin => (origin || '').replace(/\/$/, '').toLowerCase();
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  process.env.FRONTEND_URL,
  ...configuredOrigins
].filter(Boolean)));

const allowedOriginSet = new Set(allowedOrigins.map(normalizeOrigin));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOriginSet.has(normalizedOrigin)) {
      return callback(null, true);
    }
    logger.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
const corsMiddleware = cors(corsOptions);

const FRONTEND_DIST_PATH = process.env.FRONTEND_DIST_PATH
  ? path.resolve(process.env.FRONTEND_DIST_PATH)
  : path.resolve(__dirname, '../../frontend/dist');
const FRONTEND_DIST_EXISTS = fs.existsSync(FRONTEND_DIST_PATH);

// 信任代理配置 - 修复 X-Forwarded-For 头部问题
app.set('trust proxy', true);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(corsMiddleware);
app.options('*', corsMiddleware);

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
if (FRONTEND_DIST_EXISTS) {
  app.use(express.static(FRONTEND_DIST_PATH));
}

app.use(requestLogger);
app.use('/api', rateLimiter);

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/images', imageRouter);
app.use('/api/reports', reportRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/health', healthRouter);
app.use('/api/payments', paymentRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

if (FRONTEND_DIST_EXISTS) {
  const indexHtmlPath = path.join(FRONTEND_DIST_PATH, 'index.html');
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    if (fs.existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    return next();
  });
}

app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Controlled sync strategy to avoid runaway ALTER producing too many indexes
    if (process.env.NODE_ENV !== 'production') {
      const syncMode = (process.env.DB_SYNC_MODE || 'alter').toLowerCase();
      try {
        if (syncMode === 'alter') {
          await sequelize.sync({ alter: true });
          logger.info('Database synchronized with alter');
        } else if (syncMode === 'force') {
          await sequelize.sync({ force: true });
          logger.warn('Database synchronized with FORCE (all tables dropped & recreated)');
        } else if (syncMode === 'safe') {
          await sequelize.sync();
          logger.info('Database synchronized (safe, no alter)');
        } else {
          logger.warn(`Unknown DB_SYNC_MODE='${syncMode}', skipping automatic sync.`);
        }
      } catch (syncErr) {
        logger.error('Database sync failed:', syncErr);
        // Do not exit immediately so that repair scripts can still be run manually
      }
    }

  // 确保任务状态表存在（热修补，避免缺表导致任务初始化失败）
  await ensureTaskStatusTable();

  // 确保评分扩展列存在（热修补，无需手动迁移即可继续开发）
  await ensureScoreReportColumns();

  // 修复user_agent字段长度问题
  await fixUserAgentColumn();

  const { addPaymentTables } = await import('./scripts/addPaymentTables.js');
  await addPaymentTables();

  // 确保端口空闲（可选自动驱逐）
    const portResult = await ensurePortFree(PORT, { autoKill: AUTO_KILL_PORT, gracefulMs: PORT_KILL_GRACE_MS });
    if (!portResult.freed) {
      logger.error(`Cannot start server, port ${PORT} still in use.`);
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      if (portResult.hadProcess) {
        logger.warn(`Server started on port ${PORT} after freeing previous PID ${portResult.pid}`);
      } else {
        logger.info(`Server running on port ${PORT}`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
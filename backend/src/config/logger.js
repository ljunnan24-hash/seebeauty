import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error'
  }),
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/all.log')
  })
];

// Determine log level: allow explicit LOG_LEVEL override; fall back to 'debug' in development, otherwise 'info'
const resolvedLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

const logger = winston.createLogger({
  level: resolvedLevel,
  levels,
  format,
  transports
});

// Helpful one-time notice about current log level when not in production
if (resolvedLevel !== 'warn' && process.env.NODE_ENV !== 'production') {
  logger.info(`Logger initialized with level: ${resolvedLevel}`);
}

export default logger;
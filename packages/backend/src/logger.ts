import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables 
config();

// Define log directory
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';
const MAX_FILES = process.env.LOG_MAX_FILES || '14d';

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create formatters
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create daily rotate transport for all logs
const allLogsTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: MAX_SIZE,
  maxFiles: MAX_FILES,
  format: fileFormat
});

// Create daily rotate transport for error logs
const errorLogsTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'errors-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: MAX_SIZE,
  maxFiles: MAX_FILES,
  level: 'error',
  format: fileFormat
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat
});

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: [
    allLogsTransport,
    errorLogsTransport,
    consoleTransport
  ],
  // Uncaught exceptions and rejections handling
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: MAX_SIZE,
      maxFiles: MAX_FILES,
      format: fileFormat
    }),
    consoleTransport
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: MAX_SIZE,
      maxFiles: MAX_FILES,
      format: fileFormat
    }),
    consoleTransport
  ],
  exitOnError: false
});

// Log startup message
logger.info(`Logger initialized with level: ${LOG_LEVEL}`);
logger.info(`Logs will be stored in: ${path.resolve(LOG_DIR)}`);

export default logger; 


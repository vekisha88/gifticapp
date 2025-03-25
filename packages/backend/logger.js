import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Define standard emojis for different log types
const LOG_EMOJIS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  database: '🗄️',
  api: '🌐',
  blockchain: '⛓️',
  payment: '💰',
  security: '🔒',
  user: '👤'
};

// Tell winston about our colors
winston.addColors(colors);

// Create format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      Object.keys(info).length > 3 
      ? ` | ${JSON.stringify(Object.fromEntries(
          Object.entries(info).filter(([key]) => !['timestamp', 'message', 'level'].includes(key))
        ))}`
      : ''
    }`
  )
);

// Create format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.json()
);

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  transports: [
    // Console transport
    new winston.transports.Console({ format: consoleFormat }),
    
    // File transports
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    }),
  ],
});

// Helper logging methods with consistent emoji usage
export const logSuccess = (message, meta = {}) => logger.info(`${LOG_EMOJIS.success} ${message}`, meta);
export const logError = (message, meta = {}) => logger.error(`${LOG_EMOJIS.error} ${message}`, meta);
export const logWarning = (message, meta = {}) => logger.warn(`${LOG_EMOJIS.warning} ${message}`, meta);
export const logInfo = (message, meta = {}) => logger.info(`${LOG_EMOJIS.info} ${message}`, meta);
export const logDatabase = (message, meta = {}) => logger.info(`${LOG_EMOJIS.database} ${message}`, meta);
export const logApi = (message, meta = {}) => logger.info(`${LOG_EMOJIS.api} ${message}`, meta);
export const logBlockchain = (message, meta = {}) => logger.info(`${LOG_EMOJIS.blockchain} ${message}`, meta);
export const logBlockchainError = (message, meta = {}) => logger.error(`${LOG_EMOJIS.blockchain} ${message}`, meta);

// Export winston for use in other files if needed
export default winston;

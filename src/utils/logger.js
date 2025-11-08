const winston = require('winston');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'gtm-brain-bot'
  },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

// Add custom methods for structured logging
logger.salesforceQuery = (query, results, duration) => {
  logger.info('Salesforce query executed', {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    resultCount: results?.totalSize || 0,
    duration: `${duration}ms`,
    type: 'salesforce_query'
  });
};

logger.slackInteraction = (type, userId, channelId, command) => {
  logger.info('Slack interaction', {
    type,
    userId,
    channelId,
    command,
    type: 'slack_interaction'
  });
};

logger.aiRequest = (prompt, tokens, duration) => {
  logger.info('AI request processed', {
    promptLength: prompt.length,
    tokens,
    duration: `${duration}ms`,
    type: 'ai_request'
  });
};

logger.cacheOperation = (operation, key, hit) => {
  logger.debug('Cache operation', {
    operation,
    key,
    hit,
    type: 'cache_operation'
  });
};

module.exports = logger;


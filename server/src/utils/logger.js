import pino from 'pino';
import env from '../config/env.js';

const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : env.isProduction ? 'info' : 'debug',
  base: { service: 'cfcs-api', env: env.nodeEnv },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'passwordHash',
      'nationalId'
    ],
    censor: '[redacted]'
  }
});

export default logger;

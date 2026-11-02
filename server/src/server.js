import app from './app.js';
import env from './config/env.js';
import { ping, closePool } from './config/db.js';
import logger from './utils/logger.js';
import { startEscalationJob, stopEscalationJob } from './jobs/escalation.job.js';

const bootstrap = async () => {
  env.assertProductionConfig();

  try {
    await ping();
    logger.info('database connection established');
  } catch (error) {
    logger.error({ err: error.message }, 'database connection failed');
    process.exitCode = 1;
    return;
  }

  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, env: env.nodeEnv, client: env.serveClient ? 'enabled' : 'disabled' },
      'CFCS API listening'
    );
  });

  if (env.jobs.enabled) {
    startEscalationJob();
  }

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');
    stopEscalationJob();
    server.close(async () => {
      try {
        await closePool();
      } finally {
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'uncaught exception');
    shutdown('uncaughtException');
  });
};

bootstrap();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import env from './config/env.js';
import { ping } from './config/db.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import locationRoutes from './routes/location.routes.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import attachmentRoutes from './routes/attachment.routes.js';
import sectorHeadRoutes from './routes/sectorHead.routes.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (env.corsOrigins.includes('*')) return true;
  if (env.corsOrigins.includes(origin)) return true;
  if (!env.isProduction) {
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
};

app.use(
  helmet({
    contentSecurityPolicy: env.serveClient
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: ["'self'", 'https:'],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"]
          }
        }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposedHeaders: ['Content-Disposition']
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        ip: req.ip
      },
      'request'
    );
  });
  next();
});

app.get('/api/health', async (_req, res) => {
  let database = 'down';
  try {
    await ping();
    database = 'up';
  } catch {
    database = 'down';
  }
  res.status(database === 'up' ? 200 : 503).json({
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    service: 'cfcs-api',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.use('/api', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/sector-heads', sectorHeadRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/attachments', attachmentRoutes);

if (env.serveClient) {
  const dist = env.clientDistPath;
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      return res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    logger.warn({ dist }, 'SERVE_CLIENT is enabled but the client build was not found');
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const handler = (code, message) => (_req, res) => {
  res.status(429).json({ error: { code, message } });
};

export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests. Please try again later.')
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler('RATE_LIMITED', 'Too many authentication attempts. Please try again later.')
});

export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.rateLimit.submitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many submissions. Please try again later.')
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('RATE_LIMITED', 'Too many requests. Please slow down.')
});

export default { generalLimiter, authLimiter, submissionLimiter, publicLimiter };

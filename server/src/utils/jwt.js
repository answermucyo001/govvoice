import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email || null },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl, issuer: 'cfcs' }
  );

export const signRefreshToken = (userId, jti) =>
  jwt.sign({ sub: userId, jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
    issuer: 'cfcs'
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

export const newJti = () => crypto.randomUUID();

export const accessCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/api/auth'
});

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/api/auth',
  maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000
});

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  newJti,
  accessCookieOptions,
  refreshCookieOptions
};

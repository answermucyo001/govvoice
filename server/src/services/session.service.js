import { execute, queryOne } from '../config/db.js';
import env from '../config/env.js';
import { sha256 } from '../utils/password.js';
import {
  newJti,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import { unauthorized } from '../utils/httpError.js';

const expiryDate = () => new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

export const setRefreshCookie = (res, token) => {
  res.cookie(env.cookie.name, token, refreshCookieOptions());
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(env.cookie.name, {
    ...refreshCookieOptions(),
    maxAge: undefined
  });
};

export const issueSession = async (user, res) => {
  const jti = newJti();
  const refreshToken = signRefreshToken(user.id, jti);
  await execute(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [jti, user.id, sha256(refreshToken), expiryDate()]
  );
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
};

export const rotateSession = async (token, res) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }

  const hash = sha256(token);
  const stored = await queryOne('SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1', [hash]);

  if (!stored) {
    throw unauthorized('Your session is no longer valid. Please sign in again.');
  }

  if (stored.revoked_at) {
    // Reuse of a rotated token: revoke every session for this user.
    await execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [stored.user_id]
    );
    clearRefreshCookie(res);
    throw unauthorized('Session reuse detected. Please sign in again.');
  }

  if (new Date(stored.expires_at).getTime() < Date.now()) {
    throw unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await queryOne(
    'SELECT id, role, email, account_status FROM users WHERE id = ? LIMIT 1',
    [payload.sub]
  );
  if (!user || user.account_status !== 'active') {
    clearRefreshCookie(res);
    throw unauthorized('Your account is not active.');
  }

  const nextJti = newJti();
  const nextToken = signRefreshToken(user.id, nextJti);
  await execute(
    'UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = ? WHERE id = ?',
    [nextJti, stored.id]
  );
  await execute(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [nextJti, user.id, sha256(nextToken), expiryDate()]
  );

  setRefreshCookie(res, nextToken);
  return { accessToken: signAccessToken(user), userId: user.id };
};

export const revokeSession = async (token) => {
  if (!token) return;
  await execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
    [sha256(token)]
  );
};

export const revokeAllSessions = async (userId) => {
  await execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
};

export default {
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
  setRefreshCookie,
  clearRefreshCookie
};

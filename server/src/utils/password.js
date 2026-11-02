import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import env from '../config/env.js';

export const hashPassword = (plain) => bcrypt.hash(plain, env.bcryptCost);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export const passwordIssues = (password) => {
  const issues = [];
  if (typeof password !== 'string' || password.length < 8) {
    issues.push('Password must be at least 8 characters.');
  }
  if (!/[A-Za-z]/.test(password || '')) issues.push('Password must include a letter.');
  if (!/[0-9]/.test(password || '')) issues.push('Password must include a number.');
  return issues;
};

export const randomPassword = (length = 12) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += alphabet[bytes[index] % alphabet.length];
  }
  return `${out}7a`;
};

export const randomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('hex');

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export default { hashPassword, verifyPassword, passwordIssues, randomPassword, randomToken, sha256 };

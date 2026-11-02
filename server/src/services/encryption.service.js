import crypto from 'node:crypto';
import env from '../config/env.js';

const deriveKey = () => {
  const source = env.encryptionKey || `${env.jwt.accessSecret}:national-id`;
  return crypto.createHash('sha256').update(source).digest();
};

const key = deriveKey();

export const encryptValue = (plain) => {
  if (plain === null || plain === undefined || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
};

export const decryptValue = (payload) => {
  if (!payload || !Buffer.isBuffer(payload) || payload.length < 29) return null;
  try {
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const data = payload.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};

export const hashNationalId = (nationalId) =>
  crypto.createHash('sha256').update(String(nationalId)).digest('hex');

export const maskNationalId = (nationalId) => {
  if (!nationalId) return null;
  const value = String(nationalId);
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`;
};

export default { encryptValue, decryptValue, hashNationalId, maskNationalId };

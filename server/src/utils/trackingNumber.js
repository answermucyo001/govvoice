import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PATTERN = /^CFCS-\d{8}-[A-HJ-NP-Z2-9]{6}$/;

export const generateTrackingNumber = (date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let index = 0; index < 6; index += 1) {
    suffix += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return `CFCS-${stamp}-${suffix}`;
};

export const normalizeTrackingNumber = (value = '') =>
  String(value).trim().toUpperCase().replace(/\s+/g, '');

export const isValidTrackingNumber = (value) => PATTERN.test(normalizeTrackingNumber(value));

export default { generateTrackingNumber, normalizeTrackingNumber, isValidTrackingNumber };

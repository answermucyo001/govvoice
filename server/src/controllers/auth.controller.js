import { execute, queryOne } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fieldErrors, conflict, unauthorized, notFound } from '../utils/httpError.js';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  normalizePhone
} from '../utils/validation.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { encryptValue, hashNationalId } from '../services/encryption.service.js';
import { findUserById, findUserRowById } from '../services/user.service.js';
import { hierarchyExists } from '../services/location.service.js';
import { issueSession, rotateSession, revokeSession, clearRefreshCookie } from '../services/session.service.js';
import { notifyUser } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';
import env from '../config/env.js';

const emailLike = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const register = asyncHandler(async (req, res) => {
  const value = validateRegistration(req.body);

  if (!value.provinceId || !value.districtId || !value.sectorId) {
    throw fieldErrors({
      provinceId: !value.provinceId ? 'Select your province.' : undefined,
      districtId: !value.districtId ? 'Select your district.' : undefined,
      sectorId: !value.sectorId ? 'Select your sector.' : undefined
    });
  }

  const validHierarchy = await hierarchyExists(value);
  if (!validHierarchy) {
    throw fieldErrors({ sectorId: 'The selected province, district and sector do not match.' });
  }

  const nationalIdHash = hashNationalId(value.nationalId);
  const existingId = await queryOne('SELECT id FROM users WHERE national_id_hash = ?', [nationalIdHash]);
  if (existingId) {
    throw conflict('DUPLICATE_NATIONAL_ID', 'This national ID is already registered.');
  }
  const existingEmail = await queryOne('SELECT id FROM users WHERE email = ?', [value.email]);
  if (existingEmail) {
    throw conflict('DUPLICATE_EMAIL', 'This email is already registered.');
  }
  const existingPhone = await queryOne('SELECT id FROM users WHERE phone = ?', [value.phone]);
  if (existingPhone) {
    throw conflict('DUPLICATE_PHONE', 'This phone number is already registered.');
  }

  const passwordHash = await hashPassword(value.password);

  await execute(
    `INSERT INTO users
       (id, first_name, last_name, phone, email, password_hash, national_id_encrypted,
        national_id_hash, language, role, province_id, district_id, sector_id, address_line,
        account_status, must_change_password)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'citizen', ?, ?, ?, ?, 'active', FALSE)`,
    [
      value.firstName,
      value.lastName,
      value.phone,
      value.email,
      passwordHash,
      encryptValue(value.nationalId),
      nationalIdHash,
      value.language,
      value.provinceId,
      value.districtId,
      value.sectorId,
      value.addressLine
    ]
  );

  const row = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [value.email]);
  const accessToken = await issueSession({ id: row.id, role: 'citizen', email: value.email }, res);

  await notifyUser({
    userId: row.id,
    type: 'account',
    messageKey: 'account_created',
    language: value.language,
    phone: value.phone,
    sms: true
  });

  await logAction({
    userId: row.id,
    action: 'auth.register',
    entityType: 'user',
    entityId: row.id,
    ipAddress: req.ip
  });

  const user = await findUserById(row.id);
  res.status(201).json({ data: { user, accessToken } });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = validateLogin(req.body);

  const isEmail = emailLike(identifier);
  const row = await queryOne(
    `SELECT * FROM users
      WHERE ${isEmail ? 'email = ?' : 'phone = ?'}
      LIMIT 1`,
    [isEmail ? identifier.toLowerCase() : normalizePhone(identifier)]
  );

  if (!row) {
    throw unauthorized('Invalid email or password.');
  }

  if (row.account_status !== 'active') {
    throw unauthorized('This account is not active. Please contact support.');
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    throw unauthorized('Invalid email or password.');
  }

  await execute('UPDATE users SET last_login = NOW() WHERE id = ?', [row.id]);
  const accessToken = await issueSession(row, res);

  await logAction({
    userId: row.id,
    action: 'auth.login',
    entityType: 'user',
    entityId: row.id,
    ipAddress: req.ip
  });

  const user = await findUserById(row.id);
  res.json({ data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookie.name];
  if (!token) throw unauthorized('No active session.');

  const rotated = await rotateSession(token, res);
  const user = await findUserById(rotated.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw unauthorized('Your account is no longer available.');
  }
  res.json({ data: { accessToken: rotated.accessToken, user } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookie.name];
  await revokeSession(token);
  clearRefreshCookie(res);
  res.json({ data: { message: 'Signed out.' } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) throw notFound('User not found.');
  res.json({ data: { user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const value = validateProfileUpdate(req.body);
  const current = await findUserRowById(req.user.id);
  if (!current) throw notFound('User not found.');

  if (value.phone && value.phone !== current.phone) {
    const taken = await queryOne('SELECT id FROM users WHERE phone = ? AND id <> ?', [
      value.phone,
      req.user.id
    ]);
    if (taken) throw conflict('DUPLICATE_PHONE', 'This phone number is already registered.');
  }

  const fields = [];
  const params = [];
  if (value.firstName !== undefined) {
    fields.push('first_name = ?');
    params.push(value.firstName);
  }
  if (value.lastName !== undefined) {
    fields.push('last_name = ?');
    params.push(value.lastName);
  }
  if (value.phone !== undefined) {
    fields.push('phone = ?');
    params.push(value.phone);
  }
  if (value.language !== undefined) {
    fields.push('language = ?');
    params.push(value.language);
  }
  if (value.addressLine !== undefined) {
    fields.push('address_line = ?');
    params.push(value.addressLine);
  }

  if (fields.length) {
    params.push(req.user.id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  await logAction({
    userId: req.user.id,
    action: 'auth.profile_update',
    entityType: 'user',
    entityId: req.user.id,
    oldValue: {
      firstName: current.first_name,
      lastName: current.last_name,
      phone: current.phone,
      language: current.language
    },
    newValue: value,
    ipAddress: req.ip
  });

  const user = await findUserById(req.user.id);
  res.json({ data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = validatePasswordChange(req.body);
  const row = await findUserRowById(req.user.id);
  if (!row) throw notFound('User not found.');

  const valid = await verifyPassword(currentPassword, row.password_hash);
  if (!valid) {
    throw fieldErrors({ currentPassword: 'Your current password is incorrect.' });
  }

  const passwordHash = await hashPassword(newPassword);
  await execute(
    'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
    [passwordHash, req.user.id]
  );

  await logAction({
    userId: req.user.id,
    action: 'auth.password_change',
    entityType: 'user',
    entityId: req.user.id,
    ipAddress: req.ip
  });

  res.json({ data: { message: 'Password updated successfully.' } });
});

export default {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword
};

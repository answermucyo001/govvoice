import { execute, query, queryOne } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { conflict, fieldErrors, forbidden, notFound } from '../utils/httpError.js';
import { validateSectorHead, isUuid } from '../utils/validation.js';
import { hashPassword, randomPassword } from '../utils/password.js';
import { encryptValue, hashNationalId } from '../services/encryption.service.js';
import { revokeAllSessions } from '../services/session.service.js';
import { logAction } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';

const SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.language, u.account_status,
         u.must_change_password, u.created_at, u.district_id, u.sector_id,
         d.name_rw AS district_rw, d.name_en AS district_en, d.name_fr AS district_fr,
         s.name_rw AS sector_rw, s.name_en AS sector_en, s.name_fr AS sector_fr
    FROM users u
    LEFT JOIN districts d ON d.id = u.district_id
    LEFT JOIN sectors s ON s.id = u.sector_id
   WHERE u.role = 'sector_head'`;

const map = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  language: row.language,
  isActive: row.account_status === 'active',
  mustChangePassword: Boolean(row.must_change_password),
  createdAt: row.created_at,
  district: row.district_id
    ? { id: row.district_id, name_rw: row.district_rw, name_en: row.district_en, name_fr: row.district_fr }
    : null,
  sector: row.sector_id
    ? { id: row.sector_id, name_rw: row.sector_rw, name_en: row.sector_en, name_fr: row.sector_fr }
    : null
});

const find = async (id) => {
  const rows = await query(`${SELECT} AND u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const scopeDistrictId = (user) => {
  if (user.role === 'super_admin') return null;
  if (user.role === 'district_head') return user.districtId;
  return null;
};

export const listSectorHeads = asyncHandler(async (req, res) => {
  const districtId = scopeDistrictId(req.user);
  const sql = districtId
    ? `${SELECT} AND u.district_id = ? ORDER BY u.created_at DESC`
    : `${SELECT} ORDER BY u.created_at DESC`;
  const params = districtId ? [districtId] : [];
  const rows = await query(sql, params);
  res.json({ data: { sectorHeads: rows.map(map) } });
});

export const createSectorHead = asyncHandler(async (req, res) => {
  const value = validateSectorHead(req.body);

  const sector = await queryOne('SELECT s.id, s.district_id, d.province_id FROM sectors s JOIN districts d ON d.id = s.district_id WHERE s.id = ? LIMIT 1', [value.sectorId]);
  if (!sector) throw fieldErrors({ sectorId: 'Select a valid sector.' });

  if (req.user.role === 'district_head' && sector.district_id !== req.user.districtId) {
    throw forbidden('You can only create sector heads in your district.');
  }

  const existing = await queryOne(
    "SELECT id FROM users WHERE role = 'sector_head' AND sector_id = ? LIMIT 1",
    [value.sectorId]
  );
  if (existing) throw conflict('SECTOR_HEAD_EXISTS', 'This sector already has a head.');

  const nationalIdHash = hashNationalId(value.nationalId);
  const [byEmail, byPhone, byNationalId] = await Promise.all([
    queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [value.email]),
    queryOne('SELECT id FROM users WHERE phone = ? LIMIT 1', [value.phone]),
    queryOne('SELECT id FROM users WHERE national_id_hash = ? LIMIT 1', [nationalIdHash])
  ]);
  if (byEmail) throw conflict('DUPLICATE_EMAIL', 'This email is already registered.');
  if (byPhone) throw conflict('DUPLICATE_PHONE', 'This phone number is already registered.');
  if (byNationalId) throw conflict('DUPLICATE_NATIONAL_ID', 'This national ID is already registered.');

  const temporaryPassword = value.password || randomPassword(12);
  const passwordHash = await hashPassword(temporaryPassword);

  await execute(
    `INSERT INTO users
       (id, first_name, last_name, phone, email, password_hash, national_id_encrypted,
        national_id_hash, language, role, province_id, district_id, sector_id, account_status,
        must_change_password)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'sector_head', ?, ?, ?, 'active', ?)`,
    [
      value.firstName,
      value.lastName,
      value.phone,
      value.email,
      passwordHash,
      encryptValue(value.nationalId),
      nationalIdHash,
      value.language,
      sector.province_id,
      sector.district_id,
      value.sectorId,
      value.password ? 0 : 1
    ]
  );

  const created = await queryOne(
    "SELECT id FROM users WHERE role = 'sector_head' AND sector_id = ? LIMIT 1",
    [value.sectorId]
  );
  const row = await find(created.id);

  await notifyUser({
    userId: created.id,
    type: 'account',
    messageKey: 'account_created',
    language: value.language,
    phone: value.phone,
    sms: true
  });

  await logAction({
    userId: req.user.id,
    action: 'sector_head.create',
    entityType: 'user',
    entityId: created.id,
    newValue: { email: value.email, sectorId: value.sectorId },
    ipAddress: req.ip
  });

  res.status(201).json({
    data: {
      sectorHead: map(row),
      temporaryPassword: value.password ? null : temporaryPassword
    }
  });
});

export const toggleSectorHead = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Sector head not found.');
  const existing = await find(req.params.id);
  if (!existing) throw notFound('Sector head not found.');

  if (req.user.role === 'district_head' && existing.district_id !== req.user.districtId) {
    throw forbidden('This sector head belongs to another district.');
  }

  const isActive = req.body.isActive !== false;
  await execute('UPDATE users SET account_status = ? WHERE id = ?', [
    isActive ? 'active' : 'suspended',
    req.params.id
  ]);
  if (!isActive) await revokeAllSessions(req.params.id);

  await logAction({
    userId: req.user.id,
    action: isActive ? 'sector_head.activate' : 'sector_head.deactivate',
    entityType: 'user',
    entityId: req.params.id,
    newValue: { isActive },
    ipAddress: req.ip
  });

  const updated = await find(req.params.id);
  res.json({ data: { sectorHead: map(updated) } });
});

export const resetSectorHeadPassword = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Sector head not found.');
  const existing = await find(req.params.id);
  if (!existing) throw notFound('Sector head not found.');

  if (req.user.role === 'district_head' && existing.district_id !== req.user.districtId) {
    throw forbidden('This sector head belongs to another district.');
  }

  const temporaryPassword = randomPassword(12);
  const passwordHash = await hashPassword(temporaryPassword);
  await execute(
    'UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?',
    [passwordHash, req.params.id]
  );
  await revokeAllSessions(req.params.id);

  await logAction({
    userId: req.user.id,
    action: 'sector_head.reset_password',
    entityType: 'user',
    entityId: req.params.id,
    ipAddress: req.ip
  });

  res.json({ data: { temporaryPassword } });
});

export default { listSectorHeads, createSectorHead, toggleSectorHead, resetSectorHeadPassword };

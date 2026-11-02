import { execute, query, queryOne } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { conflict, fieldErrors, notFound } from '../utils/httpError.js';
import { validateDistrictHead, isUuid, STATUSES, normalizePhone, isPhone } from '../utils/validation.js';
import { normalizeLanguage } from '../utils/i18n.js';
import { hashPassword, randomPassword } from '../utils/password.js';
import { encryptValue, hashNationalId } from '../services/encryption.service.js';
import { computeStats, statusBreakdown, categoryBreakdown } from '../services/stats.service.js';
import { searchSubmissions, mapSubmission } from '../services/submissionView.service.js';
import { revokeAllSessions } from '../services/session.service.js';
import { logAction } from '../services/audit.service.js';
import { notifyUser } from '../services/notification.service.js';

const mapHead = (row) => ({
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
    ? {
        id: row.district_id,
        name_rw: row.district_rw,
        name_en: row.district_en,
        name_fr: row.district_fr
      }
    : null,
  province: row.province_id
    ? {
        id: row.province_id,
        name_rw: row.province_rw,
        name_en: row.province_en,
        name_fr: row.province_fr
      }
    : null
});

const HEADS_SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.language, u.account_status,
         u.must_change_password, u.created_at,
         d.id AS district_id, d.name_rw AS district_rw, d.name_en AS district_en, d.name_fr AS district_fr,
         p.id AS province_id, p.name_rw AS province_rw, p.name_en AS province_en, p.name_fr AS province_fr
    FROM users u
    LEFT JOIN districts d ON d.id = u.district_id
    LEFT JOIN provinces p ON p.id = d.province_id
   WHERE u.role = 'district_head'`;

const findHead = async (id) => {
  const rows = await query(`${HEADS_SELECT} AND u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

export const getOverview = asyncHandler(async (_req, res) => {
  const [stats, statuses, categories, recentRows, districts, auditRows] = await Promise.all([
    computeStats(''),
    statusBreakdown(''),
    categoryBreakdown(''),
    searchSubmissions({ whereSql: '', params: [], limit: 5, offset: 0 }),
    query(
      `SELECT d.id, d.code, d.name_rw, d.name_en, d.name_fr,
              p.name_rw AS province_rw, p.name_en AS province_en, p.name_fr AS province_fr,
              COUNT(s.id) AS total,
              SUM(CASE WHEN s.status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
              h.id AS head_id, h.first_name AS head_first_name, h.last_name AS head_last_name,
              h.email AS head_email, h.account_status AS head_status
         FROM districts d
         JOIN provinces p ON p.id = d.province_id
         LEFT JOIN submissions s ON s.district_id = d.id
         LEFT JOIN users h ON h.role = 'district_head' AND h.district_id = d.id
        GROUP BY d.id, d.code, d.name_rw, d.name_en, d.name_fr,
                 p.name_rw, p.name_en, p.name_fr,
                 h.id, h.first_name, h.last_name, h.email, h.account_status
        ORDER BY p.name_en ASC, d.name_en ASC`
    ),
    query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at,
              CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_name,
              u.email AS actor_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 8`
    )
  ]);

  const userCounts = await queryOne(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN role = 'citizen' THEN 1 ELSE 0 END) AS citizens,
            SUM(CASE WHEN role = 'district_head' THEN 1 ELSE 0 END) AS districtHeads,
            SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) AS superAdmins
       FROM users
      WHERE account_status <> 'deleted'`
  );

  const districtTotals = await queryOne(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN head_id IS NOT NULL THEN 1 ELSE 0 END) AS covered
       FROM (
         SELECT d.id,
                (SELECT u.id FROM users u
                  WHERE u.role = 'district_head' AND u.district_id = d.id
                    AND u.account_status = 'active' LIMIT 1) AS head_id
           FROM districts d
       ) AS coverage`
  );

  const notificationRows = await query(
    'SELECT type, COUNT(*) AS count FROM notifications GROUP BY type'
  );
  const notifications = notificationRows.reduce((accumulator, row) => {
    accumulator[row.type] = Number(row.count);
    return accumulator;
  }, {});

  res.json({
    data: {
      stats,
      statusBreakdown: statuses,
      categoryBreakdown: categories,
      recent: recentRows.map((row) => mapSubmission(row, { includeCitizen: true })),
      districts: districts.map((row) => ({
        id: row.id,
        code: row.code,
        name_rw: row.name_rw,
        name_en: row.name_en,
        name_fr: row.name_fr,
        province: {
          name_rw: row.province_rw,
          name_en: row.province_en,
          name_fr: row.province_fr
        },
        total: Number(row.total || 0),
        resolved: Number(row.resolved || 0),
        head: row.head_id
          ? {
              id: row.head_id,
              firstName: row.head_first_name,
              lastName: row.head_last_name,
              email: row.head_email,
              isActive: row.head_status === 'active'
            }
          : null
      })),
      platform: {
        users: {
          total: Number(userCounts?.total || 0),
          citizens: Number(userCounts?.citizens || 0),
          districtHeads: Number(userCounts?.districtHeads || 0),
          superAdmins: Number(userCounts?.superAdmins || 0)
        },
        districts: {
          total: Number(districtTotals?.total || 0),
          covered: Number(districtTotals?.covered || 0)
        },
        notifications
      },
      recentAudit: auditRows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actorName: row.actor_name?.trim() || null,
        actorEmail: row.actor_email,
        createdAt: row.created_at
      }))
    }
  });
});

export const listDistrictHeads = asyncHandler(async (_req, res) => {
  const rows = await query(`${HEADS_SELECT} ORDER BY u.created_at DESC`);
  res.json({ data: { districtHeads: rows.map(mapHead) } });
});

export const listDistricts = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT d.id, d.code, d.name_rw, d.name_en, d.name_fr,
            p.id AS province_id, p.name_rw AS province_rw, p.name_en AS province_en, p.name_fr AS province_fr,
            COUNT(s.id) AS submission_count,
            h.id AS head_id, h.first_name AS head_first_name, h.last_name AS head_last_name,
            h.email AS head_email, h.phone AS head_phone, h.account_status AS head_status
       FROM districts d
       JOIN provinces p ON p.id = d.province_id
       LEFT JOIN submissions s ON s.district_id = d.id
       LEFT JOIN users h ON h.role = 'district_head' AND h.district_id = d.id
      GROUP BY d.id, d.code, d.name_rw, d.name_en, d.name_fr,
               p.id, p.name_rw, p.name_en, p.name_fr,
               h.id, h.first_name, h.last_name, h.email, h.phone, h.account_status
      ORDER BY p.name_en ASC, d.name_en ASC`
  );

  res.json({
    data: {
      districts: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name_rw: row.name_rw,
        name_en: row.name_en,
        name_fr: row.name_fr,
        province: {
          id: row.province_id,
          name_rw: row.province_rw,
          name_en: row.province_en,
          name_fr: row.province_fr
        },
        submissionCount: Number(row.submission_count || 0),
        head: row.head_id
          ? {
              id: row.head_id,
              firstName: row.head_first_name,
              lastName: row.head_last_name,
              email: row.head_email,
              phone: row.head_phone,
              isActive: row.head_status === 'active'
            }
          : null
      }))
    }
  });
});

export const createDistrictHead = asyncHandler(async (req, res) => {
  const value = validateDistrictHead(req.body);

  const district = await queryOne('SELECT id FROM districts WHERE id = ? LIMIT 1', [
    value.districtId
  ]);
  if (!district) {
    throw fieldErrors({ districtId: 'Select a valid district.' });
  }

  const existingHead = await queryOne(
    "SELECT id FROM users WHERE role = 'district_head' AND district_id = ? LIMIT 1",
    [value.districtId]
  );
  if (existingHead) {
    throw conflict('DISTRICT_HEAD_EXISTS', 'This district already has a head.');
  }

  const nationalIdHash = hashNationalId(value.nationalId);
  const [byEmail, byPhone, byNationalId] = await Promise.all([
    queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [value.email]),
    queryOne('SELECT id FROM users WHERE phone = ? LIMIT 1', [value.phone]),
    queryOne('SELECT id FROM users WHERE national_id_hash = ? LIMIT 1', [nationalIdHash])
  ]);
  if (byEmail) throw conflict('DUPLICATE_EMAIL', 'This email is already registered.');
  if (byPhone) throw conflict('DUPLICATE_PHONE', 'This phone number is already registered.');
  if (byNationalId) {
    throw conflict('DUPLICATE_NATIONAL_ID', 'This national ID is already registered.');
  }

  const temporaryPassword = value.password || randomPassword(12);
  const passwordHash = await hashPassword(temporaryPassword);

  await execute(
    `INSERT INTO users
       (id, first_name, last_name, phone, email, password_hash, national_id_encrypted,
        national_id_hash, language, role, province_id, district_id, account_status,
        must_change_password)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'district_head',
        (SELECT province_id FROM districts WHERE id = ?), ?, 'active', ?)`,
    [
      value.firstName,
      value.lastName,
      value.phone,
      value.email,
      passwordHash,
      encryptValue(value.nationalId),
      nationalIdHash,
      value.language,
      value.districtId,
      value.districtId,
      value.password ? 0 : 1
    ]
  );

  const created = await queryOne(
    "SELECT id FROM users WHERE role = 'district_head' AND district_id = ? LIMIT 1",
    [value.districtId]
  );
  const headRow = await findHead(created.id);

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
    action: 'district_head.create',
    entityType: 'user',
    entityId: created.id,
    newValue: { email: value.email, districtId: value.districtId },
    ipAddress: req.ip
  });

  res.status(201).json({
    data: {
      districtHead: mapHead(headRow),
      temporaryPassword: value.password ? null : temporaryPassword
    }
  });
});

export const updateDistrictHead = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('District head not found.');
  const existing = await findHead(req.params.id);
  if (!existing) throw notFound('District head not found.');

  const fields = [];
  const params = [];

  if (req.body.firstName !== undefined) {
    const firstName = String(req.body.firstName).trim();
    if (!firstName) throw fieldErrors({ firstName: 'First name is required.' });
    fields.push('first_name = ?');
    params.push(firstName);
  }
  if (req.body.lastName !== undefined) {
    const lastName = String(req.body.lastName).trim();
    if (!lastName) throw fieldErrors({ lastName: 'Last name is required.' });
    fields.push('last_name = ?');
    params.push(lastName);
  }
  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();
    const taken = await queryOne('SELECT id FROM users WHERE email = ? AND id <> ?', [
      email,
      req.params.id
    ]);
    if (taken) throw conflict('DUPLICATE_EMAIL', 'This email is already registered.');
    fields.push('email = ?');
    params.push(email);
  }
  if (req.body.phone !== undefined) {
    const phone = normalizePhone(req.body.phone);
    if (!isPhone(phone)) throw fieldErrors({ phone: 'Enter a valid Rwandan phone number.' });
    const taken = await queryOne('SELECT id FROM users WHERE phone = ? AND id <> ?', [
      phone,
      req.params.id
    ]);
    if (taken) throw conflict('DUPLICATE_PHONE', 'This phone number is already registered.');
    fields.push('phone = ?');
    params.push(phone);
  }
  if (req.body.districtId !== undefined) {
    if (!isUuid(req.body.districtId)) {
      throw fieldErrors({ districtId: 'Select a valid district.' });
    }
    const taken = await queryOne(
      "SELECT id FROM users WHERE role = 'district_head' AND district_id = ? AND id <> ?",
      [req.body.districtId, req.params.id]
    );
    if (taken) throw conflict('DISTRICT_HEAD_EXISTS', 'This district already has a head.');
    const district = await queryOne('SELECT province_id FROM districts WHERE id = ?', [
      req.body.districtId
    ]);
    if (!district) throw fieldErrors({ districtId: 'Select a valid district.' });
    fields.push('district_id = ?', 'province_id = ?');
    params.push(req.body.districtId, district.province_id);
  }
  if (req.body.language !== undefined) {
    fields.push('language = ?');
    params.push(normalizeLanguage(req.body.language));
  }

  if (fields.length) {
    params.push(req.params.id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  await logAction({
    userId: req.user.id,
    action: 'district_head.update',
    entityType: 'user',
    entityId: req.params.id,
    newValue: req.body,
    ipAddress: req.ip
  });

  const updated = await findHead(req.params.id);
  res.json({ data: { districtHead: mapHead(updated) } });
});

export const toggleDistrictHead = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('District head not found.');
  const existing = await findHead(req.params.id);
  if (!existing) throw notFound('District head not found.');

  const isActive = req.body.isActive !== false;
  await execute('UPDATE users SET account_status = ? WHERE id = ?', [
    isActive ? 'active' : 'suspended',
    req.params.id
  ]);
  if (!isActive) await revokeAllSessions(req.params.id);

  await logAction({
    userId: req.user.id,
    action: isActive ? 'district_head.activate' : 'district_head.deactivate',
    entityType: 'user',
    entityId: req.params.id,
    newValue: { isActive },
    ipAddress: req.ip
  });

  const updated = await findHead(req.params.id);
  res.json({ data: { districtHead: mapHead(updated) } });
});

export const resetHeadPassword = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('District head not found.');
  const existing = await findHead(req.params.id);
  if (!existing) throw notFound('District head not found.');

  const temporaryPassword = randomPassword(12);
  const passwordHash = await hashPassword(temporaryPassword);
  await execute(
    'UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?',
    [passwordHash, req.params.id]
  );
  await revokeAllSessions(req.params.id);

  await logAction({
    userId: req.user.id,
    action: 'district_head.reset_password',
    entityType: 'user',
    entityId: req.params.id,
    ipAddress: req.ip
  });

  res.json({ data: { temporaryPassword } });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const rows = await query(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.old_value, a.new_value,
            a.ip_address, a.created_at,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_name,
            u.email AS actor_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT ?`,
    [limit]
  );

  res.json({
    data: {
      auditLogs: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        oldValue: row.old_value,
        newValue: row.new_value,
        ipAddress: row.ip_address,
        actorName: row.actor_name?.trim() || null,
        actorEmail: row.actor_email,
        createdAt: row.created_at
      }))
    }
  });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, submission_id, type, message_rw, message_en, message_fr, is_read, created_at
       FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50`,
    [req.user.id]
  );
  res.json({
    data: {
      notifications: rows.map((row) => ({
        id: row.id,
        submissionId: row.submission_id,
        type: row.type,
        message: row[`message_${req.user.language || 'rw'}`] || row.message_en,
        isRead: Boolean(row.is_read),
        createdAt: row.created_at
      }))
    }
  });
});

export const listStatuses = asyncHandler(async (_req, res) => {
  res.json({ data: { statuses: STATUSES } });
});

export default {
  getOverview,
  listDistrictHeads,
  listDistricts,
  createDistrictHead,
  updateDistrictHead,
  toggleDistrictHead,
  resetHeadPassword,
  listAuditLogs,
  listNotifications,
  listStatuses
};

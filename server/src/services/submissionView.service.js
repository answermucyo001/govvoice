import { query, queryOne } from '../config/db.js';
import { decryptValue } from './encryption.service.js';

export const TRANSITIONS = {
  received: ['assigned', 'under_review', 'awaiting_info', 'overdue', 'referred_to_district'],
  assigned: ['under_review', 'awaiting_info', 'overdue', 'referred_to_district'],
  under_review: ['awaiting_info', 'response_given', 'pending_citizen', 'overdue', 'referred_to_district'],
  awaiting_info: ['under_review', 'response_given', 'overdue', 'referred_to_district'],
  pending_citizen: ['under_review', 'response_given', 'overdue', 'referred_to_district'],
  response_given: ['resolved', 'reopened', 'referred_to_district'],
  overdue: ['assigned', 'under_review', 'awaiting_info', 'response_given', 'referred_to_district'],
  reopened: ['assigned', 'under_review', 'awaiting_info', 'response_given', 'referred_to_district'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  referred_to_district: ['district_review', 'response_given', 'overdue'],
  district_review: ['response_given', 'referred_to_district', 'overdue']
};

const BASE_SELECT = `
  SELECT s.id, s.tracking_number, s.type, s.subject, s.description, s.status, s.visibility,
         s.language, s.priority, s.escalation_level, s.due_at, s.response_text, s.response_at,
         s.resolved_at, s.closed_at, s.satisfaction_rating, s.satisfaction_comment,
         s.created_at, s.updated_at, s.date_occurred, s.submitted_by,
         c.id AS c_id, c.slug AS c_slug, c.name_rw AS c_name_rw, c.name_en AS c_name_en, c.name_fr AS c_name_fr,
         dep.id AS dep_id, dep.code AS dep_code, dep.name_rw AS dep_name_rw,
         dep.name_en AS dep_name_en, dep.name_fr AS dep_name_fr,
         p.id AS p_id, p.code AS p_code, p.name_rw AS p_name_rw, p.name_en AS p_name_en, p.name_fr AS p_name_fr,
         dist.id AS dist_id, dist.code AS dist_code, dist.name_rw AS dist_name_rw,
         dist.name_en AS dist_name_en, dist.name_fr AS dist_name_fr,
         sec.id AS sec_id, sec.code AS sec_code, sec.name_rw AS sec_name_rw,
         sec.name_en AS sec_name_en, sec.name_fr AS sec_name_fr,
         u.first_name AS citizen_first_name, u.last_name AS citizen_last_name,
         u.phone AS citizen_phone, u.email AS citizen_email,
         u.national_id_encrypted AS citizen_national_id,
         (SELECT COUNT(*) FROM attachments a WHERE a.submission_id = s.id) AS attachment_count
    FROM submissions s
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN departments dep ON dep.id = s.department_id
    LEFT JOIN provinces p ON p.id = s.province_id
    LEFT JOIN districts dist ON dist.id = s.district_id
    LEFT JOIN sectors sec ON sec.id = s.sector_id
    LEFT JOIN users u ON u.id = s.submitted_by`;

const place = (row, prefix) =>
  row[`${prefix}_id`]
    ? {
        id: row[`${prefix}_id`],
        code: row[`${prefix}_code`],
        name_rw: row[`${prefix}_name_rw`],
        name_en: row[`${prefix}_name_en`],
        name_fr: row[`${prefix}_name_fr`]
      }
    : null;

const category = (row) =>
  row.c_id
    ? {
        id: row.c_id,
        slug: row.c_slug,
        name_rw: row.c_name_rw,
        name_en: row.c_name_en,
        name_fr: row.c_name_fr
      }
    : null;

const department = (row) =>
  row.dep_id
    ? {
        id: row.dep_id,
        code: row.dep_code,
        name_rw: row.dep_name_rw,
        name_en: row.dep_name_en,
        name_fr: row.dep_name_fr
      }
    : null;

const isOverdue = (row) => {
  if (['resolved', 'closed'].includes(row.status)) return false;
  return Boolean(row.due_at) && new Date(row.due_at).getTime() < Date.now();
};

export const mapSubmission = (row, { includeCitizen = false, includeNationalId = false } = {}) => ({
  id: row.id,
  trackingNumber: row.tracking_number,
  type: row.type,
  subject: row.subject,
  description: row.description,
  status: row.status,
  visibility: row.visibility,
  language: row.language,
  priority: row.priority,
  escalationLevel: Number(row.escalation_level || 0),
  citizenId: row.submitted_by,
  category: category(row),
  department: department(row),
  location: {
    province: place(row, 'p'),
    district: place(row, 'dist'),
    sector: place(row, 'sec')
  },
  dateOccurred: row.date_occurred,
  dueAt: row.due_at,
  isOverdue: isOverdue(row),
  responseText: row.response_text,
  responseAt: row.response_at,
  resolvedAt: row.resolved_at,
  closedAt: row.closed_at,
  satisfactionRating: row.satisfaction_rating,
  satisfactionComment: row.satisfaction_comment,
  attachmentCount: Number(row.attachment_count || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  citizen: includeCitizen
    ? {
        id: row.submitted_by,
        firstName: row.citizen_first_name,
        lastName: row.citizen_last_name,
        email: row.citizen_email,
        phone: row.citizen_phone,
        nationalId: includeNationalId ? decryptValue(row.citizen_national_id) : null
      }
    : null
});

export const mapTimeline = (row) => ({
  id: row.id,
  actorRole: row.actor_role,
  actorName: row.actor_name || null,
  status: row.status,
  message: row.message,
  isPublic: Boolean(row.is_public),
  metadata: row.metadata || null,
  createdAt: row.created_at
});

export const mapAttachment = (row) => ({
  id: row.id,
  originalName: row.original_name,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes),
  kind: row.file_kind
});

export const fetchTimeline = async (submissionId, { publicOnly = false } = {}) => {
  const rows = await query(
    `SELECT t.id, t.actor_role, t.status, t.message, t.is_public, t.metadata, t.created_at,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_name
       FROM timeline_entries t
       LEFT JOIN users u ON u.id = t.actor_id
      WHERE t.submission_id = ? ${publicOnly ? 'AND t.is_public = TRUE' : ''}
      ORDER BY t.created_at ASC, t.id ASC`,
    [submissionId]
  );
  return rows.map(mapTimeline);
};

export const fetchAttachments = async (submissionId, { publicOnly = false } = {}) => {
  const rows = await query(
    `SELECT id, original_name, mime_type, size_bytes, file_kind
       FROM attachments
      WHERE submission_id = ? ${publicOnly ? "AND visibility = 'public'" : ''}
      ORDER BY created_at ASC`,
    [submissionId]
  );
  return rows.map(mapAttachment);
};

export const getSubmissionRow = async (id) => {
  const rows = await query(`${BASE_SELECT} WHERE s.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

export const searchSubmissions = async ({
  whereSql = '',
  params = [],
  limit = 20,
  offset = 0,
  orderSql = 's.created_at DESC'
}) => {
  const where = whereSql ? `WHERE ${whereSql}` : '';
  return query(`${BASE_SELECT} ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`, [
    ...params,
    limit,
    offset
  ]);
};

export const countSubmissions = async (whereSql = '', params = []) => {
  const where = whereSql ? `WHERE ${whereSql}` : '';
  const row = await queryOne('SELECT COUNT(*) AS total FROM submissions s LEFT JOIN categories c ON c.id = s.category_id ' + where, params);
  return Number(row?.total || 0);
};

export const getSubmissionByTracking = async (trackingNumber) => {
  const rows = await query(`${BASE_SELECT} WHERE s.tracking_number = ? LIMIT 1`, [trackingNumber]);
  return rows[0] || null;
};

export const allowedTransitions = (status) => TRANSITIONS[status] || [];

export const addTimeline = async ({
  submissionId,
  actorId = null,
  actorRole = null,
  status = null,
  message,
  isPublic = true,
  metadata = null,
  connection = null
}) => {
  const sql = `INSERT INTO timeline_entries
      (id, submission_id, actor_id, actor_role, status, message, is_public, metadata)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    submissionId,
    actorId,
    actorRole,
    status,
    message,
    isPublic ? 1 : 0,
    metadata ? JSON.stringify(metadata) : null
  ];
  if (connection) {
    await connection.execute(sql, params);
  } else {
    await query(sql, params);
  }
};

export const findSubmissionOwner = async (id) => {
  const row = await queryOne('SELECT submitted_by FROM submissions WHERE id = ?', [id]);
  return row?.submitted_by || null;
};

export default {
  TRANSITIONS,
  mapSubmission,
  mapTimeline,
  mapAttachment,
  fetchTimeline,
  fetchAttachments,
  getSubmissionRow,
  getSubmissionByTracking,
  allowedTransitions,
  addTimeline,
  findSubmissionOwner
};

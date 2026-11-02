import { query, queryOne, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  fieldErrors,
  forbidden,
  notFound,
  badRequest
} from '../utils/httpError.js';
import {
  validateSubmission,
  validateStatusUpdate,
  parsePagination,
  isUuid,
  STATUSES,
  SUBMISSION_TYPES
} from '../utils/validation.js';
import { normalizeTrackingNumber, generateTrackingNumber } from '../utils/trackingNumber.js';
import { hierarchyExists } from '../services/location.service.js';
import {
  mapSubmission,
  fetchTimeline,
  fetchAttachments,
  getSubmissionRow,
  getSubmissionByTracking,
  allowedTransitions,
  addTimeline
} from '../services/submissionView.service.js';
import { computeStats } from '../services/stats.service.js';
import { notifyUser, notifyDistrictHead, notifySuperAdmins } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';
import { translate, statusLabel } from '../utils/i18n.js';

const detailPayload = async (
  row,
  { publicView = false, includeCitizen = true, includeNationalId = false } = {}
) => {
  const [timeline, attachments] = await Promise.all([
    fetchTimeline(row.id, { publicOnly: publicView }),
    fetchAttachments(row.id, { publicOnly: publicView })
  ]);
  return {
    ...mapSubmission(row, { includeCitizen, includeNationalId }),
    timeline,
    attachments,
    allowedTransitions: allowedTransitions(row.status)
  };
};

const ownedRow = async (id, userId) => {
  if (!isUuid(id)) throw notFound('Submission not found.');
  const row = await getSubmissionRow(id);
  if (!row) throw notFound('Submission not found.');
  if (row.submitted_by !== userId) {
    throw forbidden('You do not have access to this submission.');
  }
  return row;
};

const uniqueTracking = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateTrackingNumber();
    const existing = await queryOne('SELECT id FROM submissions WHERE tracking_number = ?', [
      candidate
    ]);
    if (!existing) return candidate;
  }
  throw new Error('Could not allocate a unique tracking number.');
};

export const createSubmission = asyncHandler(async (req, res) => {
  const value = validateSubmission(req.body);

  const validHierarchy = await hierarchyExists(value);
  if (!validHierarchy) {
    throw fieldErrors({ sectorId: 'The selected location is not valid.' });
  }

  const category = await queryOne(
    'SELECT id, department_id, sla_hours FROM categories WHERE id = ? AND is_active = TRUE',
    [value.categoryId]
  );
  if (!category) {
    throw fieldErrors({ categoryId: 'Select a valid category.' });
  }

  const attachments = value.attachmentIds.length
    ? await query(
        `SELECT id FROM attachments
          WHERE uploaded_by = ? AND submission_id IS NULL
            AND id IN (${value.attachmentIds.map(() => '?').join(',')})`,
        [req.user.id, ...value.attachmentIds]
      )
    : [];

  if (attachments.length !== value.attachmentIds.length) {
    throw fieldErrors({ attachmentIds: 'One or more attachments are invalid.' });
  }

  const trackingNumber = await uniqueTracking();
  const slaHours = Number(category.sla_hours || 72);

  const submissionId = await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO submissions
         (id, tracking_number, type, subject, description, category_id, department_id, province_id,
          district_id, sector_id, date_occurred, visibility, submitted_by, language, status,
          priority, due_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', 'normal',
          DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [
        trackingNumber,
        value.type,
        value.subject,
        value.description,
        category.id,
        category.department_id,
        value.provinceId,
        value.districtId,
        value.sectorId,
        value.dateOccurred,
        value.visibility,
        req.user.id,
        value.language,
        slaHours
      ]
    );

    const [rows] = await connection.execute(
      'SELECT id FROM submissions WHERE tracking_number = ? LIMIT 1',
      [trackingNumber]
    );
    const id = rows[0].id;

    if (attachments.length) {
      await connection.execute(
        `UPDATE attachments
            SET submission_id = ?, visibility = ?
          WHERE uploaded_by = ? AND submission_id IS NULL
            AND id IN (${attachments.map(() => '?').join(',')})`,
        [id, value.visibility, req.user.id, ...attachments.map((item) => item.id)]
      );
    }

    await addTimeline({
      submissionId: id,
      actorId: req.user.id,
      actorRole: 'citizen',
      status: 'received',
      message: translate('submission_received', value.language, { tracking: trackingNumber }),
      isPublic: true,
      connection
    });

    return id;
  });

  const row = await getSubmissionRow(submissionId);

  await notifyUser({
    userId: req.user.id,
    submissionId,
    type: 'submission',
    messageKey: 'submission_received',
    language: value.language,
    vars: { tracking: trackingNumber },
    phone: req.user.phone,
    sms: true
  });

  await notifyDistrictHead({
    districtId: value.districtId,
    submissionId,
    type: 'submission',
    messageKey: 'submission_received',
    vars: { tracking: trackingNumber },
    language: value.language
  });

  await logAction({
    userId: req.user.id,
    action: 'submission.create',
    entityType: 'submission',
    entityId: submissionId,
    newValue: { trackingNumber, type: value.type, visibility: value.visibility },
    ipAddress: req.ip
  });

  const payload = await detailPayload(row, { includeCitizen: true });
  res.status(201).json({ data: { submission: payload } });
});

export const listMySubmissions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, 6);
  const conditions = ['s.submitted_by = ?'];
  const params = [req.user.id];

  if (req.query.status && STATUSES.includes(req.query.status)) {
    conditions.push('s.status = ?');
    params.push(req.query.status);
  }
  if (req.query.type && SUBMISSION_TYPES.includes(req.query.type)) {
    conditions.push('s.type = ?');
    params.push(req.query.type);
  }

  const where = conditions.join(' AND ');
  const rows = await query(
    `SELECT s.id, s.tracking_number, s.type, s.subject, s.description, s.status, s.visibility,
            s.language, s.escalation_level, s.due_at, s.response_text, s.response_at,
            s.resolved_at, s.closed_at, s.satisfaction_rating, s.created_at, s.updated_at,
            s.date_occurred, s.submitted_by,
            c.id AS c_id, c.slug AS c_slug, c.name_rw AS c_name_rw, c.name_en AS c_name_en, c.name_fr AS c_name_fr,
            p.id AS p_id, p.code AS p_code, p.name_rw AS p_name_rw, p.name_en AS p_name_en, p.name_fr AS p_name_fr,
            dist.id AS dist_id, dist.code AS dist_code, dist.name_rw AS dist_name_rw,
            dist.name_en AS dist_name_en, dist.name_fr AS dist_name_fr,
            sec.id AS sec_id, sec.code AS sec_code, sec.name_rw AS sec_name_rw,
            sec.name_en AS sec_name_en, sec.name_fr AS sec_name_fr,
            (SELECT COUNT(*) FROM attachments a WHERE a.submission_id = s.id) AS attachment_count
       FROM submissions s
       LEFT JOIN categories c ON c.id = s.category_id
       LEFT JOIN provinces p ON p.id = s.province_id
       LEFT JOIN districts dist ON dist.id = s.district_id
       LEFT JOIN sectors sec ON sec.id = s.sector_id
      WHERE ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const totalRow = await queryOne(
    `SELECT COUNT(*) AS total FROM submissions s WHERE ${where}`,
    params
  );
  const total = Number(totalRow?.total || 0);

  res.json({
    data: {
      items: rows.map((row) => mapSubmission(row, { includeCitizen: false })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    }
  });
});

export const myStats = asyncHandler(async (req, res) => {
  const stats = await computeStats('s.submitted_by = ?', [req.user.id]);
  res.json({ data: { stats } });
});

export const getMySubmission = asyncHandler(async (req, res) => {
  const row = await ownedRow(req.params.id, req.user.id);
  const payload = await detailPayload(row, { includeCitizen: true });
  res.json({ data: { submission: payload } });
});

export const trackSubmission = asyncHandler(async (req, res) => {
  const trackingNumber = normalizeTrackingNumber(req.params.trackingNumber);
  const row = await getSubmissionByTracking(trackingNumber);
  if (!row) throw notFound('No submission matches that tracking number.');

  const viewer = req.user;
  const isOwner = viewer && viewer.id === row.submitted_by;
  const isOfficial = viewer && ['district_head', 'super_admin'].includes(viewer.role);

  if (row.visibility === 'private' && !isOwner && !isOfficial) {
    throw forbidden('This submission is private. Sign in to view it.');
  }

  const publicView = !isOwner && !isOfficial;
  const payload = await detailPayload(row, {
    publicView,
    includeCitizen: !publicView,
    includeNationalId: Boolean(isOfficial)
  });
  res.json({ data: { submission: payload } });
});

export const confirmResolution = asyncHandler(async (req, res) => {
  const row = await ownedRow(req.params.id, req.user.id);
  if (row.status !== 'response_given') {
    throw badRequest('This submission cannot be confirmed at this stage.');
  }

  const rating = req.body.rating === undefined || req.body.rating === null
    ? null
    : Number.parseInt(req.body.rating, 10);
  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    throw fieldErrors({ rating: 'Rating must be between 1 and 5.' });
  }
  const comment = req.body.comment ? String(req.body.comment).trim().slice(0, 1000) : null;

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE submissions
          SET status = 'resolved', resolved_at = NOW(), satisfaction_rating = ?,
              satisfaction_comment = ?, satisfaction_at = NOW()
        WHERE id = ?`,
      [rating, comment, row.id]
    );
    await connection.execute(
      `INSERT INTO citizen_feedback (id, submission_id, citizen_id, decision, rating, comment, created_at)
       VALUES (UUID(), ?, ?, 'satisfied', ?, ?, NOW())`,
      [row.id, req.user.id, rating, comment]
    );
    await addTimeline({
      submissionId: row.id,
      actorId: req.user.id,
      actorRole: 'citizen',
      status: 'resolved',
      message: comment || 'Citizen confirmed the resolution.',
      isPublic: true,
      metadata: rating ? { rating } : null,
      connection
    });
  });

  await notifyDistrictHead({
    districtId: row.dist_id,
    submissionId: row.id,
    type: 'resolution',
    messageKey: 'resolution_confirmed',
    vars: { tracking: row.tracking_number },
    language: row.language
  });
  await notifySuperAdmins({
    submissionId: row.id,
    type: 'resolution',
    messageKey: 'resolution_confirmed',
    vars: { tracking: row.tracking_number }
  });

  await logAction({
    userId: req.user.id,
    action: 'submission.confirm',
    entityType: 'submission',
    entityId: row.id,
    newValue: { rating },
    ipAddress: req.ip
  });

  const updated = await getSubmissionRow(row.id);
  res.json({ data: { submission: await detailPayload(updated, { includeCitizen: true }) } });
});

export const reopenSubmission = asyncHandler(async (req, res) => {
  const row = await ownedRow(req.params.id, req.user.id);
  if (!['resolved', 'closed', 'response_given'].includes(row.status)) {
    throw badRequest('This submission cannot be reopened at this stage.');
  }
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 10) {
    throw fieldErrors({ reason: 'Please explain why you are reopening (at least 10 characters).' });
  }

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE submissions
          SET status = 'reopened', resolved_at = NULL, closed_at = NULL,
              satisfaction_rating = NULL, satisfaction_comment = NULL, satisfaction_at = NULL
        WHERE id = ?`,
      [row.id]
    );
    await connection.execute(
      `INSERT INTO citizen_feedback (id, submission_id, citizen_id, decision, reason, created_at)
       VALUES (UUID(), ?, ?, 'not_satisfied', ?, NOW())`,
      [row.id, req.user.id, reason]
    );
    await addTimeline({
      submissionId: row.id,
      actorId: req.user.id,
      actorRole: 'citizen',
      status: 'reopened',
      message: reason,
      isPublic: true,
      connection
    });
  });

  await notifyDistrictHead({
    districtId: row.dist_id,
    submissionId: row.id,
    type: 'reopened',
    messageKey: 'reopened',
    vars: { tracking: row.tracking_number },
    language: row.language
  });
  await notifySuperAdmins({
    submissionId: row.id,
    type: 'reopened',
    messageKey: 'reopened',
    vars: { tracking: row.tracking_number }
  });

  await logAction({
    userId: req.user.id,
    action: 'submission.reopen',
    entityType: 'submission',
    entityId: row.id,
    newValue: { reason },
    ipAddress: req.ip
  });

  const updated = await getSubmissionRow(row.id);
  res.json({ data: { submission: await detailPayload(updated, { includeCitizen: true }) } });
});

export const replyToSubmission = asyncHandler(async (req, res) => {
  const row = await ownedRow(req.params.id, req.user.id);
  if (!['awaiting_info', 'pending_citizen', 'overdue'].includes(row.status)) {
    throw badRequest('Replies are not expected at this stage.');
  }
  const message = String(req.body.message || '').trim();
  if (message.length < 5) {
    throw fieldErrors({ message: 'Your reply must be at least 5 characters.' });
  }

  await addTimeline({
    submissionId: row.id,
    actorId: req.user.id,
    actorRole: 'citizen',
    status: row.status,
    message,
    isPublic: true
  });

  await notifyDistrictHead({
    districtId: row.dist_id,
    submissionId: row.id,
    type: 'reply',
    messageKey: 'reply_received',
    vars: { tracking: row.tracking_number },
    language: row.language
  });

  await logAction({
    userId: req.user.id,
    action: 'submission.reply',
    entityType: 'submission',
    entityId: row.id,
    ipAddress: req.ip
  });

  const updated = await getSubmissionRow(row.id);
  res.json({ data: { submission: await detailPayload(updated, { includeCitizen: true }) } });
});

export default {
  createSubmission,
  listMySubmissions,
  myStats,
  getMySubmission,
  trackSubmission,
  confirmResolution,
  reopenSubmission,
  replyToSubmission
};

import { execute, queryOne, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound, fieldErrors } from '../utils/httpError.js';
import {
  validateStatusUpdate,
  parsePagination,
  isUuid,
  STATUSES,
  SUBMISSION_TYPES,
  VISIBILITIES
} from '../utils/validation.js';
import {
  mapSubmission,
  fetchTimeline,
  fetchAttachments,
  getSubmissionRow,
  searchSubmissions,
  countSubmissions,
  allowedTransitions,
  addTimeline
} from '../services/submissionView.service.js';
import { computeStats, statusBreakdown, categoryBreakdown } from '../services/stats.service.js';
import { notifyUser } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';
import { statusLabel } from '../utils/i18n.js';

const scopeFor = (user) => {
  if (user.role === 'district_head') {
    if (!user.districtId) {
      throw forbidden('Your account is not linked to a district.');
    }
    return { sql: 's.district_id = ?', params: [user.districtId] };
  }
  if (user.role === 'sector_head') {
    if (!user.sectorId) {
      throw forbidden('Your account is not linked to a sector.');
    }
    return { sql: 's.sector_id = ?', params: [user.sectorId] };
  }
  return { sql: '', params: [] };
};

const assertInScope = (row, user) => {
  if (user.role === 'district_head' && row.dist_id !== user.districtId) {
    throw forbidden('This submission belongs to another district.');
  }
  if (user.role === 'sector_head' && row.sec_id !== user.sectorId) {
    throw forbidden('This submission belongs to another sector.');
  }
};

const adminDetail = async (row) => {
  const [timeline, attachments] = await Promise.all([
    fetchTimeline(row.id),
    fetchAttachments(row.id)
  ]);
  return {
    ...mapSubmission(row, { includeCitizen: true, includeNationalId: true }),
    timeline,
    attachments,
    allowedTransitions: allowedTransitions(row.status)
  };
};

export const getAdminStats = asyncHandler(async (req, res) => {
  const scope = scopeFor(req.user);
  const stats = await computeStats(scope.sql, scope.params);
  const [statuses, categories] = await Promise.all([
    statusBreakdown(scope.sql, scope.params),
    categoryBreakdown(scope.sql, scope.params)
  ]);

  const recentRows = await searchSubmissions({
    whereSql: scope.sql,
    params: scope.params,
    limit: 5,
    offset: 0
  });

  res.json({
    data: {
      stats,
      statusBreakdown: statuses,
      categoryBreakdown: categories,
      recent: recentRows.map((row) => mapSubmission(row, { includeCitizen: true }))
    }
  });
});

export const exportAdminSubmissions = asyncHandler(async (req, res) => {
  // Reuse the same filters as listAdminSubmissions but without pagination.
  req.query.limit = '10000';
  req.query.page = '1';
  // Call the same logic by duplicating minimal filter building:
  const scope = scopeFor(req.user);
  const conditions = [];
  const params = [];
  if (scope.sql) {
    conditions.push(scope.sql);
    params.push(...scope.params);
  }
  if (req.query.status && STATUSES.includes(req.query.status)) {
    conditions.push('s.status = ?');
    params.push(req.query.status);
  }
  if (req.query.type && SUBMISSION_TYPES.includes(req.query.type)) {
    conditions.push('s.type = ?');
    params.push(req.query.type);
  }
  if (req.query.visibility && VISIBILITIES.includes(req.query.visibility)) {
    conditions.push('s.visibility = ?');
    params.push(req.query.visibility);
  }
  if (req.query.district && isUuid(req.query.district)) {
    conditions.push('s.district_id = ?');
    params.push(req.query.district);
  }
  if (req.query.sector && isUuid(req.query.sector)) {
    conditions.push('s.sector_id = ?');
    params.push(req.query.sector);
  }
  if (req.query.category && isUuid(req.query.category)) {
    conditions.push('s.category_id = ?');
    params.push(req.query.category);
  }
  if (req.query.search) {
    conditions.push('(s.subject LIKE ? OR s.tracking_number LIKE ?)');
    const term = `%${String(req.query.search).trim()}%`;
    params.push(term, term);
  }
  if (req.query.dateFrom) {
    conditions.push('s.created_at >= ?');
    params.push(req.query.dateFrom);
  }
  if (req.query.dateTo) {
    conditions.push('s.created_at <= ?');
    params.push(req.query.dateTo + ' 23:59:59');
  }
  const whereSql = conditions.join(' AND ');
  const rows = await searchSubmissions({ whereSql, params, limit: 10000, offset: 0 });

  const header = [
    'Tracking number',
    'Type',
    'Subject',
    'Status',
    'Visibility',
    'Category',
    'District',
    'Sector',
    'Citizen',
    'Created at',
    'Resolved at',
    'Satisfaction rating'
  ];
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    const mapped = mapSubmission(row, { includeCitizen: true });
    lines.push(
      [
        mapped.trackingNumber,
        mapped.type,
        mapped.subject,
        mapped.status,
        mapped.visibility,
        mapped.category?.name_en || '',
        mapped.location?.district?.name_en || '',
        mapped.location?.sector?.name_en || '',
        mapped.citizen ? `${mapped.citizen.firstName} ${mapped.citizen.lastName}` : '',
        mapped.createdAt,
        mapped.resolvedAt || '',
        mapped.satisfactionRating || ''
      ]
        .map(escape)
        .join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cfcs-submissions.csv"');
  res.send(lines.join('\n'));
});
export const listAdminSubmissions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, 20);
  const scope = scopeFor(req.user);
  const conditions = [];
  const params = [];

  if (scope.sql) {
    conditions.push(scope.sql);
    params.push(...scope.params);
  }

  if (req.query.status && STATUSES.includes(req.query.status)) {
    conditions.push('s.status = ?');
    params.push(req.query.status);
  }
  if (req.query.type && SUBMISSION_TYPES.includes(req.query.type)) {
    conditions.push('s.type = ?');
    params.push(req.query.type);
  }
  if (req.query.visibility && VISIBILITIES.includes(req.query.visibility)) {
    conditions.push('s.visibility = ?');
    params.push(req.query.visibility);
  }
  if (req.query.district && isUuid(req.query.district)) {
    conditions.push('s.district_id = ?');
    params.push(req.query.district);
  }
  if (req.query.sector && isUuid(req.query.sector)) {
    conditions.push('s.sector_id = ?');
    params.push(req.query.sector);
  }
  if (req.query.category && isUuid(req.query.category)) {
    conditions.push('s.category_id = ?');
    params.push(req.query.category);
  }
  if (req.query.escalation === 'true') {
    conditions.push('s.escalation_level > 0');
  }
  if (req.query.search) {
    conditions.push('(s.subject LIKE ? OR s.tracking_number LIKE ?)');
    const term = `%${String(req.query.search).trim()}%`;
    params.push(term, term);
  }
  if (req.query.dateFrom) {
    conditions.push('s.created_at >= ?');
    params.push(req.query.dateFrom);
  }
  if (req.query.dateTo) {
    conditions.push('s.created_at <= ?');
    params.push(req.query.dateTo + ' 23:59:59');
  }
  if (req.query.satisfaction === 'satisfied') {
    conditions.push("s.status = 'resolved' AND s.satisfaction_rating IS NOT NULL");
  } else if (req.query.satisfaction === 'not_satisfied') {
    conditions.push("s.status = 'reopened'");
  } else if (req.query.satisfaction === 'pending') {
    conditions.push("s.status IN ('received','assigned','under_review','awaiting_info','response_given','overdue')");
  }

  const whereSql = conditions.join(' AND ');
  const rows = await searchSubmissions({ whereSql, params, limit, offset });
  const total = await countSubmissions(whereSql, params);

  res.json({
    data: {
      items: rows.map((row) => mapSubmission(row, { includeCitizen: true })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    }
  });
});

export const getAdminSubmission = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Submission not found.');
  const row = await getSubmissionRow(req.params.id);
  if (!row) throw notFound('Submission not found.');
  assertInScope(row, req.user);

  res.json({ data: { submission: await adminDetail(row) } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Submission not found.');
  const row = await getSubmissionRow(req.params.id);
  if (!row) throw notFound('Submission not found.');
  assertInScope(row, req.user);

  const value = validateStatusUpdate(req.body);
  if (!allowedTransitions(row.status).includes(value.status)) {
    throw badRequest(`Cannot change status from ${row.status} to ${value.status}.`);
  }

  const nowPublic = value.status === 'response_given' ? true : value.isPublic;
  const message =
    value.message ||
    (value.status === 'response_given'
      ? ''
      : `Status changed to ${statusLabel(value.status, row.language)}.`);

  if (value.status === 'response_given' && message.length < 5) {
    throw fieldErrors({ message: 'A response message of at least 5 characters is required.' });
  }

  await withTransaction(async (connection) => {
    const fields = ['status = ?'];
    const params = [value.status];

    if (value.status === 'response_given') {
      fields.push('response_text = ?', 'response_at = NOW()');
      params.push(message);
    }
    if (value.status === 'resolved') {
      fields.push('resolved_at = NOW()');
    }
    if (value.status === 'closed') {
      fields.push('closed_at = NOW()');
    }
    if (['reopened', 'under_review', 'assigned', 'awaiting_info'].includes(value.status)) {
      fields.push('closed_at = NULL');
    }
    if (value.status === 'overdue') {
      fields.push('escalation_level = GREATEST(escalation_level, 1)');
    }

    params.push(row.id);
    await connection.execute(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`, params);

    if (message && message.trim()) {
      await connection.execute(
        `INSERT INTO complaint_responses (id, submission_id, responder_id, responder_role, message, is_public, created_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
        [row.id, req.user.id, req.user.role, message.trim(), nowPublic ? 1 : 0]
      );
    }

    await addTimeline({
      submissionId: row.id,
      actorId: req.user.id,
      actorRole: req.user.role,
      status: value.status,
      message,
      isPublic: nowPublic,
      connection
    });
  });

  const citizenLanguage = row.language || 'rw';
  if (value.status === 'response_given') {
    await notifyUser({
      userId: row.submitted_by,
      submissionId: row.id,
      type: 'response',
      messageKey: 'response_given',
      language: citizenLanguage,
      vars: { tracking: row.tracking_number },
      phone: row.citizen_phone,
      sms: true
    });
  } else {
    await notifyUser({
      userId: row.submitted_by,
      submissionId: row.id,
      type: 'status',
      messageKey: 'status_changed',
      language: citizenLanguage,
      vars: {
        tracking: row.tracking_number,
        status: statusLabel(value.status, citizenLanguage)
      }
    });
  }

  await logAction({
    userId: req.user.id,
    action: 'submission.status_update',
    entityType: 'submission',
    entityId: row.id,
    oldValue: { status: row.status },
    newValue: { status: value.status, isPublic: nowPublic },
    ipAddress: req.ip
  });

  const updated = await getSubmissionRow(row.id);
  res.json({ data: { submission: await adminDetail(updated) } });
});

export default {
  getAdminStats,
  listAdminSubmissions,
  getAdminSubmission,
  updateStatus
};

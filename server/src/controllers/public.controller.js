import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/httpError.js';
import { parsePagination, isUuid, STATUSES, SUBMISSION_TYPES } from '../utils/validation.js';
import {
  mapSubmission,
  fetchTimeline,
  fetchAttachments,
  getSubmissionByTracking,
  searchSubmissions,
  countSubmissions,
  allowedTransitions
} from '../services/submissionView.service.js';
import { computeStats } from '../services/stats.service.js';
import { listCategories, listDistricts } from '../services/location.service.js';
import { normalizeTrackingNumber } from '../utils/trackingNumber.js';

export const getPublicStats = asyncHandler(async (_req, res) => {
  const stats = await computeStats("s.visibility = 'public'");
  res.json({ data: { stats } });
});

export const getPublicMeta = asyncHandler(async (_req, res) => {
  const [categories, districts] = await Promise.all([listCategories(), listDistricts()]);
  res.json({
    data: {
      categories,
      districts: districts.map((district) => ({
        id: district.id,
        provinceId: district.province_id,
        code: district.code,
        name_rw: district.name_rw,
        name_en: district.name_en,
        name_fr: district.name_fr
      }))
    }
  });
});

export const listPublicSubmissions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, 9);
  const conditions = ["s.visibility = 'public'"];
  const params = [];

  if (req.query.status && STATUSES.includes(req.query.status)) {
    conditions.push('s.status = ?');
    params.push(req.query.status);
  }
  if (req.query.type && SUBMISSION_TYPES.includes(req.query.type)) {
    conditions.push('s.type = ?');
    params.push(req.query.type);
  }
  if (req.query.category) {
    conditions.push('c.slug = ?');
    params.push(String(req.query.category));
  }
  if (req.query.district && isUuid(req.query.district)) {
    conditions.push('s.district_id = ?');
    params.push(req.query.district);
  }
  if (req.query.province && isUuid(req.query.province)) {
    conditions.push('s.province_id = ?');
    params.push(req.query.province);
  }
  if (req.query.search) {
    conditions.push('(s.subject LIKE ? OR s.description LIKE ? OR s.tracking_number LIKE ?)');
    const term = `%${String(req.query.search).trim()}%`;
    params.push(term, term, term);
  }

  const whereSql = conditions.join(' AND ');
  const rows = await searchSubmissions({ whereSql, params, limit, offset });
  const total = await countSubmissions(whereSql, params);

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

export const getPublicSubmission = asyncHandler(async (req, res) => {
  const trackingNumber = normalizeTrackingNumber(req.params.trackingNumber);
  const row = await getSubmissionByTracking(trackingNumber);
  if (!row || row.visibility !== 'public') {
    throw notFound('No public submission matches that tracking number.');
  }

  const [timeline, attachments] = await Promise.all([
    fetchTimeline(row.id, { publicOnly: true }),
    fetchAttachments(row.id, { publicOnly: true })
  ]);

  res.json({
    data: {
      submission: {
        ...mapSubmission(row, { includeCitizen: false }),
        timeline,
        attachments,
        allowedTransitions: allowedTransitions(row.status)
      }
    }
  });
});

export default {
  getPublicStats,
  getPublicMeta,
  listPublicSubmissions,
  getPublicSubmission
};

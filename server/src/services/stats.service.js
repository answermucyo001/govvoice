import { query, queryOne } from '../config/db.js';

const round = (value, digits = 1) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(digits));
};

export const computeStats = async (whereSql = '', params = []) => {
  const where = whereSql ? `WHERE ${whereSql}` : '';
  const row = await queryOne(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN s.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN s.status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
       SUM(CASE WHEN s.status = 'assigned' THEN 1 ELSE 0 END) AS assigned,
       SUM(CASE WHEN s.status IN ('awaiting_info','pending_citizen') THEN 1 ELSE 0 END) AS awaitingInfo,
       SUM(CASE WHEN s.status = 'response_given' THEN 1 ELSE 0 END) AS responseGiven,
       SUM(CASE WHEN s.visibility = 'public' THEN 1 ELSE 0 END) AS publicCount,
       SUM(CASE WHEN s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30Days,
       SUM(CASE WHEN s.due_at IS NOT NULL AND s.due_at < NOW()
                 AND s.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) AS overdue,
       AVG(CASE WHEN s.resolved_at IS NOT NULL
                THEN TIMESTAMPDIFF(HOUR, s.created_at, s.resolved_at) / 24 END) AS avgResolutionDays,
       AVG(s.satisfaction_rating) AS avgSatisfaction,
       SUM(CASE WHEN s.satisfaction_rating >= 4 THEN 1 ELSE 0 END) AS satisfiedCount,
       SUM(CASE WHEN s.satisfaction_rating IS NOT NULL THEN 1 ELSE 0 END) AS ratedCount
     FROM submissions s
     ${where}`,
    params
  );

  const total = Number(row?.total || 0);
  const resolved = Number(row?.resolved || 0);
  const rated = Number(row?.ratedCount || 0);
  const satisfied = Number(row?.satisfiedCount || 0);

  return {
    total,
    active: Number(row?.active || 0),
    resolved,
    overdue: Number(row?.overdue || 0),
    assigned: Number(row?.assigned || 0),
    awaitingInfo: Number(row?.awaitingInfo || 0),
    responseGiven: Number(row?.responseGiven || 0),
    publicCount: Number(row?.publicCount || 0),
    last30Days: Number(row?.last30Days || 0),
    avgResolutionDays: round(row?.avgResolutionDays || 0),
    avgSatisfaction: round(row?.avgSatisfaction || 0),
    satisfactionPercent: rated ? Math.round((satisfied / rated) * 100) : 0,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0
  };
};

export const statusBreakdown = async (whereSql = '', params = []) => {
  const where = whereSql ? `WHERE ${whereSql}` : '';
  const rows = await query(
    `SELECT s.status, COUNT(*) AS count FROM submissions s ${where} GROUP BY s.status ORDER BY count DESC`,
    params
  );
  return rows.map((row) => ({ status: row.status, count: Number(row.count) }));
};

export const categoryBreakdown = async (whereSql = '', params = []) => {
  const where = whereSql ? `WHERE ${whereSql}` : '';
  const rows = await query(
    `SELECT c.id, c.slug, c.name_rw, c.name_en, c.name_fr, COUNT(s.id) AS count
       FROM submissions s
       LEFT JOIN categories c ON c.id = s.category_id
       ${where}
      GROUP BY c.id, c.slug, c.name_rw, c.name_en, c.name_fr
      ORDER BY count DESC`,
    params
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name_rw: row.name_rw,
    name_en: row.name_en,
    name_fr: row.name_fr,
    count: Number(row.count)
  }));
};

export default { computeStats, statusBreakdown, categoryBreakdown };

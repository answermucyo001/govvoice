import { queryOne } from '../config/db.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { unauthorized, forbidden } from '../utils/httpError.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

const loadUser = async (userId) => {
  const user = await queryOne(
    `SELECT id, first_name, last_name, email, phone, role, language,
            province_id, district_id, sector_id, account_status, must_change_password
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [userId]
  );
  if (!user) return null;
  if (user.account_status !== 'active') return null;
  return user;
};

const toRequestUser = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  language: row.language,
  provinceId: row.province_id,
  districtId: row.district_id,
  sectorId: row.sector_id,
  mustChangePassword: Boolean(row.must_change_password)
});

export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await loadUser(payload.sub);
    if (user) req.user = toRequestUser(user);
  } catch {
    // Ignore invalid tokens for optional authentication.
  }
  return next();
};

export const authenticate = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Authentication required.'));
  try {
    const payload = verifyAccessToken(token);
    const user = await loadUser(payload.sub);
    if (!user) return next(unauthorized('Your session is no longer valid.'));
    req.user = toRequestUser(user);
    return next();
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized('Authentication required.'));
  if (!roles.includes(req.user.role)) {
    return next(forbidden('You do not have permission to perform this action.'));
  }
  return next();
};

export const requireOfficial = requireRole('district_head', 'sector_head', 'super_admin');

export default { authenticate, optionalAuth, requireRole, requireOfficial };

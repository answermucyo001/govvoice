import { queryOne } from '../config/db.js';
import { decryptValue } from './encryption.service.js';

const SELECT_USER = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.language,
         u.province_id, u.district_id, u.sector_id, u.address_line, u.account_status,
         u.must_change_password, u.created_at, u.last_login, u.national_id_encrypted,
         p.id AS p_id, p.code AS p_code, p.name_rw AS p_name_rw, p.name_en AS p_name_en, p.name_fr AS p_name_fr,
         d.id AS d_id, d.code AS d_code, d.name_rw AS d_name_rw, d.name_en AS d_name_en, d.name_fr AS d_name_fr,
         s.id AS s_id, s.code AS s_code, s.name_rw AS s_name_rw, s.name_en AS s_name_en, s.name_fr AS s_name_fr
    FROM users u
    LEFT JOIN provinces p ON p.id = u.province_id
    LEFT JOIN districts d ON d.id = u.district_id
    LEFT JOIN sectors s ON s.id = u.sector_id
   WHERE u.id = ?
   LIMIT 1`;

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

export const mapUser = (row, { includeNationalId = true } = {}) => {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    language: row.language,
    addressLine: row.address_line,
    accountStatus: row.account_status,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    lastLogin: row.last_login,
    nationalId: includeNationalId ? decryptValue(row.national_id_encrypted) : null,
    province: place(row, 'p'),
    district: place(row, 'd'),
    sector: place(row, 's'),
    provinceId: row.province_id,
    districtId: row.district_id,
    sectorId: row.sector_id
  };
};

export const findUserById = async (id, options) => {
  const row = await queryOne(SELECT_USER, [id]);
  return mapUser(row, options);
};

export const findUserRowById = async (id) => queryOne('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);

export default { mapUser, findUserById, findUserRowById };

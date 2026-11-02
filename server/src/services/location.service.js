import { query, queryOne } from '../config/db.js';

export const listProvinces = () =>
  query(
    `SELECT id, code, name_rw, name_en, name_fr
       FROM provinces
      ORDER BY code ASC`
  );

export const listDistricts = (provinceId) => {
  if (provinceId) {
    return query(
      `SELECT id, province_id, code, name_rw, name_en, name_fr
         FROM districts
        WHERE province_id = ?
        ORDER BY name_en ASC`,
      [provinceId]
    );
  }
  return query(
    `SELECT id, province_id, code, name_rw, name_en, name_fr
       FROM districts
      ORDER BY name_en ASC`
  );
};

export const listSectors = (districtId) => {
  if (districtId) {
    return query(
      `SELECT id, district_id, code, name_rw, name_en, name_fr
         FROM sectors
        WHERE district_id = ?
        ORDER BY name_en ASC`,
      [districtId]
    );
  }
  return query(
    `SELECT id, district_id, code, name_rw, name_en, name_fr
       FROM sectors
      ORDER BY name_en ASC`
  );
};

export const listCategories = () =>
  query(
    `SELECT c.id, c.slug, c.department_id, c.name_rw, c.name_en, c.name_fr,
            c.description_rw, c.description_en, c.description_fr, c.sla_hours, c.sort_order
       FROM categories c
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order ASC, c.name_en ASC`
  );

export const hierarchyExists = async ({ provinceId, districtId, sectorId }) => {
  if (!provinceId || !districtId || !sectorId) return false;
  const row = await queryOne(
    `SELECT 1 AS ok
       FROM sectors s
       JOIN districts d ON d.id = s.district_id
       JOIN provinces p ON p.id = d.province_id
      WHERE s.id = ? AND d.id = ? AND p.id = ?
      LIMIT 1`,
    [sectorId, districtId, provinceId]
  );
  return Boolean(row);
};

export const hierarchyForSector = async (sectorId) => {
  const row = await queryOne(
    `SELECT s.id AS sector_id, s.name_rw AS sector_rw, s.name_en AS sector_en, s.name_fr AS sector_fr,
            d.id AS district_id, d.name_rw AS district_rw, d.name_en AS district_en, d.name_fr AS district_fr,
            p.id AS province_id, p.name_rw AS province_rw, p.name_en AS province_en, p.name_fr AS province_fr
       FROM sectors s
       JOIN districts d ON d.id = s.district_id
       JOIN provinces p ON p.id = d.province_id
      WHERE s.id = ?
      LIMIT 1`,
    [sectorId]
  );
  if (!row) return null;
  return {
    province: {
      id: row.province_id,
      name_rw: row.province_rw,
      name_en: row.province_en,
      name_fr: row.province_fr
    },
    district: {
      id: row.district_id,
      name_rw: row.district_rw,
      name_en: row.district_en,
      name_fr: row.district_fr
    },
    sector: {
      id: row.sector_id,
      name_rw: row.sector_rw,
      name_en: row.sector_en,
      name_fr: row.sector_fr
    }
  };
};

export default {
  listProvinces,
  listDistricts,
  listSectors,
  listCategories,
  hierarchyExists,
  hierarchyForSector
};

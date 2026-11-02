import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { isUuid } from '../utils/validation.js';
import {
  listProvinces,
  listDistricts,
  listSectors,
  listCategories,
  hierarchyForSector
} from '../services/location.service.js';

export const getProvinces = asyncHandler(async (_req, res) => {
  const provinces = await listProvinces();
  res.json({ data: { provinces } });
});

export const getDistricts = asyncHandler(async (req, res) => {
  const provinceId = req.query.provinceId;
  if (provinceId && !isUuid(provinceId)) {
    throw badRequest('Invalid province id.');
  }
  const districts = await listDistricts(provinceId);
  res.json({
    data: {
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

export const getSectors = asyncHandler(async (req, res) => {
  const districtId = req.query.districtId;
  if (districtId && !isUuid(districtId)) {
    throw badRequest('Invalid district id.');
  }
  const sectors = await listSectors(districtId);
  res.json({
    data: {
      sectors: sectors.map((sector) => ({
        id: sector.id,
        districtId: sector.district_id,
        code: sector.code,
        name_rw: sector.name_rw,
        name_en: sector.name_en,
        name_fr: sector.name_fr
      }))
    }
  });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ data: { categories } });
});

export const getHierarchy = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.sectorId)) throw notFound('Sector not found.');
  const hierarchy = await hierarchyForSector(req.params.sectorId);
  if (!hierarchy) throw notFound('Sector not found.');
  res.json({ data: { hierarchy } });
});

export default {
  getProvinces,
  getDistricts,
  getSectors,
  getCategories,
  getHierarchy
};

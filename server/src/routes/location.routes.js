import { Router } from 'express';
import {
  getProvinces,
  getDistricts,
  getSectors,
  getCategories,
  getHierarchy
} from '../controllers/location.controller.js';
import { publicLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(publicLimiter);

router.get('/provinces', getProvinces);
router.get('/districts', getDistricts);
router.get('/sectors', getSectors);
router.get('/categories', getCategories);
router.get('/hierarchy/:sectorId', getHierarchy);

export default router;

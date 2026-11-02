import { Router } from 'express';
import {
  getPublicStats,
  getPublicMeta,
  listPublicSubmissions,
  getPublicSubmission
} from '../controllers/public.controller.js';
import { publicLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(publicLimiter);

router.get('/stats', getPublicStats);
router.get('/meta', getPublicMeta);
router.get('/submissions', listPublicSubmissions);
router.get('/submissions/:trackingNumber', getPublicSubmission);

export default router;

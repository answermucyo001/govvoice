import { Router } from 'express';
import {
  getAdminStats,
  listAdminSubmissions,
  getAdminSubmission,
  updateStatus,
  exportAdminSubmissions
} from '../controllers/admin.controller.js';
import { authenticate, requireOfficial } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireOfficial);

router.get('/stats', getAdminStats);
router.get('/submissions/export', exportAdminSubmissions);
router.get('/submissions', listAdminSubmissions);
router.get('/submissions/:id', getAdminSubmission);
router.patch('/submissions/:id/status', updateStatus);

export default router;

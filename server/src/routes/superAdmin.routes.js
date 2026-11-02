import { Router } from 'express';
import {
  getOverview,
  listDistrictHeads,
  listDistricts,
  createDistrictHead,
  updateDistrictHead,
  toggleDistrictHead,
  resetHeadPassword,
  listAuditLogs,
  listNotifications,
  listStatuses
} from '../controllers/superAdmin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/overview', getOverview);
router.get('/districts', listDistricts);
router.get('/district-heads', listDistrictHeads);
router.post('/district-heads', createDistrictHead);
router.patch('/district-heads/:id', updateDistrictHead);
router.patch('/district-heads/:id/status', toggleDistrictHead);
router.post('/district-heads/:id/reset-password', resetHeadPassword);
router.get('/audit-logs', listAuditLogs);
router.get('/notifications', listNotifications);
router.get('/statuses', listStatuses);

export default router;

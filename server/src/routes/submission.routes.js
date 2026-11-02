import { Router } from 'express';
import {
  createSubmission,
  listMySubmissions,
  myStats,
  getMySubmission,
  trackSubmission,
  confirmResolution,
  reopenSubmission,
  replyToSubmission
} from '../controllers/submission.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', authenticate, submissionLimiter, createSubmission);
router.get('/', authenticate, listMySubmissions);
router.get('/stats/mine', authenticate, myStats);
router.get('/track/:trackingNumber', optionalAuth, trackSubmission);

router.get('/:id', authenticate, getMySubmission);
router.post('/:id/confirm', authenticate, confirmResolution);
router.post('/:id/reopen', authenticate, reopenSubmission);
router.post('/:id/reply', authenticate, replyToSubmission);

export default router;

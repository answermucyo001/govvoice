import { Router } from 'express';
import {
  uploadAttachment,
  deleteAttachment,
  downloadAttachment
} from '../controllers/attachment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingle, uploadAttachment);
router.delete('/:id', deleteAttachment);
router.get('/:id/download', downloadAttachment);

export default router;

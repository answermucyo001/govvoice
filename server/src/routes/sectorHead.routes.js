import { Router } from 'express';
import {
  listSectorHeads,
  createSectorHead,
  toggleSectorHead,
  resetSectorHeadPassword
} from '../controllers/sectorHead.controller.js';
import { authenticate, requireOfficial } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireOfficial);

router.get('/', listSectorHeads);
router.post('/', createSectorHead);
router.patch('/:id/status', toggleSectorHead);
router.post('/:id/reset-password', resetSectorHeadPassword);

export default router;

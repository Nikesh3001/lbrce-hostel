import { Router } from 'express';
import { complaintController } from '../controllers/complaint.controller';

const router = Router();

router.get('/', complaintController.getAll);
router.post('/', complaintController.create);
router.put('/:id/status', complaintController.updateStatus);

export default router;

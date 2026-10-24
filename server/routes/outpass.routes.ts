import { Router } from 'express';
import { outpassController } from '../controllers/outpass.controller';

const router = Router();

router.get('/', outpassController.getAll);
router.post('/', outpassController.create);
router.put('/:id/status', outpassController.updateStatus);

export default router;

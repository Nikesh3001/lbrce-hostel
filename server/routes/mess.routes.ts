import { Router } from 'express';
import { messController } from '../controllers/mess.controller';

const router = Router();

router.get('/', messController.getMenu);
router.put('/:day', messController.updateDay);

export default router;

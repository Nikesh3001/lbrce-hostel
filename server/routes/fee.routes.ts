import { Router } from 'express';
import { feeController } from '../controllers/fee.controller';

const router = Router();

router.get('/', feeController.getAll);
router.post('/:id/pay', feeController.pay);

export default router;

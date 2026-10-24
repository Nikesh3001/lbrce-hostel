import { Router } from 'express';
import { noticeController } from '../controllers/notice.controller';

const router = Router();

router.get('/', noticeController.getAll);
router.post('/', noticeController.create);

export default router;

import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

router.get('/', attendanceController.getDaily);
router.post('/record', attendanceController.updateRecord);
router.post('/mark-all', attendanceController.markAll);
router.put('/:id/toggle', attendanceController.toggle);

export default router;

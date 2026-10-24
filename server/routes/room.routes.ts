import { Router } from 'express';
import { roomController } from '../controllers/room.controller';

const router = Router();

router.get('/', roomController.getAllRooms);
router.post('/update-resident', roomController.updateResident);
router.post('/:id/allocate', roomController.allocateBed);
router.post('/:id/vacate', roomController.vacateBed);

export default router;

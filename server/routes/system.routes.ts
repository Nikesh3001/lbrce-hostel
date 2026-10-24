import { Router } from 'express';
import { systemController } from '../controllers/system.controller';

const router = Router();

router.get('/telemetry', systemController.getTelemetry);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes';
import roomRoutes from './room.routes';
import outpassRoutes from './outpass.routes';
import complaintRoutes from './complaint.routes';
import noticeRoutes from './notice.routes';
import messRoutes from './mess.routes';
import feeRoutes from './fee.routes';
import attendanceRoutes from './attendance.routes';
import systemRoutes from './system.routes';
import { db } from '../db';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/rooms', roomRoutes);
apiRouter.use('/outpasses', outpassRoutes);
apiRouter.use('/complaints', complaintRoutes);
apiRouter.use('/notices', noticeRoutes);
apiRouter.use('/mess', messRoutes);
apiRouter.use('/fees', feeRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/system', systemRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'LBRCE Hostel Management System (MERN Stack)',
    stack: {
      database: db.isMongo() ? 'MongoDB Atlas' : 'In-Memory Document Store',
      backend: 'Express & Node.js',
      frontend: 'React 19',
    },
    timestamp: new Date().toISOString(),
  });
});

// Reset endpoint
apiRouter.post('/reset', (req, res) => {
  db.resetAll();
  res.json({ message: 'All MERN documents reset to initial seeds' });
});

export default apiRouter;

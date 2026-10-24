import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { db } from '../db';
import { mernDb } from '../config/db';

export const systemController = {
  getTelemetry: async (req: Request, res: Response) => {
    const memory = process.memoryUsage();
    const uptime = process.uptime();

    const rooms = await db.getRooms();
    const outpasses = await db.getOutpasses();
    const complaints = await db.getComplaints();
    const notices = await db.getNotices();
    const mess = await db.getMessMenu();
    const fees = await db.getFees();
    const attendance = await db.getAttendance();

    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV || 'development',
      mernStack: {
        mongodb: {
          driver: 'Mongoose',
          version: mongoose.version,
          connected: db.isMongo(),
          mode: db.isMongo() ? 'MongoDB Atlas (Cluster)' : 'In-Memory Document Store (Seed Loaded)',
          collections: [
            { name: 'users', count: 3 },
            { name: 'rooms', count: rooms.length },
            { name: 'outpasses', count: outpasses.length },
            { name: 'complaints', count: complaints.length },
            { name: 'notices', count: notices.length },
            { name: 'messmenus', count: mess.length },
            { name: 'fees', count: fees.length },
            { name: 'attendances', count: attendance.length },
          ],
        },
        express: {
          version: '4.21.2',
          endpoints: [
            'POST /api/auth/login',
            'GET /api/rooms',
            'POST /api/rooms/:id/allocate',
            'POST /api/rooms/:id/vacate',
            'GET /api/outpasses',
            'POST /api/outpasses',
            'PUT /api/outpasses/:id/status',
            'GET /api/complaints',
            'POST /api/complaints',
            'PUT /api/complaints/:id/status',
            'GET /api/notices',
            'POST /api/notices',
            'GET /api/mess',
            'PUT /api/mess/:day',
            'GET /api/fees',
            'POST /api/fees/:id/pay',
            'GET /api/attendance',
            'PUT /api/attendance/:id/toggle',
            'GET /api/system/telemetry',
          ],
        },
        react: {
          version: '19.0.1',
          architecture: 'Vite SPA + React Hooks + Context API',
        },
        nodejs: {
          version: process.version,
          platform: process.platform,
          uptimeSeconds: Math.floor(uptime),
          heapUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMB: (memory.heapTotal / 1024 / 1024).toFixed(2),
        },
      },
      timestamp: new Date().toISOString(),
    });
  },
};

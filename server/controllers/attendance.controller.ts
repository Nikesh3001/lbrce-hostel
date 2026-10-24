import { Request, Response } from 'express';
import { db } from '../db';

export const attendanceController = {
  getDaily: async (req: Request, res: Response) => {
    try {
      const records = await db.getAttendance();
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  toggle: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const updated = await db.toggleAttendance(req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateRecord: async (req: Request, res: Response) => {
    try {
      const record = req.body;
      const updated = await db.updateAttendanceRecord(record);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  markAll: async (req: Request, res: Response) => {
    try {
      const { status, date } = req.body;
      const updated = await db.markAllAttendance(status, date);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

import { Request, Response } from 'express';
import { db } from '../db';

export const complaintController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const list = await db.getComplaints();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const created = await db.createComplaint(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status, adminRemarks } = req.body;
      const updated = await db.updateComplaintStatus(req.params.id, status, adminRemarks);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

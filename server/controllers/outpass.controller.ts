import { Request, Response } from 'express';
import { db } from '../db';

export const outpassController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const list = await db.getOutpasses();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const created = await db.createOutpass(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status, approvedBy, rejectionReason } = req.body;
      const updated = await db.updateOutpassStatus(req.params.id, status, approvedBy, rejectionReason);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

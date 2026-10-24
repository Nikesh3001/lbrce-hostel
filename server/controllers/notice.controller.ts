import { Request, Response } from 'express';
import { db } from '../db';

export const noticeController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const list = await db.getNotices();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const created = await db.createNotice(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

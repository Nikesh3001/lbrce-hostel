import { Request, Response } from 'express';
import { db } from '../db';

export const messController = {
  getMenu: async (req: Request, res: Response) => {
    try {
      const menu = await db.getMessMenu();
      res.json(menu);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateDay: async (req: Request, res: Response) => {
    try {
      const updated = await db.updateMessMenu(req.params.day, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

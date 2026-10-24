import { Request, Response } from 'express';
import { db } from '../db';

export const feeController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const fees = await db.getFees();
      res.json(fees);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  pay: async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;
      const updated = await db.payFee(req.params.id, Number(amount));
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

import { Request, Response } from 'express';
import { db } from '../db';

export const roomController = {
  getAllRooms: async (req: Request, res: Response) => {
    try {
      const rooms = await db.getRooms();
      res.json(rooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  allocateBed: async (req: Request, res: Response) => {
    try {
      const { bedNumber, student } = req.body;
      const rooms = await db.allocateBed(req.params.id, Number(bedNumber), student);
      res.json(rooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  vacateBed: async (req: Request, res: Response) => {
    try {
      const { bedNumber } = req.body;
      const rooms = await db.vacateBed(req.params.id, Number(bedNumber));
      res.json(rooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  updateResident: async (req: Request, res: Response) => {
    try {
      const { oldStudent, newStudent } = req.body;
      const result = await db.updateResidentEverywhere(oldStudent, newStudent);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
};

import { Request, Response } from 'express';
import { db } from '../db';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Roll number or email and password are required' });
      }

      const user = await db.findUserByEmailOrRoll(identifier);
      if (!user) {
        return res.status(401).json({ error: 'User not registered in LBRCE database' });
      }

      if (user.passwordHash !== password) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const { passwordHash, ...safeProfile } = user;
      res.json({
        user: safeProfile,
        token: `lbrce_mern_jwt_${safeProfile.id}`,
        message: 'Successfully authorized',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Authentication error' });
    }
  },

  getHealth: (req: Request, res: Response) => {
    res.json({
      status: 'online',
      system: 'LBRCE Hostel Management System (MERN Stack)',
      stack: {
        database: db.isMongo() ? 'MongoDB Atlas (Connected via Mongoose)' : 'MongoDB Document Store (In-Memory Fallback)',
        backend: 'Express 4 on Node.js',
        frontend: 'React 19 + Tailwind CSS',
      },
      timestamp: new Date().toISOString(),
    });
  },
};

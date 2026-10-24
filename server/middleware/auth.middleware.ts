import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'student';
    name: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required in Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  // Token decoding simulation for MERN demo
  req.user = {
    id: token.replace('lbrce_mern_jwt_', ''),
    role: token.includes('admin') ? 'admin' : 'student',
    name: token.includes('admin') ? 'Chief Warden' : 'Student',
  };

  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Chief Warden administrator privileges required' });
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const db = getDatabase();
    db.get(
      'SELECT id, email, name, role, department, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId],
      (err, row: any) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'User not found' });
        }

        req.user = row as User;
        next();
      }
    );
    db.close();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/config';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password }: LoginRequest = req.body;
    const db = getDatabase();

    const users = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0 || !bcrypt.compareSync(password, users[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const row = users[0];
    const token = jwt.sign(
      { userId: row.id, email: row.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      department: row.department,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    const response: AuthResponse = { token, user };
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (Admin only)
router.post('/register', authenticateToken, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 })
], async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, department }: RegisterRequest = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const db = getDatabase();

    try {
      await db.query(
        'INSERT INTO users (email, password, name, role, department) VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, name, 'employee', department || null]
      );

      res.status(201).json({ 
        message: 'User created successfully'
      });
    } catch (dbError: any) {
      if (dbError.message.includes('UNIQUE constraint failed') || dbError.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: express.Response) => {
  res.json(req.user);
});

export default router;
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init';
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

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row: any) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!row || !bcrypt.compareSync(password, row.password)) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

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
      }
    );
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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

    db.run(
      'INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 'employee', department || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ 
          message: 'User created successfully',
          userId: this.lastID 
        });
      }
    );
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: express.Response) => {
  res.json(req.user);
});

export default router;

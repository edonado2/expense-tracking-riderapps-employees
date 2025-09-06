import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/config';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const db = getDatabase();
    const users = await db.query(
      'SELECT id, email, name, role, department, created_at, updated_at FROM users ORDER BY name'
    );

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = parseInt(req.params.id);
    const db = getDatabase();
    
    const users = await db.query(
      'SELECT id, email, name, role, department, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = parseInt(req.params.id);
    const { name, role, department } = req.body;
    const db = getDatabase();

    // Check if user exists
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.query(
      'UPDATE users SET name = $1, role = $2, department = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [name, role, department, userId]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = parseInt(req.params.id);
    const db = getDatabase();

    // Check if user exists
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's rides first
    await db.query('DELETE FROM rides WHERE user_id = $1', [userId]);
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
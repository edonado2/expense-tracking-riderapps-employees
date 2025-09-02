import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/init';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, (req: AuthRequest, res: express.Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = getDatabase();
  db.all(
    'SELECT id, email, name, role, department, created_at, updated_at FROM users ORDER BY name',
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
  db.close();
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, (req: AuthRequest, res: express.Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const db = getDatabase();
  
  db.get(
    'SELECT id, email, name, role, department, created_at, updated_at FROM users WHERE id = ?',
    [userId],
    (err, row: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(row);
    }
  );
  db.close();
});

// Update user (Admin only)
router.put('/:id', authenticateToken, (req: AuthRequest, res: express.Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const { name, department, role } = req.body;
  const db = getDatabase();

  db.run(
    'UPDATE users SET name = ?, department = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, department, role, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    }
  );
  db.close();
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, (req: AuthRequest, res: express.Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const userId = parseInt(req.params.id);
  const db = getDatabase();

  // Don't allow deleting the current admin user
  if (userId === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run(
    'DELETE FROM users WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    }
  );
  db.close();
});

export default router;

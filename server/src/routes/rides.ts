import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { CreateRideRequest, Ride } from '../types';

const router = express.Router();

// Get user's rides
router.get('/', authenticateToken, (req: AuthRequest, res: express.Response) => {
  const db = getDatabase();
  
  db.all(
    `SELECT r.*, u.name as user_name 
     FROM rides r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.user_id = ? 
     ORDER BY r.ride_date DESC`,
    [req.user!.id],
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
  db.close();
});

// Create new ride
router.post('/', authenticateToken, [
  body('app_name').isIn(['uber', 'lyft', 'didi']),
  body('pickup_location').isLength({ min: 1 }),
  body('destination').isLength({ min: 1 }),
  body('distance_km').isFloat({ min: 0 }),
  body('duration_minutes').isInt({ min: 1 }),
  body('cost_usd').isFloat({ min: 0 }),
  body('ride_date').isISO8601()
], (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rideData: CreateRideRequest = req.body;
    const db = getDatabase();

    db.run(
      `INSERT INTO rides (user_id, app_name, pickup_location, destination, 
                         distance_km, duration_minutes, cost_usd, ride_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user!.id,
        rideData.app_name,
        rideData.pickup_location,
        rideData.destination,
        rideData.distance_km,
        rideData.duration_minutes,
        rideData.cost_usd,
        rideData.ride_date,
        rideData.notes || null
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ 
          message: 'Ride created successfully',
          rideId: this.lastID 
        });
      }
    );
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update ride
router.put('/:id', authenticateToken, [
  body('app_name').optional().isIn(['uber', 'lyft', 'didi']),
  body('pickup_location').optional().isLength({ min: 1 }),
  body('destination').optional().isLength({ min: 1 }),
  body('distance_km').optional().isFloat({ min: 0 }),
  body('duration_minutes').optional().isInt({ min: 1 }),
  body('cost_usd').optional().isFloat({ min: 0 }),
  body('ride_date').optional().isISO8601()
], (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rideId = parseInt(req.params.id);
    const updateData = req.body;
    const db = getDatabase();

    // First check if ride belongs to user
    db.get(
      'SELECT * FROM rides WHERE id = ? AND user_id = ?',
      [rideId, req.user!.id],
      (err, row: any) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Ride not found' });
        }

        // Build update query dynamically
        const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
        if (fields.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updateData[field]);

        db.run(
          `UPDATE rides SET ${setClause} WHERE id = ? AND user_id = ?`,
          [...values, rideId, req.user!.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Ride updated successfully' });
          }
        );
      }
    );
    db.close();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete ride
router.delete('/:id', authenticateToken, (req: AuthRequest, res: express.Response) => {
  const rideId = parseInt(req.params.id);
  const db = getDatabase();

  db.run(
    'DELETE FROM rides WHERE id = ? AND user_id = ?',
    [rideId, req.user!.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ride not found' });
      }
      res.json({ message: 'Ride deleted successfully' });
    }
  );
  db.close();
});

// Get user's spending summary
router.get('/summary', authenticateToken, (req: AuthRequest, res: express.Response) => {
  const db = getDatabase();
  
  // Get total rides and cost
  db.get(
    `SELECT 
       COUNT(*) as total_rides,
       SUM(cost_usd) as total_cost,
       AVG(cost_usd) as avg_cost
     FROM rides 
     WHERE user_id = ?`,
    [req.user!.id],
    (err, totals: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get breakdown by app
      db.all(
        `SELECT 
           app_name,
           COUNT(*) as count,
           SUM(cost_usd) as cost
         FROM rides 
         WHERE user_id = ? 
         GROUP BY app_name`,
        [req.user!.id],
        (err, appBreakdown: any[]) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get monthly breakdown
          db.all(
            `SELECT 
               strftime('%Y-%m', ride_date) as month,
               COUNT(*) as rides,
               SUM(cost_usd) as cost
             FROM rides 
             WHERE user_id = ? 
             GROUP BY strftime('%Y-%m', ride_date)
             ORDER BY month DESC
             LIMIT 12`,
            [req.user!.id],
            (err, monthlyBreakdown: any[]) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              const ridesByApp = {
                uber: { count: 0, cost: 0 },
                lyft: { count: 0, cost: 0 },
                didi: { count: 0, cost: 0 }
              };

              appBreakdown.forEach(app => {
                ridesByApp[app.app_name as keyof typeof ridesByApp] = {
                  count: app.count,
                  cost: app.cost
                };
              });

              res.json({
                total_rides: totals.total_rides || 0,
                total_cost: totals.total_cost || 0,
                avg_cost: totals.avg_cost || 0,
                rides_by_app: ridesByApp,
                monthly_breakdown: monthlyBreakdown
              });
            }
          );
        }
      );
    }
  );
  db.close();
});

export default router;

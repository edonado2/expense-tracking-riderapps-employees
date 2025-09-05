import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/config';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { CreateRideRequest, Ride } from '../types';

const router = express.Router();

// Get user's rides
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    const rides = await db.query(
      `SELECT r.*, u.name as user_name 
       FROM rides r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ? 
       ORDER BY r.ride_date DESC`,
      [req.user!.id]
    );

    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rideData: CreateRideRequest = req.body;
    const db = getDatabase();

    await db.query(
      `INSERT INTO rides (user_id, app_name, pickup_location, destination, distance_km, duration_minutes, cost_usd, ride_date, notes)
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
      ]
    );

    res.status(201).json({ message: 'Ride created successfully' });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Internal server error' });
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
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const rideId = parseInt(req.params.id);
    const db = getDatabase();

    // Check if ride exists and belongs to user
    const existingRides = await db.query(
      'SELECT * FROM rides WHERE id = ? AND user_id = ?',
      [rideId, req.user!.id]
    );

    if (existingRides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Update ride
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(rideId);

    await db.query(
      `UPDATE rides SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Ride updated successfully' });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ride
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const rideId = parseInt(req.params.id);
    const db = getDatabase();

    // Check if ride exists and belongs to user
    const existingRides = await db.query(
      'SELECT * FROM rides WHERE id = ? AND user_id = ?',
      [rideId, req.user!.id]
    );

    if (existingRides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    await db.query('DELETE FROM rides WHERE id = ?', [rideId]);

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ride summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    const summary = await db.query(
      `SELECT 
        COUNT(*) as total_rides,
        SUM(cost_usd) as total_cost,
        AVG(cost_usd) as avg_cost,
        SUM(CASE WHEN app_name = 'uber' THEN 1 ELSE 0 END) as uber_rides,
        SUM(CASE WHEN app_name = 'uber' THEN cost_usd ELSE 0 END) as uber_cost,
        SUM(CASE WHEN app_name = 'lyft' THEN 1 ELSE 0 END) as lyft_rides,
        SUM(CASE WHEN app_name = 'lyft' THEN cost_usd ELSE 0 END) as lyft_cost,
        SUM(CASE WHEN app_name = 'didi' THEN 1 ELSE 0 END) as didi_rides,
        SUM(CASE WHEN app_name = 'didi' THEN cost_usd ELSE 0 END) as didi_cost
       FROM rides 
       WHERE user_id = ?`,
      [req.user!.id]
    );

    const monthlyBreakdown = await db.query(
      `SELECT 
        strftime('%Y-%m', ride_date) as month,
        COUNT(*) as rides,
        SUM(cost_usd) as cost
       FROM rides 
       WHERE user_id = ? 
       GROUP BY strftime('%Y-%m', ride_date)
       ORDER BY month DESC
       LIMIT 12`,
      [req.user!.id]
    );

    res.json({
      ...summary[0],
      monthly_breakdown: monthlyBreakdown
    });
  } catch (error) {
    console.error('Error fetching ride summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
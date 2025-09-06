import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/config';
import { CreateRideRequest, UpdateRideRequest } from '../types';

const router = express.Router();

// Get all rides for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    const rides = await db.query(
      `SELECT r.*, u.name as user_name 
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1 
       ORDER BY r.ride_date DESC`,
      [req.user!.id]
    );

    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new ride
router.post('/', authenticateToken, [
  body('app_name').notEmpty().withMessage('App name is required'),
  body('pickup_location').notEmpty().withMessage('Pickup location is required'),
  body('destination').notEmpty().withMessage('Destination is required'),
  body('distance_km').isNumeric().withMessage('Distance must be a number'),
  body('duration_minutes').isInt().withMessage('Duration must be an integer'),
  body('cost_usd').isNumeric().withMessage('Cost must be a number'),
  body('ride_date').isISO8601().withMessage('Ride date must be a valid date')
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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

// Update a ride
router.put('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const rideId = parseInt(req.params.id);
    const db = getDatabase();

    // Check if ride exists and belongs to user
    const existingRides = await db.query(
      'SELECT * FROM rides WHERE id = $1 AND user_id = $2',
      [rideId, req.user!.id]
    );

    if (existingRides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Update ride
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(req.body[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(rideId);

    await db.query(
      `UPDATE rides SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    );

    res.json({ message: 'Ride updated successfully' });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a ride
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const rideId = parseInt(req.params.id);
    const db = getDatabase();

    // Check if ride exists and belongs to user
    const existingRides = await db.query(
      'SELECT * FROM rides WHERE id = $1 AND user_id = $2',
      [rideId, req.user!.id]
    );

    if (existingRides.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    await db.query('DELETE FROM rides WHERE id = $1', [rideId]);

    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ride summary for the authenticated user
router.get('/summary', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    // Get total rides and cost
    const totalStats = await db.query(
      `SELECT 
         COUNT(*) as total_rides,
         SUM(cost_usd) as total_cost,
         AVG(cost_usd) as avg_cost
       FROM rides 
       WHERE user_id = $1`,
      [req.user!.id]
    );

    // Get rides by app
    const appStats = await db.query(
      `SELECT 
         app_name,
         COUNT(*) as count,
         SUM(cost_usd) as cost
       FROM rides 
       WHERE user_id = $1
       GROUP BY app_name`,
      [req.user!.id]
    );

    // Get monthly breakdown
    const monthlyStats = await db.query(
      `SELECT 
         DATE_TRUNC('month', ride_date) as month,
         COUNT(*) as rides,
         SUM(cost_usd) as cost
       FROM rides 
       WHERE user_id = $1
       GROUP BY DATE_TRUNC('month', ride_date)
       ORDER BY month DESC`,
      [req.user!.id]
    );

    // Format the response
    const summaryData = {
      total_rides: totalStats[0]?.total_rides || 0,
      total_cost: totalStats[0]?.total_cost || 0,
      avg_cost: totalStats[0]?.avg_cost || 0,
      rides_by_app: {
        uber: { count: 0, cost: 0 },
        lyft: { count: 0, cost: 0 },
        didi: { count: 0, cost: 0 }
      },
      monthly_breakdown: monthlyStats.map((stat: any) => ({
        month: new Date(stat.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        rides: stat.rides,
        cost: stat.cost
      }))
    };

    // Populate app stats
    appStats.forEach((stat: any) => {
      if (summaryData.rides_by_app[stat.app_name as keyof typeof summaryData.rides_by_app]) {
        summaryData.rides_by_app[stat.app_name as keyof typeof summaryData.rides_by_app] = {
          count: stat.count,
          cost: stat.cost
        };
      }
    });

    res.json(summaryData);
  } catch (error) {
    console.error('Error fetching ride summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
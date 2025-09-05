import express from 'express';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { getDatabase } from '../database/config';
import { SpendingSummary } from '../types';

const router = express.Router();

// Get all spending data (Admin only)
router.get('/spending', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    // Get all users with their spending data
    const users = await db.query(
      `SELECT 
         u.id,
         u.name,
         u.department,
         COUNT(r.id) as total_rides,
         COALESCE(SUM(r.cost_usd), 0) as total_cost
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       GROUP BY u.id, u.name, u.department
       ORDER BY total_cost DESC`
    );

    // Get app usage breakdown for each user
    const spendingData: SpendingSummary[] = [];
    
    for (const user of users) {
      const appUsage = await db.query(
        `SELECT 
           app_name,
           COUNT(*) as count,
           SUM(cost_usd) as cost
         FROM rides 
         WHERE user_id = ?
         GROUP BY app_name`,
        [user.id]
      );

      const ridesByApp = {
        uber: { count: 0, cost: 0 },
        lyft: { count: 0, cost: 0 },
        didi: { count: 0, cost: 0 }
      };

      appUsage.forEach((app: any) => {
        ridesByApp[app.app_name as keyof typeof ridesByApp] = {
          count: app.count,
          cost: app.cost
        };
      });

      // Get monthly breakdown
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
        [user.id]
      );

      spendingData.push({
        user_id: user.id,
        user_name: user.name,
        department: user.department,
        total_rides: user.total_rides,
        total_cost: user.total_cost,
        rides_by_app: ridesByApp,
        monthly_breakdown: monthlyBreakdown
      });
    }

    res.json(spendingData);
  } catch (error) {
    console.error('Error fetching spending data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    // Overall stats
    const overallStats = await db.query(
      `SELECT 
         COUNT(DISTINCT u.id) as total_users,
         COUNT(r.id) as total_rides,
         COALESCE(SUM(r.cost_usd), 0) as total_spending,
         COALESCE(AVG(r.cost_usd), 0) as avg_cost_per_ride
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id`
    );

    // App usage stats
    const appUsage = await db.query(
      `SELECT 
         app_name,
         COUNT(*) as ride_count,
         SUM(cost_usd) as total_cost,
         AVG(cost_usd) as avg_cost
       FROM rides
       GROUP BY app_name
       ORDER BY total_cost DESC`
    );

    // Department stats
    const departmentStats = await db.query(
      `SELECT 
         COALESCE(u.department, 'No Department') as department,
         COUNT(DISTINCT u.id) as user_count,
         COUNT(r.id) as total_rides,
         COALESCE(SUM(r.cost_usd), 0) as total_cost
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       GROUP BY u.department
       ORDER BY total_cost DESC`
    );

    res.json({
      overall: overallStats[0],
      app_usage: appUsage,
      departments: departmentStats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department spending (Admin only)
router.get('/departments', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    const departmentData = await db.query(
      `SELECT 
         COALESCE(u.department, 'No Department') as department,
         COUNT(DISTINCT u.id) as user_count,
         COUNT(r.id) as total_rides,
         COALESCE(SUM(r.cost_usd), 0) as total_cost,
         COALESCE(AVG(r.cost_usd), 0) as avg_cost_per_ride
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       GROUP BY u.department
       ORDER BY total_cost DESC`
    );

    res.json(departmentData);
  } catch (error) {
    console.error('Error fetching department data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user monthly spending (Admin only)
router.get('/spending/:userId/monthly', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    // Get user info
    const users = await db.query(
      'SELECT id, name, email, department FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get monthly breakdown
    const monthlyData = await db.query(
      `SELECT 
         strftime('%Y-%m', ride_date) as month,
         COUNT(*) as total_rides,
         SUM(cost_usd) as total_cost,
         AVG(cost_usd) as avg_cost_per_ride,
         SUM(CASE WHEN app_name = 'uber' THEN cost_usd ELSE 0 END) as uber_cost,
         SUM(CASE WHEN app_name = 'uber' THEN 1 ELSE 0 END) as uber_rides,
         SUM(CASE WHEN app_name = 'lyft' THEN cost_usd ELSE 0 END) as lyft_cost,
         SUM(CASE WHEN app_name = 'lyft' THEN 1 ELSE 0 END) as lyft_rides,
         SUM(CASE WHEN app_name = 'didi' THEN cost_usd ELSE 0 END) as didi_cost,
         SUM(CASE WHEN app_name = 'didi' THEN 1 ELSE 0 END) as didi_rides
       FROM rides 
       WHERE user_id = ?
       GROUP BY strftime('%Y-%m', ride_date)
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );

    // Get recent rides
    const recentRides = await db.query(
      `SELECT 
         r.*,
         strftime('%Y-%m', r.ride_date) as month
       FROM rides r
       WHERE r.user_id = ?
       ORDER BY r.ride_date DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      user: users[0],
      monthly_breakdown: monthlyData,
      recent_rides: recentRides
    });
  } catch (error) {
    console.error('Error fetching user monthly spending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
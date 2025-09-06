import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/config';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get overall spending data
router.get('/spending', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    const users = await db.query('SELECT id, name, email, department FROM users');

    const spendingData = [];
    for (const user of users) {
      const appUsage = await db.query(
        `SELECT 
           app_name,
           COUNT(*) as count,
           SUM(cost_usd) as cost
         FROM rides 
         WHERE user_id = $1
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

      const totalRides = appUsage.reduce((sum: number, app: any) => sum + app.count, 0);
      const totalCost = appUsage.reduce((sum: number, app: any) => sum + app.cost, 0);

      spendingData.push({
        user_id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        total_rides: totalRides,
        total_cost: totalCost,
        rides_by_app: ridesByApp
      });
    }

    res.json(spendingData);
  } catch (error) {
    console.error('Error fetching spending data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department spending
router.get('/departments', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    const departmentStats = await db.query(
      `SELECT 
         u.department,
         COUNT(DISTINCT u.id) as employee_count,
         COUNT(r.id) as total_rides,
         SUM(r.cost_usd) as total_cost,
         AVG(r.cost_usd) as avg_cost_per_ride
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       WHERE u.department IS NOT NULL
       GROUP BY u.department
       ORDER BY total_cost DESC`
    );

    res.json(departmentStats);
  } catch (error) {
    console.error('Error fetching department data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const db = getDatabase();
    
    // Overall stats
    const overallStats = await db.query(
      `SELECT 
         COUNT(DISTINCT u.id) as total_users,
         COUNT(r.id) as total_rides,
         SUM(r.cost_usd) as total_spending,
         AVG(r.cost_usd) as avg_cost_per_ride
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
         u.department,
         COUNT(DISTINCT u.id) as employee_count,
         COUNT(r.id) as total_rides,
         SUM(r.cost_usd) as total_cost,
         AVG(r.cost_usd) as avg_cost_per_ride
       FROM users u
       LEFT JOIN rides r ON u.id = r.user_id
       WHERE u.department IS NOT NULL
       GROUP BY u.department
       ORDER BY total_cost DESC`
    );

    // Monthly trends
    const monthlyTrends = await db.query(
      `SELECT
         DATE_TRUNC('month', ride_date) as month,
         COUNT(*) as rides,
         SUM(cost_usd) as cost
       FROM rides
       GROUP BY DATE_TRUNC('month', ride_date)
       ORDER BY month DESC
       LIMIT 12`
    );

    res.json({
      overall: overallStats[0] || { total_users: 0, total_rides: 0, total_spending: 0, avg_cost_per_ride: 0 },
      app_usage: appUsage || [],
      departments: departmentStats || [],
      monthly_trends: monthlyTrends || []
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user rides (Admin only)
router.get('/users/:userId/rides', authenticateToken, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    const rides = await db.query(
      `SELECT r.*, u.name as user_name
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.ride_date DESC`,
      [userId]
    );

    res.json(rides);
  } catch (error) {
    console.error('Error fetching user rides:', error);
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
      'SELECT id, name, email, department FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get monthly spending
    const monthlySpending = await db.query(
      `SELECT 
         DATE_TRUNC('month', ride_date) as month,
         COUNT(*) as rides,
         SUM(cost_usd) as cost
       FROM rides 
       WHERE user_id = $1
       GROUP BY DATE_TRUNC('month', ride_date)
       ORDER BY month DESC`,
      [userId]
    );

    // Get app usage
    const appUsage = await db.query(
      `SELECT 
         app_name,
         COUNT(*) as count,
         SUM(cost_usd) as cost
       FROM rides 
       WHERE user_id = $1
       GROUP BY app_name`,
      [userId]
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

    res.json({
      user,
      monthly_spending: monthlySpending.map(stat => ({
        month: new Date(stat.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        rides: stat.rides,
        cost: stat.cost
      })),
      rides_by_app: ridesByApp
    });
  } catch (error) {
    console.error('Error fetching user monthly spending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import express from 'express';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { getDatabase } from '../database/init';
import { SpendingSummary } from '../types';

const router = express.Router();

// Get all spending data (Admin only)
router.get('/spending', authenticateToken, requireAdmin, (req: AuthRequest, res: express.Response) => {
  const db = getDatabase();
  
  // Get all users with their spending data
  db.all(
    `SELECT 
       u.id,
       u.name,
       u.department,
       COUNT(r.id) as total_rides,
       COALESCE(SUM(r.cost_usd), 0) as total_cost
     FROM users u
     LEFT JOIN rides r ON u.id = r.user_id
     WHERE u.role = 'employee'
     GROUP BY u.id, u.name, u.department
     ORDER BY total_cost DESC`,
    (err, userSpending: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get app breakdown for all users
      db.all(
        `SELECT 
           u.id as user_id,
           u.name,
           r.app_name,
           COUNT(r.id) as count,
           COALESCE(SUM(r.cost_usd), 0) as cost
         FROM users u
         LEFT JOIN rides r ON u.id = r.user_id
         WHERE u.role = 'employee'
         GROUP BY u.id, u.name, r.app_name`,
        (err, appBreakdown: any[]) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get monthly breakdown for all users
          db.all(
            `SELECT 
               u.id as user_id,
               u.name,
               strftime('%Y-%m', r.ride_date) as month,
               COUNT(r.id) as rides,
               COALESCE(SUM(r.cost_usd), 0) as cost
             FROM users u
             LEFT JOIN rides r ON u.id = r.user_id
             WHERE u.role = 'employee'
             GROUP BY u.id, u.name, strftime('%Y-%m', r.ride_date)
             ORDER BY month DESC`,
            (err, monthlyBreakdown: any[]) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              // Process the data
              const spendingData: SpendingSummary[] = userSpending.map(user => {
                const userAppBreakdown = appBreakdown.filter(app => app.user_id === user.id);
                const userMonthlyBreakdown = monthlyBreakdown.filter(month => month.user_id === user.id);

                const ridesByApp = {
                  uber: { count: 0, cost: 0 },
                  lyft: { count: 0, cost: 0 },
                  didi: { count: 0, cost: 0 }
                };

                userAppBreakdown.forEach(app => {
                  if (app.app_name) {
                    ridesByApp[app.app_name as keyof typeof ridesByApp] = {
                      count: app.count,
                      cost: app.cost
                    };
                  }
                });

                return {
                  user_id: user.id,
                  user_name: user.name,
                  department: user.department,
                  total_rides: user.total_rides,
                  total_cost: user.total_cost,
                  rides_by_app: ridesByApp,
                  monthly_breakdown: userMonthlyBreakdown.map(month => ({
                    month: month.month,
                    rides: month.rides,
                    cost: month.cost
                  }))
                };
              });

              res.json(spendingData);
            }
          );
        }
      );
    }
  );
  db.close();
});

// Get department spending summary
router.get('/departments', authenticateToken, requireAdmin, (req: AuthRequest, res: express.Response) => {
  const db = getDatabase();
  
  db.all(
    `SELECT 
       u.department,
       COUNT(DISTINCT u.id) as employee_count,
       COUNT(r.id) as total_rides,
       COALESCE(SUM(r.cost_usd), 0) as total_cost,
       COALESCE(AVG(r.cost_usd), 0) as avg_cost_per_ride
     FROM users u
     LEFT JOIN rides r ON u.id = r.user_id
     WHERE u.role = 'employee' AND u.department IS NOT NULL
     GROUP BY u.department
     ORDER BY total_cost DESC`,
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
  db.close();
});

// Get overall statistics
router.get('/stats', authenticateToken, requireAdmin, (req: AuthRequest, res: express.Response) => {
  const db = getDatabase();
  
  // Get overall stats
  db.get(
    `SELECT 
       COUNT(DISTINCT u.id) as total_employees,
       COUNT(r.id) as total_rides,
       COALESCE(SUM(r.cost_usd), 0) as total_spending,
       COALESCE(AVG(r.cost_usd), 0) as avg_cost_per_ride,
       COALESCE(MAX(r.cost_usd), 0) as max_ride_cost,
       COALESCE(MIN(r.cost_usd), 0) as min_ride_cost
     FROM users u
     LEFT JOIN rides r ON u.id = r.user_id
     WHERE u.role = 'employee'`,
    (err, overallStats: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get app usage stats
      db.all(
        `SELECT 
           r.app_name,
           COUNT(r.id) as ride_count,
           COALESCE(SUM(r.cost_usd), 0) as total_cost,
           COALESCE(AVG(r.cost_usd), 0) as avg_cost
         FROM rides r
         JOIN users u ON r.user_id = u.id
         WHERE u.role = 'employee'
         GROUP BY r.app_name
         ORDER BY total_cost DESC`,
        (err, appStats: any[]) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get monthly trends
          db.all(
            `SELECT 
               strftime('%Y-%m', r.ride_date) as month,
               COUNT(r.id) as rides,
               COALESCE(SUM(r.cost_usd), 0) as cost
             FROM rides r
             JOIN users u ON r.user_id = u.id
             WHERE u.role = 'employee'
             GROUP BY strftime('%Y-%m', r.ride_date)
             ORDER BY month DESC
             LIMIT 12`,
            (err, monthlyTrends: any[]) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                overall: overallStats,
                app_usage: appStats,
                monthly_trends: monthlyTrends
              });
            }
          );
        }
      );
    }
  );
  db.close();
});

// Get user's detailed rides (Admin only)
router.get('/users/:userId/rides', authenticateToken, requireAdmin, (req: AuthRequest, res: express.Response) => {
  const userId = parseInt(req.params.userId);
  const db = getDatabase();
  
  db.all(
    `SELECT r.*, u.name as user_name 
     FROM rides r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.user_id = ? 
     ORDER BY r.ride_date DESC`,
    [userId],
    (err, rows: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
  db.close();
});

// Get detailed monthly spending for a specific user (Admin only)
router.get('/users/:userId/monthly-spending', authenticateToken, requireAdmin, (req: AuthRequest, res: express.Response) => {
  const userId = parseInt(req.params.userId);
  const db = getDatabase();
  
  // Get user info
  db.get(
    `SELECT id, name, department FROM users WHERE id = ?`,
    [userId],
    (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get monthly spending breakdown
      db.all(
        `SELECT 
           strftime('%Y-%m', r.ride_date) as month,
           strftime('%Y', r.ride_date) as year,
           strftime('%m', r.ride_date) as month_num,
           COUNT(r.id) as total_rides,
           COALESCE(SUM(r.cost_usd), 0) as total_cost,
           COALESCE(AVG(r.cost_usd), 0) as avg_cost_per_ride,
           COUNT(CASE WHEN r.app_name = 'uber' THEN 1 END) as uber_rides,
           COALESCE(SUM(CASE WHEN r.app_name = 'uber' THEN r.cost_usd ELSE 0 END), 0) as uber_cost,
           COUNT(CASE WHEN r.app_name = 'lyft' THEN 1 END) as lyft_rides,
           COALESCE(SUM(CASE WHEN r.app_name = 'lyft' THEN r.cost_usd ELSE 0 END), 0) as lyft_cost,
           COUNT(CASE WHEN r.app_name = 'didi' THEN 1 END) as didi_rides,
           COALESCE(SUM(CASE WHEN r.app_name = 'didi' THEN r.cost_usd ELSE 0 END), 0) as didi_cost
         FROM rides r 
         WHERE r.user_id = ? 
         GROUP BY strftime('%Y-%m', r.ride_date)
         ORDER BY month DESC`,
        [userId],
        (err, monthlyData: any[]) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get individual rides for the last 6 months
          db.all(
            `SELECT r.*, 
               strftime('%Y-%m', r.ride_date) as month
             FROM rides r 
             WHERE r.user_id = ? 
               AND r.ride_date >= date('now', '-6 months')
             ORDER BY r.ride_date DESC`,
            [userId],
            (err, recentRides: any[]) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                user: user,
                monthly_breakdown: monthlyData,
                recent_rides: recentRides
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

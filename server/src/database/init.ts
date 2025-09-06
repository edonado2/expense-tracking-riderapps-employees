import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../data/database.sqlite');

export const initializeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    let operationsCompleted = 0;
    const totalOperations = 2; // admin user check + employee user check

    const checkAndClose = () => {
      operationsCompleted++;
      if (operationsCompleted === totalOperations) {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
            return;
          }
          console.log('Database initialization completed');
          resolve();
        });
      }
    };

    // Create tables
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'employee',
          department TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Rides table
      db.run(`
        CREATE TABLE IF NOT EXISTS rides (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          app_name TEXT NOT NULL,
          pickup_location TEXT NOT NULL,
          destination TEXT NOT NULL,
          distance_km REAL,
          duration_minutes INTEGER NOT NULL,
          cost_usd REAL NOT NULL,
          cost_clp INTEGER,
          currency TEXT DEFAULT 'usd',
          ride_date DATETIME NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create default admin user
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, row: any) => {
        if (err) {
          console.error('Error checking admin user:', err);
          reject(err);
          return;
        }

        if (row.count === 0) {
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
            ['admin@company.com', hashedPassword, 'Administrator', 'admin'],
            (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
                reject(err);
                return;
              }
              console.log('Default admin user created: admin@company.com / admin123');
              checkAndClose();
            }
          );
        } else {
          console.log('Admin user already exists');
          checkAndClose();
        }
      });

      // Create sample employee
      db.get('SELECT COUNT(*) as count FROM users WHERE role = "employee"', (err, row: any) => {
        if (err) {
          console.error('Error checking employee user:', err);
          reject(err);
          return;
        }

        if (row.count === 0) {
          const hashedPassword = bcrypt.hashSync('employee123', 10);
          db.run(
            'INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)',
            ['employee@company.com', hashedPassword, 'John Doe', 'employee', 'Engineering'],
            (err) => {
              if (err) {
                console.error('Error creating employee user:', err);
                reject(err);
                return;
              }
              console.log('Sample employee created: employee@company.com / employee123');
              checkAndClose();
            }
          );
        } else {
          console.log('Employee user already exists');
          checkAndClose();
        }
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  return new sqlite3.Database(dbPath);
};
import bcrypt from 'bcryptjs';
import { getDatabase } from './config';

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Starting database initialization...');
    const db = getDatabase();
    console.log('✅ Database connection established');
    
    // Create tables - Use PostgreSQL syntax for Supabase
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        department TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        app_name TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        pickup_lat REAL,
        pickup_lng REAL,
        destination TEXT NOT NULL,
        destination_lat REAL,
        destination_lng REAL,
        distance_km REAL NOT NULL,
        duration_minutes INTEGER NOT NULL,
        cost_usd REAL NOT NULL,
        cost_clp REAL,
        currency TEXT DEFAULT 'USD',
        ride_date TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Check if admin user exists and recreate with correct password hash
    const adminUsers = await db.query('SELECT * FROM users WHERE email = $1', ['admin@company.com']);
    
    if (adminUsers.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.query(
        'INSERT INTO users (email, password, name, role, department) VALUES ($1, $2, $3, $4, $5)',
        ['admin@company.com', hashedPassword, 'Admin User', 'admin', 'IT']
      );
      console.log('Admin user created');
    } else {
      // Update existing admin user with correct password hash
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'admin@company.com']
      );
      console.log('Admin user password updated');
    }

    // Check if employee user exists and recreate with correct password hash
    const employeeUsers = await db.query('SELECT * FROM users WHERE email = $1', ['employee@company.com']);
    
    if (employeeUsers.length === 0) {
      const hashedPassword = bcrypt.hashSync('employee123', 10);
      await db.query(
        'INSERT INTO users (email, password, name, role, department) VALUES ($1, $2, $3, $4, $5)',
        ['employee@company.com', hashedPassword, 'Employee User', 'employee', 'Sales']
      );
      console.log('Employee user created');
    } else {
      // Update existing employee user with correct password hash
      const hashedPassword = bcrypt.hashSync('employee123', 10);
      await db.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'employee@company.com']
      );
      console.log('Employee user password updated');
    }

    console.log('✅ Database initialization completed');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error);
    console.error('Error details:', error.message);
    console.log('⚠️  Continuing without database initialization...');
  }
};

export { getDatabase };

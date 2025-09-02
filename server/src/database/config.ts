import { Pool, PoolClient } from 'pg';
import dns from 'dns';
import sqlite3 from 'sqlite3';

export interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
  close: () => Promise<void>;
}

class SQLiteConnection implements DatabaseConnection {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  query(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

class PostgreSQLConnection implements DatabaseConnection {
  private pool: Pool;

  constructor(connectionString: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    // Prefer IPv4 in production to avoid environments without IPv6 egress
    if (isProduction && (dns as any).setDefaultResultOrder) {
      try {
        (dns as any).setDefaultResultOrder('ipv4first');
      } catch {}
    }
    if (isProduction) {
      try {
        const parsed = new URL(connectionString);
        console.log('[DB] Using PostgreSQL host:', parsed.hostname);
      } catch (e) {
        console.error('[DB] Invalid DATABASE_URL format. Expected URL like postgresql://user:pass@host:5432/db?sslmode=require');
      }
    }
    this.pool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      // Force IPv4 in environments without IPv6 egress (e.g., some Render plans)
      ...(isProduction
        ? ({
            lookup: (hostname: string, options: any, callback: any) =>
              dns.lookup(hostname, { ...(options || {}), family: 4 }, callback)
          } as any)
        : {})
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

let db: DatabaseConnection;

export const getDatabase = (): DatabaseConnection => {
  if (!db) {
    if (process.env.DATABASE_URL) {
      // Production: Use PostgreSQL
      db = new PostgreSQLConnection(process.env.DATABASE_URL);
    } else {
      // Development: Use SQLite
      const path = require('path');
      const dbPath = path.join(__dirname, '../../data/database.sqlite');
      db = new SQLiteConnection(dbPath);
    }
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null as any;
  }
};

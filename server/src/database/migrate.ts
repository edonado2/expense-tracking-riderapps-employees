import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/database.sqlite');

export const migrateDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database for migration');
    });

    let operationsCompleted = 0;
    const totalOperations = 3; // Check and add columns

    const checkAndClose = () => {
      operationsCompleted++;
      if (operationsCompleted === totalOperations) {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
            return;
          }
          console.log('Database migration completed');
          resolve();
        });
      }
    };

    db.serialize(() => {
      // Check if cost_clp column exists
      db.get("PRAGMA table_info(rides)", (err, row: any) => {
        if (err) {
          console.error('Error checking table info:', err);
          reject(err);
          return;
        }
        
        // Get all column names
        db.all("PRAGMA table_info(rides)", (err, columns: any[]) => {
          if (err) {
            console.error('Error getting table info:', err);
            reject(err);
            return;
          }
          
          const columnNames = columns.map(col => col.name);
          
          // Add cost_clp column if it doesn't exist
          if (!columnNames.includes('cost_clp')) {
            db.run('ALTER TABLE rides ADD COLUMN cost_clp INTEGER', (err) => {
              if (err) {
                console.error('Error adding cost_clp column:', err);
                reject(err);
                return;
              }
              console.log('Added cost_clp column');
              checkAndClose();
            });
          } else {
            console.log('cost_clp column already exists');
            checkAndClose();
          }
        });
      });

      // Check if currency column exists
      db.all("PRAGMA table_info(rides)", (err, columns: any[]) => {
        if (err) {
          console.error('Error getting table info:', err);
          reject(err);
          return;
        }
        
        const columnNames = columns.map(col => col.name);
        
        // Add currency column if it doesn't exist
        if (!columnNames.includes('currency')) {
          db.run("ALTER TABLE rides ADD COLUMN currency TEXT DEFAULT 'usd'", (err) => {
            if (err) {
              console.error('Error adding currency column:', err);
              reject(err);
              return;
            }
            console.log('Added currency column');
            checkAndClose();
          });
        } else {
          console.log('currency column already exists');
          checkAndClose();
        }
      });

      // Make distance_km nullable (SQLite doesn't support ALTER COLUMN, so we need to recreate)
      db.all("PRAGMA table_info(rides)", (err, columns: any[]) => {
        if (err) {
          console.error('Error getting table info:', err);
          reject(err);
          return;
        }
        
        const distanceColumn = columns.find(col => col.name === 'distance_km');
        
        // If distance_km is NOT NULL, we need to make it nullable
        if (distanceColumn && distanceColumn.notnull === 1) {
          // Create a backup table
          db.run(`
            CREATE TABLE rides_backup AS 
            SELECT * FROM rides
          `, (err) => {
            if (err) {
              console.error('Error creating backup table:', err);
              reject(err);
              return;
            }
            
            // Drop original table
            db.run('DROP TABLE rides', (err) => {
              if (err) {
                console.error('Error dropping original table:', err);
                reject(err);
                return;
              }
              
              // Create new table with nullable distance_km
              db.run(`
                CREATE TABLE rides (
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
              `, (err) => {
                if (err) {
                  console.error('Error creating new table:', err);
                  reject(err);
                  return;
                }
                
                // Copy data back
                db.run(`
                  INSERT INTO rides 
                  SELECT id, user_id, app_name, pickup_location, destination, 
                         distance_km, duration_minutes, cost_usd, 
                         NULL as cost_clp, 'usd' as currency, 
                         ride_date, notes, created_at
                  FROM rides_backup
                `, (err) => {
                  if (err) {
                    console.error('Error copying data back:', err);
                    reject(err);
                    return;
                  }
                  
                  // Drop backup table
                  db.run('DROP TABLE rides_backup', (err) => {
                    if (err) {
                      console.error('Error dropping backup table:', err);
                      reject(err);
                      return;
                    }
                    console.log('Made distance_km nullable');
                    checkAndClose();
                  });
                });
              });
            });
          });
        } else {
          console.log('distance_km is already nullable');
          checkAndClose();
        }
      });
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  return new sqlite3.Database(dbPath);
};

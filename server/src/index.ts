import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase as initializePostgreSQL } from './database/init-new';
import { initializeDatabase as initializeSQLite } from './database/init';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import rideRoutes from './routes/rides';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://uber-calculator-frontend.onrender.com', // Your Render frontend URL
    'https://your-netlify-site.netlify.app' // Keep for Netlify if needed
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
console.log('🚀 Starting server initialization...');
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🌐 Port:', PORT);

// Choose the correct database initialization based on environment
const initializeDatabase = process.env.DATABASE_URL ? initializePostgreSQL : initializeSQLite;

initializeDatabase().then(() => {
  console.log('✅ Database initialized successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});

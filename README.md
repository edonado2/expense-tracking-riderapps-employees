# Uber Usage Calculator

A professional web application for tracking and managing Uber, Lyft, and Didi ride expenses with an administrator panel for monitoring employee spending.

## Features

### Employee Features
- **Ride Tracking**: Add, edit, and delete ride records
- **Multi-App Support**: Track rides from Uber, Lyft, and Didi
- **Spending Analytics**: View personal spending summaries and trends
- **Dashboard**: Visual charts and statistics for ride usage
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Administrator Features
- **User Management**: Create, edit, and delete employee accounts
- **Spending Monitoring**: Track spending across all employees
- **Department Analytics**: View spending by department
- **Detailed Reports**: Individual employee spending breakdowns
- **Company Overview**: Overall statistics and trends

## Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **SQLite** database for data storage
- **JWT** authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Recharts** for data visualization
- **Axios** for API communication
- **Lucide React** for icons

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uber-usage-calculator
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

   Create a `.env` file in the `client` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## Default Accounts

The application comes with pre-configured demo accounts:

### Administrator
- **Email**: admin@company.com
- **Password**: admin123
- **Access**: Full admin panel, user management, spending reports

### Employee
- **Email**: employee@company.com
- **Password**: employee123
- **Access**: Personal dashboard, ride tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

### Rides
- `GET /api/rides` - Get user's rides
- `POST /api/rides` - Create new ride
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Delete ride
- `GET /api/rides/summary` - Get user's spending summary

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Admin
- `GET /api/admin/spending` - Get all spending data
- `GET /api/admin/departments` - Get department spending
- `GET /api/admin/stats` - Get overall statistics
- `GET /api/admin/users/:userId/rides` - Get user's rides (admin view)

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `name` - Full name
- `role` - 'admin' or 'employee'
- `department` - Department name (optional)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Rides Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `app_name` - 'uber', 'lyft', or 'didi'
- `pickup_location` - Starting location
- `destination` - End location
- `distance_km` - Distance in kilometers
- `duration_minutes` - Duration in minutes
- `cost_usd` - Cost in USD
- `ride_date` - Date of the ride
- `notes` - Additional notes (optional)
- `created_at` - Creation timestamp

## Development

### Project Structure
```
uber-usage-calculator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── database/       # Database initialization
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   └── data/               # SQLite database files
└── package.json            # Root package.json
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install dependencies for all packages

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.

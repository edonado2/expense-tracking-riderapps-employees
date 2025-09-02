# 🚀 **FREE Deployment Guide**

This guide will help you deploy your Uber Calculator app to production using **100% FREE services**:

- **Frontend**: Netlify (Free)
- **Backend**: Render (Free)
- **Database**: Supabase (Free)
- **Total Cost**: $0/month! 🎉

## 📋 Prerequisites

- GitHub account
- Netlify account (free)
- Render account (free)
- Supabase account (free)
- Google Maps API key

## 🗄️ Step 1: Database Setup (Supabase - FREE!)

1. **Go to [Supabase.com](https://supabase.com)**
2. **Sign up/Login** with GitHub
3. **Create New Project** → Choose free tier
4. **Wait for setup** (takes 2-3 minutes)
5. **Go to Settings** → Database
6. **Copy the connection details**:
   - Host (db.xxx.supabase.co)
   - Port (5432)
   - Database (postgres)
   - Username (postgres)
   - Password (from your project settings)

## 🔧 Step 2: Backend Deployment (Render - FREE!)

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Create New Web Service** → Connect your GitHub repo
4. **Configure the service**:
   - **Name**: `uber-calculator-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (TypeScript builds automatically)
   - **Start Command**: `npm start`
5. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=your-super-secret-jwt-key
   ```
6. **Deploy** - Render will automatically build and deploy

## 🌐 Step 3: Frontend Deployment (Netlify)

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **New site from Git** → Connect your repository
4. **Build settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`
5. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com/api
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
6. **Deploy**

## 🔄 Step 4: Database Schema Setup

Since you're moving from SQLite to PostgreSQL, you'll need to set up the database:

1. **Install PostgreSQL driver** (already done):
   ```bash
   cd server
   npm install pg @types/pg
   ```

2. **Database is already configured** in `server/src/database/config.ts`

3. **Tables will be created automatically** when the backend starts

## 🛠️ Step 5: Update CORS Settings

Update your backend CORS settings to allow your Netlify domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-netlify-site.netlify.app'
  ],
  credentials: true
}));
```

**Note**: CORS is already configured in your `server/src/index.ts` file!

## 📝 Step 6: Environment Variables Summary

### Backend (Render)
- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require`
- `JWT_SECRET=your-secret-key`

### Frontend (Netlify)
- `REACT_APP_API_URL=https://your-backend.onrender.com/api`
- `REACT_APP_GOOGLE_MAPS_API_KEY=your-key`

## 🔍 Step 7: Testing

1. **Test backend**: Visit `https://your-backend.onrender.com/api/health`
2. **Test frontend**: Visit your Netlify URL
3. **Test full flow**: Try logging in and adding a ride

## 🚨 Troubleshooting

### Common Issues:

1. **CORS errors**: Update CORS settings in backend
2. **Database connection**: Check DATABASE_URL format
3. **Build failures**: Check build logs in Railway/Netlify
4. **Environment variables**: Ensure all are set correctly

### Useful Commands:

```bash
# Test backend locally with production env
cd server
NODE_ENV=production npm start

# Test frontend build
cd client
npm run build
npm install -g serve
serve -s build
```

## 📊 Monitoring

- **Render**: Monitor backend logs and performance
- **Netlify**: Monitor frontend builds and deployments
- **Supabase**: Monitor PostgreSQL performance and logs

## 🔐 Security Notes

- Use strong JWT secrets
- Enable HTTPS (automatic on Railway/Netlify)
- Set up proper CORS origins
- Consider rate limiting for production

## 💰 Cost Estimation

- **Render**: **FREE** (750 hours/month)
- **Supabase**: **FREE** (500MB database, 2GB bandwidth)
- **Netlify**: **FREE** (100GB bandwidth/month)
- **Total**: **$0/month** for full deployment! 🎉

---

🎉 **Congratulations!** Your app should now be live and accessible to users worldwide!

# Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Git for version control

## Environment Setup

### 1. Environment Variables
Create `.env` files in both client and server directories:

**Server (.env):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leaderboard
CORS_ORIGIN=https://your-frontend-domain.com
```

**Client (.env):**
```env
VITE_API_URL=https://your-api-domain.com/api
```

## Deployment Options

### Option 1: Traditional VPS/Server

#### Backend Deployment
```bash
# 1. Clone repository
git clone <your-repo-url>
cd leaderboard-app

# 2. Install dependencies
cd server && npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env with production values

# 4. Start with PM2 (recommended)
npm install -g pm2
pm2 start src/server.js --name "leaderboard-api"
pm2 startup
pm2 save
```

#### Frontend Deployment
```bash
# 1. Build the client
cd client
npm install
npm run build

# 2. Serve with nginx or serve static files
# Copy dist/ folder to your web server
```

### Option 2: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individually
docker build -t leaderboard-server ./server
docker build -t leaderboard-client ./client
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Server deployment
heroku create your-app-name-api
heroku config:set MONGODB_URI=your-mongodb-uri
git subtree push --prefix server heroku main

# Client deployment (separate app)
heroku create your-app-name-client
heroku config:set VITE_API_URL=https://your-app-name-api.herokuapp.com/api
git subtree push --prefix client heroku main
```

#### Vercel (Frontend)
```bash
cd client
vercel --prod
```

#### Railway/Render (Backend)
- Connect your GitHub repository
- Set environment variables in dashboard
- Deploy from `server/` directory

## Production Checklist

### Security
- [ ] Set strong MongoDB credentials
- [ ] Configure CORS for specific domains
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Set secure headers with Helmet.js
- [ ] Validate all inputs
- [ ] Hide error stack traces in production

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure database indexes
- [ ] Implement caching (Redis)
- [ ] Monitor application performance

### Monitoring
- [ ] Set up logging (Winston)
- [ ] Configure error tracking (Sentry)
- [ ] Monitor uptime
- [ ] Set up database backups
- [ ] Configure alerts

## Nginx Configuration

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/leaderboard-client/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Migration

For production database setup:

```bash
# Run seed script once
cd server
npm run seed
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGIN environment variable
2. **Database connection**: Verify MongoDB URI and network access
3. **Build failures**: Check Node.js version compatibility
4. **Port conflicts**: Ensure ports 3000/5000 are available

### Logs
```bash
# PM2 logs
pm2 logs leaderboard-api

# Docker logs
docker-compose logs -f

# Application logs
tail -f server/logs/app.log
```
# Guinea Land Hub - Deployment Guide

## Current Deployment ✅
Your app is already deployed at: **https://guinea-land-hub.emergent.host**

---

## Alternative: Deploy on Render.com (Free Tier)

### Prerequisites
1. GitHub account with your code pushed
2. Render.com account (free signup)
3. MongoDB Atlas account (free tier available)

### Step 1: Prepare Your Code for Render

#### Backend (render.yaml)
Create `/render.yaml` in your project root:

```yaml
services:
  # Backend API
  - type: web
    name: guinea-land-api
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGO_URL
        sync: false # You'll add this manually
      - key: DB_NAME
        value: guinea_land_db
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGINS
        value: https://guinea-land-frontend.onrender.com
      - key: EMERGENT_LLM_KEY
        sync: false # Add your key manually
    healthCheckPath: /api/health

  # Frontend (Static Site)
  - type: web
    name: guinea-land-frontend
    env: static
    buildCommand: cd frontend && yarn install && yarn build
    staticPublishPath: frontend/build
    envVars:
      - key: REACT_APP_BACKEND_URL
        value: https://guinea-land-api.onrender.com
```

### Step 2: Setup MongoDB Atlas (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Create a database user (save credentials)
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/guinea_land_db
   ```

### Step 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create both services
5. Add environment variables:
   - `MONGO_URL`: Your MongoDB Atlas connection string
   - `EMERGENT_LLM_KEY`: Your AI key (optional, for AI assistant)
   - `MAPBOX_TOKEN`: Your Mapbox token
   - `RESEND_API_KEY`: For email notifications (optional)

### Step 4: Post-Deployment

1. Update CORS in backend to allow your frontend URL
2. Update `REACT_APP_BACKEND_URL` in frontend to your API URL
3. Redeploy both services

### Free Tier Limitations
- Backend: Spins down after 15 mins of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free

---

## Custom Domain Setup (leydi.com)

### On Render:
1. Go to your service → **Settings** → **Custom Domains**
2. Add `leydi.com` and `www.leydi.com`
3. Copy the provided CNAME records

### On Your Domain Registrar (Namecheap/GoDaddy):
1. Go to DNS settings
2. Add CNAME record:
   - Host: `@` or `www`
   - Value: `<your-service>.onrender.com`
3. Wait for DNS propagation (up to 48h)

### SSL Certificate
Render provides free SSL automatically after DNS is configured.

---

## Quick Commands

### Test locally before deploy:
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend (new terminal)
cd frontend
yarn install
yarn start
```

### Build for production:
```bash
cd frontend
REACT_APP_BACKEND_URL=https://your-api.onrender.com yarn build
```

---

## Environment Variables Summary

### Backend (.env)
```env
MONGO_URL=mongodb+srv://...
DB_NAME=guinea_land_db
JWT_SECRET=<generated-secret>
CORS_ORIGINS=https://your-frontend.onrender.com
EMERGENT_LLM_KEY=<your-key>
MAPBOX_TOKEN=<your-token>
RESEND_API_KEY=<optional>
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-api.onrender.com
REACT_APP_MAPBOX_TOKEN=<your-token>
```

---

## Troubleshooting

**Backend won't start:**
- Check Render logs for missing packages
- Verify `requirements.txt` has all dependencies

**Frontend shows blank page:**
- Check browser console for errors
- Verify `REACT_APP_BACKEND_URL` is correct

**Database connection fails:**
- Whitelist `0.0.0.0/0` in MongoDB Atlas
- Check connection string format

**AI Assistant not working:**
- Verify `EMERGENT_LLM_KEY` is set
- Check backend logs for errors

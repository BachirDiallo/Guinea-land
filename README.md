# Guinea Land Hub

**Plateforme de Transactions Foncières en Guinée** | Land Transaction Platform for Guinea

A comprehensive web application for managing land transactions in Guinea, featuring interactive maps, transaction tracking, document management, market analytics, and offline support.

![Guinea Land Hub](https://guinea-land-hub.preview.emergentagent.com)

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Test Accounts](#test-accounts)
- [Troubleshooting](#troubleshooting)

---

## Features

### 🗺️ Land Discovery
| Feature | Description |
|---------|-------------|
| **Interactive Map** | Mapbox-powered map with land markers, boundary drawing, geolocation |
| **Advanced Search** | Filter by region, commune, type, price range, size |
| **Land Listings** | Grid/list view with photos, prices, verification badges |
| **Saved Searches** | Save search criteria with notification toggles |

### ⚖️ Land Comparison
| Feature | Description |
|---------|-------------|
| **Multi-Land Compare** | Compare up to 4 lands side-by-side |
| **3 View Modes** | Cards view, Table view, Map view |
| **Smart Badges** | 🏆 Lowest price, 🥈 Best price/m², 👑 Largest |
| **Recommendation** | AI-style best value suggestion |
| **Visual Charts** | Relative price/m² bar comparison |
| **Share & QR** | Share comparison link, QR codes per land |

### 📊 Market Analytics
| Feature | Description |
|---------|-------------|
| **Regional Map** | Interactive Guinea map with regional statistics |
| **Zone Selection** | Click region to see detailed stats (lands, transactions, avg price) |
| **Commune Breakdown** | Drill down to commune-level data |
| **Price Evolution** | Historical price trends with bar charts |
| **Top Sellers** | Leaderboard by sales count and volume |
| **Verified Officials** | Directory of verified users with contact info |

### 🔔 Alerts & Notifications
| Feature | Description |
|---------|-------------|
| **Zone Alerts** | Subscribe to regions/communes for new listing notifications |
| **Email Notifications** | Transaction confirmations, zone alerts via Resend |
| **SMS Ready** | Twilio infrastructure for SMS (requires configuration) |
| **In-App Notifications** | Bell icon with notification center |

### 📱 Communication & Sharing
| Feature | Description |
|---------|-------------|
| **WhatsApp Integration** | Contact owners, share listings (+224 Guinea code) |
| **QR Codes** | Generate/download/print QR codes for land listings |
| **PDF Receipts** | Downloadable transaction receipts |

### ✅ Trust & Verification
| Feature | Description |
|---------|-------------|
| **Multi-Level Verification** | Chef de Quartier → Gouverneur hierarchy |
| **Verification Badges** | Visual indicators of verification level |
| **Ratings & Reviews** | 5-star ratings for buyers/sellers |
| **Dual Pricing** | Reference prices vs market prices |

### 🌍 Localization & Offline
| Feature | Description |
|---------|-------------|
| **Multilingual** | French (primary), English, Pular, Maninka, Soussou |
| **PWA Support** | Installable app, offline fallback |
| **Map Caching** | 500 tiles cached for offline viewing |

### 🧭 Navigation
| Feature | Description |
|---------|-------------|
| **Mega Menu** | Organized access to all features |
| **Mobile Menu** | Sheet-style menu for mobile devices |
| **Quick Actions** | Add land, scan QR from any page |

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.104+ | Web framework |
| MongoDB | 6+ | Database |
| Motor | 3.3+ | Async MongoDB driver |
| PyJWT | 2.8+ | JWT authentication |
| bcrypt | 4.1+ | Password hashing |
| ReportLab | 4.0+ | PDF generation |
| Resend | 0.7+ | Email notifications |
| qrcode | 7.4+ | QR code generation |
| Pillow | 10.0+ | Image processing |
| Twilio | 8.10+ | SMS (optional) |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | UI framework |
| React Router | 6+ | Client-side routing |
| Tailwind CSS | 3.3+ | Styling |
| Shadcn/UI | Latest | Component library |
| react-map-gl | 7.1+ | Mapbox integration |
| i18next | 23+ | Internationalization |
| Phosphor Icons | 2.0+ | Icon library |
| Sonner | 1.0+ | Toast notifications |

---

## Prerequisites

Before installation, ensure you have:

1. **Python 3.11+**
   ```bash
   python3 --version  # Should be 3.11+
   ```

2. **Node.js 18+ & Yarn**
   ```bash
   node --version  # Should be 18+
   npm install -g yarn
   ```

3. **MongoDB 6+**
   ```bash
   mongod --version  # Should be 6+
   # Or use MongoDB Atlas cloud
   ```

4. **API Keys** (see [Configuration](#configuration))
   - Mapbox token (required for maps)
   - Resend API key (optional, for emails)
   - Twilio credentials (optional, for SMS)

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/BachirDiallo/Guinea-land.git
cd Guinea-land
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your values (see Configuration section)
nano .env  # or use your preferred editor
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
yarn install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

### 4. Start MongoDB
```bash
# If installed locally
sudo systemctl start mongod

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

---

## Configuration

### Backend Environment Variables (`backend/.env`)

```env
# MongoDB Connection (Required)
MONGO_URL=mongodb://localhost:27017
DB_NAME=guinea_land_hub

# CORS Origins (adjust for production)
CORS_ORIGINS=*

# Mapbox Token (Required for map features)
# Get from: https://mapbox.com → Account → Tokens
MAPBOX_TOKEN=pk.your_mapbox_token_here

# Resend Email (Optional - for email notifications)
# Get from: https://resend.com → Dashboard → API Keys
RESEND_API_KEY=re_your_resend_key_here
SENDER_EMAIL=notifications@yourdomain.com

# Emergent Object Storage (Optional - for file uploads on Emergent)
EMERGENT_LLM_KEY=sk-emergent-your_key_here

# Twilio SMS (Optional - for SMS notifications)
# Get from: https://twilio.com → Console
TWILIO_ACCOUNT_SID=ACyour_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for QR codes and email links)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables (`frontend/.env`)

```env
# Backend API URL (Required)
REACT_APP_BACKEND_URL=http://localhost:8001

# Mapbox Token (Required - same as backend)
REACT_APP_MAPBOX_TOKEN=pk.your_mapbox_token_here

# WebSocket Port (for development)
WDS_SOCKET_PORT=443

# Health Check (set false for development)
ENABLE_HEALTH_CHECK=false
```

### Getting API Keys

| Service | Steps |
|---------|-------|
| **Mapbox** | 1. Create account at [mapbox.com](https://mapbox.com)<br>2. Go to Account → Tokens<br>3. Copy your default public token |
| **Resend** | 1. Sign up at [resend.com](https://resend.com)<br>2. Verify your domain or use sandbox<br>3. Get API key from dashboard |
| **Twilio** | 1. Sign up at [twilio.com](https://twilio.com)<br>2. Get Account SID and Auth Token from Console<br>3. Buy a phone number for sending SMS |

---

## Running Locally

### Option 1: Development Mode (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

Access at: http://localhost:3000

### Option 2: Using Docker Compose

```bash
# Create docker-compose.yml (see below)
docker-compose up -d
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=guinea_land_hub
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    env_file:
      - ./frontend/.env
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongo_data:
```

**backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

---

## Deployment

### Option 1: Emergent Platform (Easiest)
1. Push to GitHub
2. Use Emergent's "Deploy" feature
3. Environment variables are auto-configured

### Option 2: VPS (Ubuntu 22.04)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y python3.11 python3.11-venv nodejs npm nginx supervisor
sudo npm install -g yarn

# 2. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Clone and setup
git clone https://github.com/BachirDiallo/Guinea-land.git /var/www/guinea-land
cd /var/www/guinea-land

# Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with production values

# Frontend
cd ../frontend
yarn install
cp .env.example .env
# Edit .env with production values
yarn build

# 4. Configure Supervisor
sudo nano /etc/supervisor/conf.d/guinea-land.conf
```

**Supervisor config:**
```ini
[program:guinea-backend]
directory=/var/www/guinea-land/backend
command=/var/www/guinea-land/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/guinea-land/backend.err.log
stdout_logfile=/var/log/guinea-land/backend.out.log
environment=PATH="/var/www/guinea-land/backend/venv/bin"
```

```bash
# 5. Configure Nginx
sudo nano /etc/nginx/sites-available/guinea-land
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/guinea-land/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 6. Enable and start
sudo ln -s /etc/nginx/sites-available/guinea-land /etc/nginx/sites-enabled/
sudo mkdir -p /var/log/guinea-land
sudo chown www-data:www-data /var/log/guinea-land
sudo supervisorctl reread
sudo supervisorctl update
sudo nginx -t
sudo systemctl restart nginx

# 7. SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Cloud Platforms

**Vercel (Frontend only):**
```bash
cd frontend
npx vercel --prod
```

**Railway / Render:**
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

---

## API Documentation

### Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login (sets cookie) |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/auth/logout` | POST | Yes | Logout |
| `/api/auth/google` | GET | No | Google OAuth |

### Lands
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/lands` | GET | No | List lands (with filters) |
| `/api/lands` | POST | Yes | Create land |
| `/api/lands/{id}` | GET | No | Get land details |
| `/api/lands/{id}` | PUT | Yes | Update land |
| `/api/lands/{id}` | DELETE | Yes | Delete land |
| `/api/lands/{id}/qrcode` | GET | No | Get QR code (PNG) |
| `/api/lands/{id}/qrcode/download` | GET | No | Printable QR |

### Comparison
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/compare` | POST | No | Compare multiple lands |
| `/api/prices/compare/{id}` | GET | No | Price comparison for land |
| `/api/prices/nearby/{id}` | GET | No | Nearby transactions |

### Market Analytics
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/market/trends` | GET | No | Price trends over time |
| `/api/market/regional-stats` | GET | No | All regions summary |
| `/api/market/commune-stats/{region}` | GET | No | Communes in region |
| `/api/market/top-sellers` | GET | No | Top sellers leaderboard |
| `/api/market/officials` | GET | No | Verified officials |

### Zone Alerts
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/zone-alerts` | POST | Yes | Create subscription |
| `/api/zone-alerts` | GET | Yes | List user's alerts |
| `/api/zone-alerts/{id}` | PUT | Yes | Update alert |
| `/api/zone-alerts/{id}` | DELETE | Yes | Delete alert |

### Transactions
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/transactions` | GET | Yes | List transactions |
| `/api/transactions` | POST | Yes | Create transaction |
| `/api/transactions/{id}/pdf` | GET | Yes | Download receipt |

### Other
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/regions` | GET | No | Guinea regions |
| `/api/feedback` | POST | Yes | Submit feedback |
| `/api/notifications` | GET | Yes | User notifications |
| `/api/sms/status` | GET | No | SMS config status |

---

## Database Schema

### Collections

**users**
```json
{
  "user_id": "string",
  "email": "string",
  "password_hash": "string",
  "name": "string",
  "phone": "string",
  "role": "buyer|seller|agent|admin",
  "verified": "boolean",
  "verified_by": "string",
  "verification_level": "string",
  "picture": "string",
  "created_at": "datetime"
}
```

**lands**
```json
{
  "land_id": "string",
  "owner_id": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "size": "number",
  "region": "string",
  "commune": "string",
  "quartier": "string",
  "address": "string",
  "latitude": "number",
  "longitude": "number",
  "boundaries": "GeoJSON",
  "photos": ["string"],
  "documents": ["string"],
  "land_type": "residential|commercial|agricultural",
  "status": "available|pending|sold",
  "verified": "boolean",
  "verifications": ["object"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**transactions**
```json
{
  "transaction_id": "string",
  "land_id": "string",
  "buyer_id": "string",
  "seller_id": "string",
  "price": "number",
  "status": "pending|completed|cancelled",
  "documents": ["string"],
  "notes": "string",
  "created_at": "datetime",
  "completed_at": "datetime"
}
```

**zone_alerts**
```json
{
  "alert_id": "string",
  "user_id": "string",
  "region": "string",
  "commune": "string",
  "quartier": "string",
  "land_types": ["string"],
  "max_price": "number",
  "min_size": "number",
  "notify_email": "boolean",
  "notify_sms": "boolean",
  "is_active": "boolean",
  "created_at": "datetime",
  "last_triggered": "datetime"
}
```

---

## Project Structure

```
Guinea-land/
├── backend/
│   ├── server.py              # Main FastAPI application (3000+ lines)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (git-ignored)
│   ├── .env.example           # Environment template
│   └── tests/                 # Pytest tests
│
├── frontend/
│   ├── public/
│   │   ├── sw.js              # Service worker
│   │   ├── manifest.json      # PWA manifest
│   │   └── offline.html       # Offline fallback
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── Navbar.js      # Main navigation with mega menu
│   │   │   ├── LandMap.js     # Mapbox component
│   │   │   ├── MarketPrices.js # Price comparison
│   │   │   ├── QRCode.js      # QR code generator
│   │   │   ├── ZoneAlerts.js  # Alert subscription
│   │   │   ├── WhatsApp.js    # WhatsApp integration
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.js     # Home page
│   │   │   ├── MapView.js     # Map search
│   │   │   ├── Listings.js    # Land listings
│   │   │   ├── LandDetail.js  # Single land view
│   │   │   ├── LandComparison.js # Compare lands
│   │   │   ├── MarketTrends.js # Market analytics
│   │   │   ├── ZoneAlerts.js  # Alert management
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication state
│   │   │
│   │   ├── locales/           # i18n translations
│   │   │   ├── fr.json
│   │   │   ├── en.json
│   │   │   └── ...
│   │   │
│   │   ├── App.js             # Routes & layout
│   │   ├── i18n.js            # i18next config
│   │   └── index.js           # Entry point
│   │
│   ├── package.json
│   ├── .env                   # Environment (git-ignored)
│   └── .env.example           # Environment template
│
├── memory/
│   └── PRD.md                 # Product requirements
│
├── README.md                  # This file
├── CHANGELOG.md               # Version history
├── TEST_SCENARIOS.md          # Test cases
├── SECRETS.md                 # Secret management (git-ignored)
└── .gitignore
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@guinealand.com | admin123 |
| Buyer | buyer2@test.com | test123 |
| Seller | seller@test.com | test123 |
| Agent | agent@test.com | test123 |

---

## Guinea Regions

| Code | Region | Capital |
|------|--------|---------|
| CKY | Conakry | Conakry |
| BOK | Boké | Boké |
| KND | Kindia | Kindia |
| LAB | Labé | Labé |
| MAM | Mamou | Mamou |
| FAR | Faranah | Faranah |
| KAN | Kankan | Kankan |
| NZR | N'Zérékoré | N'Zérékoré |

---

## Troubleshooting

### Backend Issues

**Backend won't start:**
```bash
# Check logs
tail -f /var/log/guinea-land/backend.err.log

# Common fixes:
# 1. MongoDB not running
sudo systemctl start mongod

# 2. Missing dependencies
pip install -r requirements.txt

# 3. Port already in use
lsof -i :8001
kill -9 <PID>
```

**API returns 500 error:**
```bash
# Check if MongoDB is connected
mongosh --eval "db.adminCommand('ping')"

# Check environment variables
cat backend/.env | grep MONGO_URL
```

### Frontend Issues

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
yarn build
```

**Map not showing:**
- Verify `REACT_APP_MAPBOX_TOKEN` is set correctly
- Check browser console for Mapbox errors
- Ensure token has correct permissions (public)

**Offline mode showing incorrectly:**
```bash
# Clear service worker in browser:
# DevTools → Application → Service Workers → Unregister
# DevTools → Application → Storage → Clear site data
```

### Database Issues

**Reset database:**
```bash
mongosh guinea_land_hub --eval "db.dropDatabase()"
```

**Create indexes:**
```bash
mongosh guinea_land_hub --eval "
  db.lands.createIndex({region: 1, status: 1});
  db.lands.createIndex({location: '2dsphere'});
  db.transactions.createIndex({land_id: 1, status: 1});
  db.zone_alerts.createIndex({user_id: 1, is_active: 1});
"
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

Proprietary - All rights reserved

---

## Support

- **WhatsApp**: +224 XXX XXX XXX
- **Email**: support@guinealandhub.com
- **GitHub Issues**: [Create Issue](https://github.com/BachirDiallo/Guinea-land/issues)

---

*Built with ❤️ for Guinea | Powered by Emergent AI Platform*

# Guinea Land Hub

**Plateforme de Transactions Foncières en Guinée** | Land Transaction Platform for Guinea

A comprehensive web application for managing land transactions in Guinea, featuring interactive maps, transaction tracking, document management, and offline support for low-connectivity environments.

![Guinea Land Hub](https://guinea-land-hub.preview.emergentagent.com)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Test Credentials](#test-credentials)
- [Contributing](#contributing)

---

## Overview

Guinea Land Hub addresses the challenge of land information accessibility in Guinea by providing:
- **Transparent land listings** with photos, documents, and verified boundaries
- **Interactive maps** showing available properties across Guinea's regions
- **Transaction tracking** with PDF receipts and email notifications
- **Offline support** via PWA for areas with limited connectivity
- **WhatsApp integration** for the Guinea market (country code +224)
- **Administrative verification** by local authorities (Chef de quartier, Maire, etc.)
- **Zone Alerts** for automatic notifications when new lands match your criteria
- **QR Codes** for easy sharing and physical signage

---

## Features

### ✅ Core Features
| Feature | Description |
|---------|-------------|
| **User Authentication** | JWT + Google OAuth, role-based access control |
| **Land Management** | Full CRUD with photos, documents, boundaries |
| **Interactive Map** | Mapbox with boundary drawing, geolocation |
| **Transaction Recording** | Buyer/seller tracking, PDF receipts, email notifications |
| **Admin Dashboard** | Verification workflow, platform statistics |

### ✅ Communication & Sharing
| Feature | Description |
|---------|-------------|
| **WhatsApp Integration** | Contact owners, share listings (+224 Guinea code) |
| **QR Codes** | Generate QR codes for listings, printable with land info |
| **Email Notifications** | Transaction confirmations via Resend |
| **Zone Alerts** | Subscribe to regions, get notified of new listings |

### ✅ Mobile & Offline
| Feature | Description |
|---------|-------------|
| **PWA Support** | Installable app, offline fallback |
| **Map Tile Caching** | 500 tiles cached for offline viewing |
| **Mobile Optimization** | Touch-friendly, responsive design |

### ✅ Trust & Verification
| Feature | Description |
|---------|-------------|
| **Multi-level Verification** | From Chef de Quartier to Gouverneur |
| **Ratings & Reviews** | 5-star ratings for buyers/sellers |
| **Dual Pricing** | Reference prices vs market prices by neighborhood |
| **Market Trends** | Price evolution dashboard |

### ✅ Search & Discovery
| Feature | Description |
|---------|-------------|
| **Advanced Search** | Filter by region, type, price, size |
| **Saved Searches** | Save filters with notification toggle |
| **Land Comparison** | Compare up to 3 lands side-by-side |

### ✅ Localization
| Feature | Description |
|---------|-------------|
| **Bilingual** | French (primary) + English |
| **Local Languages** | Pular, Maninka, Soussou structure ready |

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Python web framework (async) |
| MongoDB | Database (via Motor async driver) |
| PyJWT | JWT authentication |
| bcrypt | Password hashing |
| ReportLab | PDF generation |
| Resend | Email notifications |
| qrcode + Pillow | QR code generation |
| Twilio | SMS notifications (infrastructure ready) |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS | Styling |
| Shadcn/UI | Component library |
| react-map-gl | Mapbox integration |
| i18next | Internationalization |
| Phosphor Icons | Icon library |

---

## Architecture

```
/app
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (see .env.example)
│   └── tests/             # Pytest test files
│
├── frontend/
│   ├── public/
│   │   ├── sw.js          # Service worker
│   │   ├── manifest.json  # PWA manifest
│   │   └── offline.html   # Offline fallback
│   │
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Shadcn components
│   │   │   ├── LandMap.js
│   │   │   ├── WhatsApp.js
│   │   │   ├── QRCode.js
│   │   │   ├── ZoneAlerts.js
│   │   │   └── ...
│   │   │
│   │   ├── pages/         # Route pages
│   │   │   ├── Landing.js
│   │   │   ├── MapView.js
│   │   │   ├── LandDetail.js
│   │   │   ├── ZoneAlerts.js
│   │   │   ├── MarketTrends.js
│   │   │   └── ...
│   │   │
│   │   ├── context/       # React context
│   │   ├── locales/       # Translation files (fr, en)
│   │   └── i18n.js        # i18next config
│   │
│   ├── package.json
│   └── .env               # Frontend env vars
│
├── memory/
│   └── PRD.md             # Product Requirements
│
└── test_reports/          # Testing reports
```

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+
- Yarn package manager

### Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/BachirDiallo/Guinea-land.git
cd Guinea-land

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values (see Configuration section)

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend setup (new terminal)
cd ../frontend
yarn install
cp .env.example .env
# Edit .env with your values

# Start frontend
yarn start
```

### Using Docker (Optional)

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongo_data:
```

---

## Configuration

### Backend Environment Variables

Create `/backend/.env` from `.env.example`:

```env
# Required
MONGO_URL=mongodb://localhost:27017
DB_NAME=guinea_land_hub
CORS_ORIGINS=*

# Emergent Object Storage (for file uploads)
EMERGENT_LLM_KEY=sk-emergent-xxxxxxxx

# Email Notifications (Resend)
RESEND_API_KEY=re_xxxxxxxx
SENDER_EMAIL=notifications@yourdomain.com

# Mapbox (for full map features)
MAPBOX_TOKEN=pk.xxxxxxxx

# SMS Notifications (Twilio) - Optional
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Frontend URL (for QR codes, emails)
FRONTEND_URL=https://your-domain.com
```

### Frontend Environment Variables

Create `/frontend/.env` from `.env.example`:

```env
# Required
REACT_APP_BACKEND_URL=http://localhost:8001

# Mapbox Token
REACT_APP_MAPBOX_TOKEN=pk.xxxxxxxx

# Optional
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### Getting API Keys

| Service | How to Get |
|---------|------------|
| **Mapbox** | Create account at [mapbox.com](https://mapbox.com), get public token from Account > Tokens |
| **Resend** | Sign up at [resend.com](https://resend.com), get API key from dashboard |
| **Twilio** | Sign up at [twilio.com](https://twilio.com), get SID/Token from Console, buy phone number |
| **Emergent** | Platform-provided key for object storage |

---

## Deployment

### Option 1: Emergent Platform (Recommended)

The app is pre-configured for Emergent deployment:
1. Push to GitHub
2. Use Emergent's "Deploy" feature
3. Environment variables are automatically configured

### Option 2: Traditional VPS (Ubuntu/Debian)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y python3.11 python3.11-venv nodejs npm mongodb-org nginx supervisor

# 2. Clone and setup
git clone https://github.com/BachirDiallo/Guinea-land.git /app
cd /app

# 3. Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with production values

# 4. Frontend
cd ../frontend
npm install -g yarn
yarn install
yarn build
cp .env.example .env
# Edit .env with production values

# 5. Configure Nginx
sudo nano /etc/nginx/sites-available/guinea-land
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React build)
    location / {
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 6. Enable site
sudo ln -s /etc/nginx/sites-available/guinea-land /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. Configure Supervisor
sudo nano /etc/supervisor/conf.d/guinea-land.conf
```

**Supervisor Configuration:**
```ini
[program:guinea-backend]
directory=/app/backend
command=/app/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
```

```bash
# 8. Start services
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start guinea-backend

# 9. SSL Certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 4: Cloud Platforms

**Vercel (Frontend only):**
```bash
cd frontend
vercel deploy --prod
```

**Railway/Render (Full stack):**
- Connect GitHub repo
- Set environment variables in dashboard
- Deploy automatically on push

---

## API Documentation

### Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register user |
| `/api/auth/login` | POST | No | Login (returns cookie) |
| `/api/auth/me` | GET | Yes | Current user |
| `/api/auth/logout` | POST | Yes | Logout |

### Lands
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/lands` | GET | No | List lands (with filters) |
| `/api/lands` | POST | Yes | Create land |
| `/api/lands/{id}` | GET | No | Get land details |
| `/api/lands/{id}` | PUT | Yes | Update land |
| `/api/lands/{id}/qrcode` | GET | No | Get QR code PNG |
| `/api/lands/{id}/qrcode/download` | GET | No | Printable QR with info |
| `/api/lands/compare` | POST | No | Compare lands |

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
| `/api/transactions/{id}/pdf` | GET | Yes | Download PDF |

### Market Data
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/market-prices/neighborhoods` | GET | No | Neighborhood prices |
| `/api/market-trends/summary` | GET | No | Market trends |
| `/api/regions` | GET | No | Guinea regions |

### Notifications
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/notifications` | GET | Yes | User notifications |
| `/api/sms/status` | GET | No | SMS config status |

---

## Database Schema

### Core Collections
- **users** - User accounts with roles
- **lands** - Land listings with location/media
- **transactions** - Transaction records
- **zone_alerts** - User zone subscriptions
- **neighborhood_prices** - Reference prices by area
- **feedback** - User feedback/suggestions
- **notifications** - In-app notifications
- **reviews** - Ratings and reviews

See `/memory/PRD.md` for detailed schema definitions.

---

## Test Credentials

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
| CKY | Conakry | Conakry (Capital) |
| BOK | Boké | Boké |
| KND | Kindia | Kindia |
| LAB | Labé | Labé |
| MAM | Mamou | Mamou |
| FAR | Faranah | Faranah |
| KAN | Kankan | Kankan |
| NZR | Nzérékoré | Nzérékoré |

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Common issues:
# - MongoDB not running: sudo systemctl start mongod
# - Missing env vars: check .env file
# - Port in use: change port or kill process
```

### Frontend build fails
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
yarn build
```

### Map not showing
- Verify `REACT_APP_MAPBOX_TOKEN` is set
- Check browser console for Mapbox errors
- Ensure token has correct permissions

### Emails not sending
- Verify `RESEND_API_KEY` is valid
- Check sender email is verified in Resend
- Test mode only sends to verified emails

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Backend: PEP 8, type hints
- Frontend: ESLint, functional components
- Commits: Conventional commits

---

## License

Proprietary - All rights reserved

---

## Support

- **WhatsApp**: +224 XXX XXX XXX
- **Email**: support@guinealandhub.com

---

*Built with ❤️ for Guinea | Powered by Emergent AI Platform*

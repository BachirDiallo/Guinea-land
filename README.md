# Guinea Land Hub

**Plateforme de Transactions Foncières en Guinée** | Land Transaction Platform for Guinea

A comprehensive web application for managing land transactions in Guinea, featuring interactive maps, transaction tracking, document management, and offline support for low-connectivity environments.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [User Roles](#user-roles)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
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

---

## User Roles

### Standard Users
| Role | Description | Capabilities |
|------|-------------|--------------|
| **Acheteur (Buyer)** | Looking to purchase land | Browse listings, contact sellers, record purchases, leave reviews |
| **Vendeur (Seller)** | Property owners | List properties, upload documents, manage listings, receive reviews |
| **Agent** | Real estate professionals | Manage multiple listings, facilitate transactions, verify on behalf of clients |
| **Admin** | Platform administrators | Full access, verify listings, manage users, view analytics |

### Administrative/Government Users
These roles represent local Guinean authorities who can verify land authenticity:

| Role | French Title | Description | Verification Level |
|------|--------------|-------------|-------------------|
| **chef_quartier** | Chef de Quartier | Neighborhood chief | Can verify lands in their quartier |
| **chef_secteur** | Chef de Secteur | Sector chief | Can verify lands in their secteur |
| **chef_village** | Chef de Village | Village chief | Can verify lands in their village |
| **maire** | Maire | Mayor | Can verify lands in their commune |
| **prefet** | Préfet | Prefect | Can verify lands in their prefecture |
| **gouverneur** | Gouverneur | Governor | Can verify lands in their region |

Administrative users can:
- Verify land ownership authenticity
- Confirm boundary accuracy
- Provide official verification badges
- Access verification history

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Python web framework (async) |
| **MongoDB** | Database (via Motor async driver) |
| **PyJWT** | JWT authentication |
| **bcrypt** | Password hashing |
| **ReportLab** | PDF generation |
| **Resend** | Email notifications |
| **Emergent Object Storage** | File uploads (photos, documents) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Styling |
| **Shadcn/UI** | Component library |
| **react-map-gl** | Mapbox integration |
| **i18next** | Internationalization (FR/EN) |
| **Phosphor Icons** | Icon library |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **PWA** | Offline support, installable app |
| **Service Worker** | Caching, offline map tiles |
| **Supervisor** | Process management |

---

## Architecture

```
/app
├── backend/
│   ├── server.py           # Main FastAPI application (~1500 lines)
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── public/
│   │   ├── sw.js          # Service worker (offline/caching)
│   │   ├── manifest.json  # PWA manifest
│   │   ├── offline.html   # Offline fallback page
│   │   └── icons/         # PWA icons
│   │
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Shadcn components (button, input, dialog, etc.)
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── LandMap.js      # Mapbox map component
│   │   │   ├── LandCard.js     # Land listing card
│   │   │   ├── WhatsApp.js     # WhatsApp integration components
│   │   │   ├── PWAStatus.js    # Offline indicator & install prompt
│   │   │   ├── AuthCallback.js # Google OAuth handler
│   │   │   └── ProtectedRoute.js
│   │   │
│   │   ├── pages/         # Route pages
│   │   │   ├── Landing.js      # Homepage
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration page
│   │   │   ├── MapView.js      # Interactive map with filters
│   │   │   ├── Listings.js     # Land listings grid
│   │   │   ├── LandDetail.js   # Single land view
│   │   │   ├── Dashboard.js    # User dashboard
│   │   │   ├── AddLand.js      # Create/edit land
│   │   │   ├── Transactions.js # Transaction history
│   │   │   ├── NewTransaction.js # Create transaction
│   │   │   ├── Profile.js      # User profile
│   │   │   └── AdminDashboard.js # Admin panel
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js  # Authentication state
│   │   │
│   │   ├── locales/       # Translation files
│   │   │   ├── fr.json    # French translations
│   │   │   └── en.json    # English translations
│   │   │
│   │   ├── App.js         # Main app with routing
│   │   ├── App.css        # Global styles
│   │   └── i18n.js        # i18next configuration
│   │
│   ├── package.json
│   └── .env
│
├── memory/
│   └── PRD.md             # Product Requirements Document
│
├── test_reports/          # Testing agent reports
│   ├── iteration_1.json
│   ├── iteration_2.json
│   └── ...
│
└── README.md              # This file
```

---

## Features

### Implemented ✅

#### Core Features
- [x] **User Authentication**
  - JWT-based login/registration
  - Google OAuth via Emergent
  - Role-based access control
  - Password hashing with bcrypt

- [x] **Land Management**
  - Create, read, update land listings
  - Photo uploads (multiple images)
  - Document attachments (title deeds, etc.)
  - Status tracking (available, pending, sold)
  - Land types (residential, commercial, agricultural)
  - 8 Guinea regions supported

- [x] **Interactive Map**
  - Mapbox integration with react-map-gl
  - Land markers with status colors (green=available, yellow=pending, orange=sold)
  - Boundary drawing tool for plot outlines
  - Click-to-place new listings
  - Popup details on marker click
  - Geolocation control
  - Scale indicator

- [x] **Transaction Recording**
  - Buyer/seller information
  - Price and date tracking
  - Document attachments
  - Status workflow (pending → completed)

- [x] **Admin Dashboard**
  - Land verification workflow
  - Platform statistics (total lands, transactions, users)
  - Pending approvals queue
  - User management

#### Notifications & Documents
- [x] **Email Notifications** (Resend)
  - Transaction confirmation to buyer & seller
  - Professional HTML templates in French
  - Note: Requires domain verification for production

- [x] **PDF Generation** (ReportLab)
  - Downloadable transaction receipts
  - Official document format with letterhead
  - Land and party details included
  - QR code potential

#### Mobile & Offline
- [x] **Progressive Web App (PWA)**
  - Installable on mobile devices
  - Offline fallback page in French
  - App manifest with Guinea branding
  - App shortcuts (Map, Transactions)

- [x] **Offline Support**
  - Service worker with dual cache stores
  - Map tile caching (500 tiles max with LRU eviction)
  - Network-first API strategy with cache fallback
  - Offline status indicator banner
  - Placeholder tiles when offline

- [x] **Mobile Optimization**
  - Touch-friendly 44px+ tap targets
  - Responsive layouts (stack on mobile)
  - Larger map markers on mobile (40px)
  - Navigation controls at bottom-right for thumb reach
  - Compact horizontal land cards
  - Safe area padding for notched devices

#### Communication
- [x] **WhatsApp Integration**
  - Floating help button (+224 Guinea code)
  - Contact owner via WhatsApp with pre-filled message
  - Share listings via WhatsApp
  - Share completed transactions
  - French message templates

- [x] **Bilingual Support**
  - French (primary) - Full UI
  - English (secondary) - Full UI
  - Language switcher in navbar
  - Persistent language preference

### Planned/In Progress 🔜

#### P0 - Critical (Current Sprint)
- [ ] **Authenticity Verification System**
  - Multi-level verification (quartier → secteur → commune → region)
  - Document verification workflow
  - Verification badges with authority name
  - Verification history tracking

- [ ] **Reliability Ratings/Reviews**
  - 5-star rating system for sellers and buyers
  - Written reviews with transaction link
  - Average rating display on profiles
  - Review moderation by admin

- [ ] **Price per Square Meter by Neighborhood**
  - Reference prices by sector/quartier
  - Price comparison indicators
  - Market price alerts
  - Admin-managed price data

- [ ] **Suggestions & Feedback System**
  - User feedback collection
  - Feature requests submission
  - Bug reports
  - Admin review dashboard

#### P1 - High Priority
- [ ] SMS Notifications (Twilio)
- [ ] Push notifications
- [ ] Production Mapbox token with full features

#### P2 - Future
- [ ] Payment integration (Orange Money, MTN Money)
- [ ] Advanced search filters
- [ ] Land comparison feature
- [ ] Local languages:
  - Pular (Adlam script)
  - Maninka
  - Soussou
  - N'Ko script

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6+
- Yarn package manager

### Backend Setup
```bash
cd /app/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup
```bash
cd /app/frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run development server
yarn start
```

---

## Configuration

### Backend Environment Variables (.env)
```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017
DB_NAME=guinea_land_hub

# JWT Authentication
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_ALGORITHM=HS256

# Google OAuth (via Emergent)
GOOGLE_CLIENT_ID=your-google-client-id

# File Storage (Emergent Object Storage)
EMERGENT_LLM_KEY=your-emergent-key

# Email Notifications (Resend)
RESEND_API_KEY=re_xxxxxxxxxx
SENDER_EMAIL=notifications@yourdomain.com

# Mapbox (for full map features)
MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxx
```

### Frontend Environment Variables (.env)
```env
# Backend API URL
REACT_APP_BACKEND_URL=https://your-domain.com

# Mapbox Token (optional, has fallback)
REACT_APP_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxx
```

---

## API Documentation

### Authentication Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login, returns JWT token |
| `/api/auth/me` | GET | Yes | Get current user profile |
| `/api/auth/google` | GET | No | Initiate Google OAuth |
| `/api/auth/google/callback` | GET | No | Google OAuth callback |

### Land Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/lands` | GET | No | List lands with filters |
| `/api/lands` | POST | Yes | Create new land listing |
| `/api/lands/{id}` | GET | No | Get land details |
| `/api/lands/{id}` | PUT | Yes | Update land (owner only) |
| `/api/lands/{id}` | DELETE | Yes | Delete land (owner only) |

**Query Parameters for GET /api/lands:**
- `search` - Text search in title/description
- `region` - Filter by region name
- `land_type` - residential, commercial, agricultural
- `status` - available, pending, sold
- `min_price` / `max_price` - Price range
- `verified` - true/false

### Transaction Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/transactions` | GET | Yes | List user's transactions |
| `/api/transactions` | POST | Yes | Create new transaction |
| `/api/transactions/{id}` | GET | Yes | Get transaction details |
| `/api/transactions/{id}/pdf` | GET | Yes | Download PDF receipt |

### Admin Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Platform statistics |
| `/api/admin/pending-lands` | GET | Admin | Lands awaiting verification |
| `/api/admin/verify-land/{id}` | PUT | Admin | Verify a land listing |
| `/api/admin/users` | GET | Admin | List all users |

### Utility Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/regions` | GET | No | List 8 Guinea regions |
| `/api/upload` | POST | Yes | Upload file to storage |
| `/api/stats` | GET | No | Public platform statistics |
| `/api/health` | GET | No | Health check |

---

## Database Schema

### Users Collection
```javascript
{
  user_id: String,          // UUID v4
  email: String,            // Unique, indexed
  password_hash: String,    // bcrypt hashed
  name: String,
  phone: String,            // Guinea format: +224 XXX XXX XXX
  role: String,             // buyer, seller, agent, admin, chef_quartier, chef_secteur, chef_village, maire, prefet, gouverneur
  
  // For administrative roles
  admin_level: String,      // quartier, secteur, village, commune, prefecture, region
  admin_area: String,       // Name of their jurisdiction
  
  verified: Boolean,        // Email verified
  google_id: String,        // For OAuth users
  
  // Profile
  avatar_url: String,
  bio: String,
  
  // Ratings (for sellers/buyers)
  rating_average: Number,   // 0-5
  rating_count: Number,
  
  created_at: DateTime,
  updated_at: DateTime
}
```

### Lands Collection
```javascript
{
  land_id: String,          // UUID v4
  title: String,
  description: String,
  price: Number,            // In GNF (Guinean Franc)
  size: Number,             // Square meters
  price_per_m2: Number,     // Calculated
  land_type: String,        // residential, commercial, agricultural
  status: String,           // available, pending, sold
  
  // Location
  region: String,           // e.g., "Conakry"
  prefecture: String,
  commune: String,          // e.g., "Kaloum"
  quartier: String,         // Neighborhood
  secteur: String,          // Sector within quartier
  address: String,          // Street address
  latitude: Number,
  longitude: Number,
  boundaries: [[lng, lat]], // Polygon coordinates for plot outline
  
  // Media
  photos: [String],         // Array of URLs
  documents: [String],      // Array of URLs (title deeds, etc.)
  
  // Ownership
  owner_id: String,         // Reference to users
  owner_name: String,
  owner_phone: String,
  
  // Verification System
  verified: Boolean,
  verification_level: String,  // quartier, secteur, commune, region
  verifications: [{
    verified_by: String,       // user_id of verifier
    verifier_name: String,
    verifier_role: String,     // chef_quartier, maire, etc.
    verification_level: String,
    verified_at: DateTime,
    notes: String
  }],
  
  created_at: DateTime,
  updated_at: DateTime
}
```

### Transactions Collection
```javascript
{
  transaction_id: String,   // UUID v4
  land_id: String,
  land_title: String,
  
  // Parties
  buyer_id: String,
  buyer_name: String,
  buyer_email: String,
  buyer_phone: String,
  
  seller_id: String,
  seller_name: String,
  seller_email: String,
  seller_phone: String,
  
  // Financial
  price: Number,            // GNF
  price_per_m2: Number,
  
  // Dates
  transaction_date: DateTime,
  completion_date: DateTime,
  
  status: String,           // pending, completed, cancelled
  notes: String,
  documents: [String],      // Supporting documents
  
  // Reviews (after completion)
  buyer_review: {
    rating: Number,         // 1-5
    comment: String,
    created_at: DateTime
  },
  seller_review: {
    rating: Number,
    comment: String,
    created_at: DateTime
  },
  
  created_at: DateTime,
  updated_at: DateTime
}
```

### Reviews Collection (New)
```javascript
{
  review_id: String,
  transaction_id: String,
  reviewer_id: String,      // Who wrote the review
  reviewer_name: String,
  reviewed_id: String,      // Who is being reviewed
  reviewed_name: String,
  review_type: String,      // buyer_reviewing_seller, seller_reviewing_buyer
  rating: Number,           // 1-5
  comment: String,
  
  // Moderation
  status: String,           // pending, approved, rejected
  moderated_by: String,
  moderated_at: DateTime,
  
  created_at: DateTime
}
```

### Neighborhood Prices Collection (New)
```javascript
{
  price_id: String,
  region: String,
  commune: String,
  quartier: String,
  secteur: String,
  
  // Price data
  price_per_m2_min: Number,
  price_per_m2_max: Number,
  price_per_m2_avg: Number,
  
  land_type: String,        // residential, commercial, agricultural
  
  // Metadata
  sample_size: Number,      // Number of transactions used
  last_updated: DateTime,
  updated_by: String,       // Admin who updated
  
  created_at: DateTime
}
```

### Feedback Collection (New)
```javascript
{
  feedback_id: String,
  user_id: String,          // Optional, can be anonymous
  user_name: String,
  user_email: String,
  
  type: String,             // suggestion, bug, complaint, other
  category: String,         // ui, map, transactions, general
  title: String,
  description: String,
  
  // Admin handling
  status: String,           // new, in_progress, resolved, wont_fix
  priority: String,         // low, medium, high
  assigned_to: String,
  admin_notes: String,
  
  created_at: DateTime,
  updated_at: DateTime
}
```

---

## Deployment

### Production Checklist
- [ ] Generate secure JWT_SECRET (min 32 characters)
- [ ] Configure production MongoDB with authentication
- [ ] Verify Resend domain for email sending
- [ ] Obtain production Mapbox token
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS for production domain only
- [ ] Set up MongoDB indexes for performance
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Create admin user account

### Supervisor Configuration
Backend and frontend are managed by Supervisor:
```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/backend.out.log
```

### MongoDB Indexes
```javascript
// Recommended indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
db.lands.createIndex({ "status": 1, "region": 1 })
db.lands.createIndex({ "owner_id": 1 })
db.lands.createIndex({ "land_type": 1 })
db.lands.createIndex({ "location": "2dsphere" })
db.transactions.createIndex({ "buyer_id": 1 })
db.transactions.createIndex({ "seller_id": 1 })
db.transactions.createIndex({ "land_id": 1 })
```

---

## Roadmap

### Phase 1 - MVP (Completed ✅)
- ✅ User authentication (JWT + Google OAuth)
- ✅ Land CRUD operations
- ✅ Interactive map with Mapbox
- ✅ Transaction recording
- ✅ Admin dashboard
- ✅ Bilingual support (FR/EN)

### Phase 2 - Documents & Mobile (Completed ✅)
- ✅ Email notifications (Resend)
- ✅ PDF transaction receipts
- ✅ PWA & offline support
- ✅ Map tile caching
- ✅ Mobile optimization
- ✅ WhatsApp integration

### Phase 3 - Trust & Verification (Current)
- 🔄 Administrative user roles
- 🔄 Multi-level verification system
- 🔄 Ratings and reviews
- 🔄 Neighborhood pricing
- 🔄 Feedback system

### Phase 4 - Scale (Planned)
- 📋 SMS notifications
- 📋 Push notifications
- 📋 Payment integration (Orange Money, MTN)
- 📋 Advanced analytics

### Phase 5 - Localization (Future)
- 📋 Pular language (Adlam script)
- 📋 Maninka language
- 📋 Soussou language
- 📋 N'Ko script support

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@guinealand.com | admin123 |

---

## Guinea Regions

The platform supports all 8 administrative regions of Guinea:

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

## Known Issues & Limitations

1. **Mapbox Demo Token**: Currently using a demo token which may show watermarks and have rate limits. Production deployment requires a paid Mapbox token.

2. **Email Sandbox**: Resend is configured with a test API key that only sends to the verified developer email. Production requires domain verification.

3. **File Size Limits**: Uploads are limited to 10MB per file. Large documents may need to be compressed.

4. **Offline Limitations**: While basic offline support works, complex operations (transactions, uploads) require connectivity.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Backend: Follow PEP 8, use type hints
- Frontend: Use ESLint config, functional components with hooks
- Commits: Use conventional commits (feat:, fix:, docs:, etc.)

---

## License

Proprietary - All rights reserved

---

## Support

- **WhatsApp**: +224 621 000 000
- **Email**: support@guinealandhub.com

---

*Built with Emergent AI Platform*

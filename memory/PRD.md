# Guinea Land Hub - Product Requirements Document

## Original Problem Statement
Build an app that will map and sell lands in Guinea, handling land transactions where every transaction is tracked with all information (photos, location, parties involved, etc.). The goal is to make land information accessible in Guinea where it's traditionally a challenge.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS, Shadcn UI
- **Map**: React Map GL with Mapbox
- **Auth**: JWT + Emergent Google OAuth
- **Storage**: Emergent Object Storage for files
- **Language**: Bilingual French (primary) + English

## User Personas
1. **Buyers**: Looking to purchase land in Guinea
2. **Sellers**: Property owners wanting to sell their land
3. **Real Estate Agents**: Professionals managing land transactions
4. **Administrators**: Platform managers verifying land listings

## Core Requirements (Static)
- Interactive map with land plot boundaries
- Land listings with photos, location, price, size
- Transaction recording (buyer, seller, date, price, documents)
- User authentication (JWT + Google OAuth)
- French/English bilingual support
- Search and filter by region, price, type, status

## What's Been Implemented (March 2024)

### Backend APIs
- ✅ User authentication (register, login, Google OAuth)
- ✅ User management (CRUD operations)
- ✅ Land management (create, read, update, delete, verify)
- ✅ Transaction recording
- ✅ Stats and regions endpoints
- ✅ Protected routes with JWT/session auth
- ✅ **NEW: File upload API (Object Storage integration)**
- ✅ **NEW: Admin dashboard API**
- ✅ **NEW: Land verification/rejection APIs**
- ✅ **NEW: Admin user management APIs**

### Frontend Pages
- ✅ Landing page with hero, stats, features
- ✅ Login page with email/password and Google OAuth
- ✅ Registration page with role selection
- ✅ Map view with split-screen layout (40% list / 60% map)
- ✅ Listings page with search and filters
- ✅ Land detail page with photos, map, info
- ✅ Dashboard for authenticated users
- ✅ **NEW: Add Land form with file uploads and boundary drawing**
- ✅ Transactions page
- ✅ New Transaction form
- ✅ Profile page
- ✅ **NEW: Admin Dashboard with verification workflow**

### New Features (Phase 2)
- ✅ Document upload (photos + official documents like actes de vente)
- ✅ Admin verification workflow (verify/reject lands)
- ✅ Boundary drawing tool on map
- ✅ Admin-only navbar link
- ✅ User role statistics

### Design System
- Forest Green (#133E26) primary color
- Terracotta (#D95A2B) accent color
- Chivo font for headings, IBM Plex Sans for body
- Swiss Brutalist style with sharp edges
- Grain texture overlay

## Test Credentials
- **Admin**: admin@guinealand.com / admin123
- **Demo Agent**: demo@guinealand.com (Google OAuth)

## Prioritized Backlog

### P0 - Critical (For Production)
- [x] Document/photo upload functionality ✅
- [x] Admin verification workflow ✅
- [ ] Email notifications for transactions

### P1 - High Priority
- [x] Land boundary drawing tool ✅
- [x] Admin dashboard ✅
- [ ] Transaction document generation (PDF)
- [ ] Mobile app optimization

### P2 - Nice to Have
- [ ] SMS notifications (Twilio)
- [ ] Payment integration for premium listings
- [ ] Advanced search with saved filters
- [ ] Land comparison feature

## Next Tasks
1. Add email notifications for new transactions
2. Generate PDF transaction documents
3. Optimize mobile experience
4. Add SMS notifications

## Tech Stack
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, Object Storage
- Frontend: React 19, React Router, i18next, React Map GL, Framer Motion
- UI: Tailwind CSS, Shadcn UI, Phosphor Icons
- Database: MongoDB
- Storage: Emergent Object Storage

# Guinea Land Hub - Product Requirements Document

## Original Problem Statement
Build an app that will map and sell lands in Guinea, handling land transactions where every transaction is tracked with all information (photos, location, parties involved, etc.). The goal is to make land information accessible in Guinea where it's traditionally a challenge.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS, Shadcn UI
- **Map**: React Map GL with Mapbox
- **Auth**: JWT + Emergent Google OAuth
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

### Frontend Pages
- ✅ Landing page with hero, stats, features
- ✅ Login page with email/password and Google OAuth
- ✅ Registration page with role selection
- ✅ Map view with split-screen layout (40% list / 60% map)
- ✅ Listings page with search and filters
- ✅ Land detail page with photos, map, info
- ✅ Dashboard for authenticated users
- ✅ Add Land form with map location picker
- ✅ Transactions page
- ✅ New Transaction form
- ✅ Profile page

### Design System
- Forest Green (#133E26) primary color
- Terracotta (#D95A2B) accent color
- Chivo font for headings, IBM Plex Sans for body
- Swiss Brutalist style with sharp edges
- Grain texture overlay

## Prioritized Backlog

### P0 - Critical (For Production)
- [ ] Add proper Mapbox token (user to provide)
- [ ] Document/photo upload functionality (Object Storage integration)
- [ ] Email notifications for transactions

### P1 - High Priority
- [ ] Land boundary drawing tool on map
- [ ] Admin dashboard for land verification
- [ ] Transaction document generation (PDF)
- [ ] Mobile app optimization

### P2 - Nice to Have
- [ ] SMS notifications (Twilio)
- [ ] Payment integration for premium listings
- [ ] Advanced search with saved filters
- [ ] Land comparison feature

## Next Tasks
1. Integrate Object Storage for document/photo uploads
2. Add boundary drawing tool for map
3. Implement admin verification workflow
4. Add email notifications for new transactions
5. Optimize mobile experience

## Tech Stack
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt
- Frontend: React 19, React Router, i18next, React Map GL, Framer Motion
- UI: Tailwind CSS, Shadcn UI, Phosphor Icons
- Database: MongoDB

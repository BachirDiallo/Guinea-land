# Guinea Land Hub - Product Requirements Document

## Original Problem Statement
Build an app that will map and sell lands in Guinea, handling land transactions where every transaction is tracked with all information (photos, location, parties involved, etc.). The goal is to make land information accessible in Guinea where it's traditionally a challenge.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS, Shadcn UI
- **Map**: React Map GL with Mapbox
- **Auth**: JWT + Emergent Google OAuth
- **Storage**: Emergent Object Storage for files
- **Email**: Resend for transaction notifications
- **PDF**: ReportLab for transaction documents
- **Language**: Bilingual French (primary) + English

## User Personas
1. **Buyers (Acheteurs)**: Looking to purchase land in Guinea
2. **Sellers (Vendeurs)**: Property owners wanting to sell their land
3. **Real Estate Agents**: Professionals managing land transactions
4. **Administrators**: Platform managers verifying land listings
5. **Administrative Officials (Government)**:
   - Chef de Quartier - Neighborhood chief (quartier level verification)
   - Chef de Secteur - Sector chief (secteur level verification)
   - Chef de Village - Village chief (village level verification)
   - Maire - Mayor (commune level verification)
   - Préfet - Prefect (prefecture level verification)
   - Gouverneur - Governor (region level verification)

## Core Requirements (Static)
- Interactive map with land plot boundaries
- Land listings with photos, location, price, size
- Transaction recording (buyer, seller, date, price, documents)
- User authentication (JWT + Google OAuth)
- French/English bilingual support
- Search and filter by region, price, type, status

## What's Been Implemented (March 2024)

### Phase 1 - MVP
- ✅ User authentication (register, login, Google OAuth)
- ✅ Land management (CRUD operations)
- ✅ Transaction recording
- ✅ Interactive map with Mapbox
- ✅ French/English bilingual support

### Phase 2 - Document & Admin
- ✅ File upload API (Object Storage)
- ✅ Admin dashboard with verification workflow
- ✅ Land boundary drawing tool

### Phase 3 - Notifications & Mobile
- ✅ **Email notifications** (Resend integration)
  - Transaction confirmation emails to buyer & seller
  - Professional HTML templates in French
- ✅ **PDF generation** (ReportLab)
  - Downloadable transaction receipts
  - Official document format with land/party details
- ✅ **Mobile optimization**
  - Touch-friendly tap targets (44px min)
  - Responsive layouts (cards stack on mobile)
  - Safe area padding for notched devices
  - iOS zoom prevention on input focus
  - Momentum scrolling

### Phase 4 - PWA & WhatsApp (March 24, 2024)
- ✅ **Progressive Web App (PWA)**
  - Service worker for offline caching (`sw.js`)
  - PWA manifest with app metadata (`manifest.json`)
  - Offline fallback page in French (`offline.html`)
  - Network-first strategy for API calls with cache fallback
  - Cache-first strategy for static assets
  - Offline status indicator banner
  - PWA install prompt component
- ✅ **WhatsApp Integration**
  - Floating help button on all pages (Guinea country code: +224)
  - Contact owner button on land detail pages
  - Share land listings via WhatsApp
  - Share completed transactions via WhatsApp
  - Pre-filled French message templates
- ✅ **Map Tile Caching for Offline Use**
  - Separate cache store for map tiles (`guinea-land-hub-maps-v1`)
  - Stale-while-revalidate caching strategy
  - LRU eviction when cache reaches 500 tiles
  - Placeholder SVG tiles for uncached areas when offline
  - Caches tiles from api.mapbox.com and tiles.mapbox.com
- ✅ **Mobile Map Optimization**
  - Larger touch targets for markers (40px on mobile)
  - Navigation controls positioned for thumb reach (bottom-right on mobile)
  - Geolocation control for user location
  - Scale control for reference
  - Map takes 60vh on mobile for better visibility
  - Compact land cards with horizontal layout
  - Offline indicator banner on map
  - Touch-optimized interactions (no rotate on mobile)

### Phase 5 - Trust & Market Regulation (March 31, 2024)
- ✅ **Multi-Level Verification System**
  - Administrative user roles: chef_quartier, chef_secteur, chef_village, maire, prefet, gouverneur
  - Verification badges showing authority level
  - Verification history with timestamps and notes
  - Each level can verify lands in their jurisdiction
- ✅ **Ratings & Reviews System**
  - 5-star rating for buyers and sellers
  - Written reviews linked to transactions
  - Average rating displayed on profiles
  - Review moderation system
- ✅ **Neighborhood Price Reference**
  - Price per m² by region/commune/quartier
  - Min/max/average price ranges
  - Price comparison on land detail pages
  - Market status indicators (fair/above/below market)
  - Admin-managed price data
- ✅ **Feedback & Suggestions System**
  - Dedicated feedback page at /feedback
  - Types: Suggestion, Bug report, Complaint, Other
  - Categories: General, UI, Map, Transactions, Verification, Payments
  - Optional email for anonymous users
  - Admin dashboard for feedback management

## Test Credentials
- **Admin**: admin@guinealand.com / admin123
- **Demo Agent**: demo@guinealand.com (Google OAuth)

## Configuration Required for Production

### Email (Resend)
- Current: Test key (can only send to owner's email)
- For production: Verify domain at resend.com/domains
- Update SENDER_EMAIL to verified domain email

## Prioritized Backlog

### P0 - Critical (Completed ✅)
- [x] Document/photo upload ✅
- [x] Admin verification workflow ✅
- [x] Email notifications ✅
- [x] PDF generation ✅
- [x] Mobile optimization ✅
- [x] Authenticity Verification System ✅
- [x] Reliability Ratings/Reviews ✅
- [x] Price per m² by Neighborhood ✅
- [x] Suggestions & Feedback System ✅

### P1 - High Priority (Remaining)
- [ ] Verify custom domain for email sending
- [ ] SMS notifications (Twilio - user opted to wait)
- [ ] Push notifications for mobile
- [x] Offline support / PWA ✅
- [ ] Fix Mapbox token for full map features

### P2 - Nice to Have
- [ ] Payment integration (Orange Money, MTN Money)
- [ ] Advanced search with saved filters
- [ ] Land comparison feature
- [x] WhatsApp integration for Guinea market ✅

### P3 - Future
- [ ] Local languages: Pular (Adlam), Maninka, Soussou, N'Ko

## Tech Stack
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, Resend, ReportLab
- Frontend: React 19, React Router, i18next, React Map GL, Phosphor Icons
- UI: Tailwind CSS, Shadcn UI
- Database: MongoDB
- Storage: Emergent Object Storage

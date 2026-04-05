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

### Phase 6 - Market Analysis & Notifications (April 5, 2024)
- ✅ **Dual Pricing System**
  - Reference prices (admin-set) - "Prix de référence" tab
  - Market prices from actual transactions - "Ventes à proximité" tab
  - Nearby transactions API (`/api/prices/nearby/{land_id}`)
  - Distance-based search (configurable radius)
  - Market statistics: min/avg/max from similar transactions
- ✅ **Market Analysis API**
  - `GET /api/prices/market-analysis` endpoint
  - Filters by region, commune, land_type, time period
  - Returns transaction count, avg/min/max/median price per m²
  - Total volume calculation
- ✅ **Push Notifications System**
  - Notification bell in navbar for logged-in users
  - Subscribe/unsubscribe endpoints
  - Notification preferences (new listings, transactions, price alerts, verifications)
  - Notification history and unread count
  - Mark as read functionality

### Phase 7 - Advanced Features & Localization (April 5, 2024)
- ✅ **Market Trends Dashboard**
  - Price evolution over time by month at `/market-trends`
  - Filters by region, land type, time period (6/12/24/36 months)
  - Summary cards: Tendance, Transactions, Volume total
  - Bar chart visualization of avg price per m² by month
  - Trend direction indicator (up/down/stable)
- ✅ **Land Comparison Feature**
  - Compare up to 5 lands side-by-side at `/compare`
  - Best value badges (Moins cher, Plus grand, Meilleur prix/m²)
  - Metrics summary (min/max/avg for price, size, price per m²)
  - Land selector modal with photos and details
- ✅ **Saved Searches**
  - Save search filters for reuse at `/saved-searches`
  - Filter options: region, land_type, price range, size range, verified only
  - Option to notify on new matches
  - Execute saved searches to view matching lands
- ✅ **Local Language Support**
  - Pular (Fulfulde) - spoken in Fouta Djallon
  - Maninka (Mandingo) - spoken in Upper Guinea
  - Soussou (Susu) - spoken in Maritime Guinea/Conakry
  - Language switcher in navbar with 5 options (FR, EN, Pular, Maninka, Susu)

## Test Credentials
- **Admin**: admin@guinealand.com / admin123
- **Demo Agent**: demo@guinealand.com (Google OAuth)

## Configuration Required for Production

### Email (Resend)
- Current: Test key (can only send to owner's email)
- For production: Verify domain at resend.com/domains
- Update SENDER_EMAIL to verified domain email

### Phase 6 - Adoption Features (April 5, 2025)
- ✅ **QR Codes for Land Listings**
  - GET `/api/lands/{land_id}/qrcode` - Returns PNG QR code (customizable size)
  - GET `/api/lands/{land_id}/qrcode/download` - Printable PNG with land info overlay
  - QR Code dialog in land detail page with download/print buttons
  - Brand colors (#133E26 Guinea Land Hub green)
- ✅ **Zone Alerts Subscription**
  - POST `/api/zone-alerts` - Create subscription (region, commune, quartier, types, price/size filters)
  - GET `/api/zone-alerts` - List user's active subscriptions
  - PUT `/api/zone-alerts/{id}` - Toggle active, update filters
  - DELETE `/api/zone-alerts/{id}` - Remove subscription
  - Automatic email notifications when new land matches criteria
  - SMS notifications ready (when Twilio configured)
  - `/zone-alerts` page with subscription management
  - Quick buttons for popular zones (Ratoma, Kaloum, Matam, Kindia, Labé)
- ✅ **SMS Notifications Infrastructure**
  - Twilio integration scaffolding complete
  - Guinea phone number formatting (+224)
  - GET `/api/sms/status` - Check if SMS is configured
  - POST `/api/sms/test` - Admin SMS testing
- ✅ **Enhanced Nearby Comparison**
  - Adjustable radius selector (1km to 50km) with slider + dropdown
  - Toggle between List view and Map view
  - Map shows radius circle + markers for nearby transactions
  - Click markers to see details + navigate to land
- ✅ **Enhanced Market Trends Dashboard**
  - Interactive map to select zones/regions
  - Click region to see detailed statistics (terrains, transactions, price/m²)
  - Communes breakdown within each region
  - Price evolution chart with bar visualization
  - Top Sellers leaderboard (by sales count and volume)
  - Verified Officials directory
  - Region filters for all data
  - API endpoints: `/market/regional-stats`, `/market/top-sellers`, `/market/officials`, `/market/commune-stats/{region}`
  - GET `/api/zone-alerts` - List user's active subscriptions
  - PUT `/api/zone-alerts/{id}` - Toggle active, update filters
  - DELETE `/api/zone-alerts/{id}` - Remove subscription
  - Automatic email notifications when new land matches criteria
  - SMS notifications ready (when Twilio configured)
  - `/zone-alerts` page with subscription management
  - Quick buttons for popular zones (Ratoma, Kaloum, Matam, Kindia, Labé)
- ✅ **SMS Notifications Infrastructure**
  - Twilio integration scaffolding complete
  - Guinea phone number formatting (+224)
  - GET `/api/sms/status` - Check if SMS is configured
  - POST `/api/sms/test` - Admin SMS testing
  - Zone alert triggers for SMS

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
- [x] Push Notifications System ✅
- [x] Dual Pricing (Reference + Market Prices) ✅
- [x] Market Analysis from Actual Transactions ✅

### P1 - High Priority (Remaining)
- [ ] SMS notifications (Twilio - user opted to wait, scaffolding complete)
- [x] Offline support / PWA ✅
- [x] Mapbox with user's token ✅

### P2 - Nice to Have (Completed ✅)
- [x] WhatsApp integration for Guinea market ✅
- [x] Advanced search with saved filters ✅
- [x] Land comparison feature ✅
- [x] Market trends dashboard ✅
- [x] QR Codes for land listings ✅ (April 2025)
- [x] Zone Alerts subscription system ✅ (April 2025)

### P3 - Future (Completed ✅)
- [x] Local languages: Pular, Maninka, Soussou ✅
- [ ] N'Ko script support
- [ ] Payment integration handled outside app (platform is intermediary only)

## Tech Stack
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, Resend, ReportLab
- Frontend: React 19, React Router, i18next, React Map GL, Phosphor Icons
- UI: Tailwind CSS, Shadcn UI
- Database: MongoDB
- Storage: Emergent Object Storage

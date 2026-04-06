# Guinea Land Hub - Product Requirements Document

## Original Problem Statement
Build an app that will map and sell lands in Guinea. The idea is to handle land transactions in Guinea, where every transaction will be tracked along with all related information (photos, location, parties involved, etc.).

## Product Requirements
- **Users**: Agents, buyers, sellers, admins
- **Auth**: JWT + Google social login
- **Transactions**: Record details with price
- **Map**: Interactive map with plot boundaries and text details
- **Language**: Bilingual (French primary, English secondary) with future local languages support

## User Personas
1. **Buyers** - Search for land, compare options, contact sellers
2. **Sellers** - List land with photos/boundaries, manage inquiries
3. **Agents** - Facilitate transactions, manage listings
4. **Admins** - Verify listings, manage users, access analytics

---

## Completed Features (December 2025)

### Core Platform
- [x] JWT + Google OAuth authentication (cookie-based)
- [x] User roles (buyer, seller, agent, admin)
- [x] Land CRUD with photos, boundaries, verification
- [x] Interactive Mapbox integration with boundary drawing
- [x] Transaction tracking with PDF receipts
- [x] Multilingual support (FR/EN/Pular/Maninka/Soussou)

### Discovery & Search
- [x] Advanced land search with filters (region, type, price, size)
- [x] Grid/list view toggles
- [x] Saved searches with notification toggles
- [x] QR code generation for land listings

### Comparison & Analytics
- [x] Multi-land comparison (up to 4 lands)
- [x] 3 view modes: Cards, Table, Map
- [x] Smart badges (lowest price, best value, largest)
- [x] Nearby lands with adjustable radius selector
- [x] Market trends dashboard with regional map
- [x] Price evolution charts
- [x] Top sellers leaderboard
- [x] Verified officials directory

### Alerts & Notifications
- [x] Zone alerts subscription system
- [x] Email notifications via Resend
- [x] In-app notification center
- [x] Twilio SMS scaffolded (awaiting API key)

### Communication
- [x] WhatsApp integration (+224 Guinea code)
- [x] QR codes with print/download options
- [x] PDF transaction receipts

### Trust & Verification
- [x] Multi-level verification (Chef de Quartier → Gouverneur)
- [x] Verification badges
- [x] Ratings & reviews system
- [x] Dual pricing (reference vs market)

### UX/Navigation
- [x] Mega menu navigation
- [x] Mobile-responsive sheet menu
- [x] PWA support with offline fallback
- [x] Service worker for map tile caching

---

## Tech Stack
- **Backend**: FastAPI, MongoDB (Motor async), PyJWT, ReportLab, Resend, QRCode
- **Frontend**: React 18, Tailwind CSS, Shadcn/UI, react-map-gl, i18next
- **Auth**: Cookie-based JWT, Emergent Google OAuth
- **Storage**: Emergent Object Storage

---

## P0 - Critical (Current)
- [x] Clear secrets for GitHub push workflow

## P1 - High Priority
- [ ] Backend refactoring: Split server.py (3000+ lines) into modular routes
- [ ] Twilio SMS activation (pending user API key)

## P2 - Medium Priority  
- [ ] Referral program system
- [ ] N'Ko script / local language translations

## P3 - Future Enhancements
- [ ] Mobile native app
- [ ] Offline transaction drafts
- [ ] Land valuation AI

---

## Key Files
- `/app/backend/server.py` - Main API (needs refactoring)
- `/app/frontend/src/App.js` - Routes & layout
- `/app/frontend/src/components/Navbar.js` - Mega menu
- `/app/frontend/src/pages/MarketTrends.js` - Analytics dashboard
- `/app/frontend/src/pages/LandComparison.js` - Comparison tool

## Database Collections
- `users`, `lands`, `transactions`, `zone_alerts`, `notifications`, `saved_searches`

## Test Accounts
- Admin: admin@guinealand.com / admin123
- Buyer: buyer2@test.com / test123
- Seller: seller@test.com / test123

---

## Critical Notes for Development
1. **Auth**: Frontend uses cookie-based auth (`credentials: 'include'`). JWT not in React state.
2. **PWA**: Offline mode disabled in preview environments to prevent false-positives.
3. **Secrets Workflow**: Clear `.env` before GitHub push, restore after from SECRETS.md.

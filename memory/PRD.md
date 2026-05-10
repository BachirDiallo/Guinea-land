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

### AI Features (December 2025)
- [x] **AI Land Assistant** - Bilingual chatbot (FR/EN) powered by GPT-4o-mini
  - Floating chat interface on all pages
  - Quick action buttons for common questions
  - Persistent chat history per session
  - Guides users to find lands, understand prices, sell process
- [x] **AI Description Generator** - Auto-generates French land descriptions
  - Accessible from "Ajouter un Terrain" page
  - Takes size, region, commune, land type as input
  - Tailored descriptions for residential, commercial, agricultural
  - Professional copywriting optimized for conversions

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
- **Backend**: FastAPI, MongoDB (Motor async), PyJWT, ReportLab, Resend, QRCode, emergentintegrations
- **Frontend**: React 18, Tailwind CSS, Shadcn/UI, react-map-gl, i18next
- **Auth**: Cookie-based JWT, Emergent Google OAuth
- **Storage**: Emergent Object Storage
- **AI**: GPT-4o-mini via Emergent LLM Key

---

## P0 - Critical (Current)
- [x] Clear secrets for GitHub push workflow
- [x] Fix nearby lands feature to show available lands (not just transactions)
- [x] Add diverse land listings across Guinea regions

## P1 - High Priority
- [x] **Phase 1: Fraud Prevention & Trust** - Trust Score, Duplicate Alerts, Community Verification, Ownership History
- [x] **Phase 2: Due Diligence** - Risk Assessment, Cadastre Check, Dispute Tracking
- [x] **Phase 3: Transaction Security** - Escrow, Digital Witnesses, Document Vault
- [x] **Phase 4: Better Decisions** - Infrastructure Score, Fair Price Estimator, Investment Analysis
- [ ] Backend refactoring: Split `server.py` (5300+ lines) into modular routes
- [ ] Twilio SMS activation (pending API key)

## P2 - Medium Priority
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
- `/app/frontend/src/components/AIAssistant.js` - AI chatbot component
- `/app/frontend/src/pages/MarketTrends.js` - Analytics dashboard
- `/app/frontend/src/pages/LandComparison.js` - Comparison tool

## Database Collections
- `users`, `lands`, `transactions`, `zone_alerts`, `notifications`, `saved_searches`, `ai_chat_history`

## Test Accounts
- Admin: admin@guinealand.com / admin123
- Buyer: buyer2@test.com / test123
- Seller: seller@test.com / test123

---

## Critical Notes for Development
1. **Auth**: Frontend uses cookie-based auth (`credentials: 'include'`). JWT not in React state.
2. **PWA**: Offline mode disabled in preview environments to prevent false-positives.
3. **Secrets Workflow**: Clear `.env` before GitHub push, restore after from SECRETS.md.

---

## Deployment

### Current Deployment
- **Production**: https://guinea-land-hub.emergent.host
- **Preview**: https://guinea-land-hub.preview.emergentagent.com

### Deployment Files Created
- `/app/render.yaml` - Render.com Blueprint configuration
- `/app/DEPLOY_RENDER.md` - Full deployment instructions
- `/app/BETA_TEST_MESSAGES.md` - French messages for beta testers

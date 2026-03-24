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

### P1 - High Priority (Remaining)
- [ ] Verify custom domain for email sending
- [ ] SMS notifications (Twilio - user opted to wait)
- [ ] Push notifications for mobile
- [ ] Offline support / PWA

### P2 - Nice to Have
- [ ] Payment integration for premium listings
- [ ] Advanced search with saved filters
- [ ] Land comparison feature
- [ ] WhatsApp integration for Guinea market

## Tech Stack
- Backend: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, Resend, ReportLab
- Frontend: React 19, React Router, i18next, React Map GL, Phosphor Icons
- UI: Tailwind CSS, Shadcn UI
- Database: MongoDB
- Storage: Emergent Object Storage

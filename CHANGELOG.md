# Changelog

All notable changes to Guinea Land Hub are documented here.

## [1.6.0] - 2025-04-05

### Added
- **QR Codes for Land Listings**
  - `GET /api/lands/{id}/qrcode` - Generate QR code (PNG)
  - `GET /api/lands/{id}/qrcode/download` - Printable QR with land info
  - QR Code dialog on land detail page with download/print buttons
  - Brand-colored QR codes (#133E26 Guinea Land Hub green)

- **Zone Alerts Subscription System**
  - `POST /api/zone-alerts` - Subscribe to zone (region, commune, quartier)
  - `GET /api/zone-alerts` - List user's subscriptions
  - `PUT /api/zone-alerts/{id}` - Update alert (toggle active, change filters)
  - `DELETE /api/zone-alerts/{id}` - Remove subscription
  - Filter by land type, max price, min size
  - Email notifications when new lands match criteria
  - SMS notifications ready (when Twilio configured)
  - `/zone-alerts` page with subscription management
  - Quick buttons for popular zones (Ratoma, Kaloum, Matam, Kindia, Labé)

- **SMS Notifications Infrastructure**
  - Twilio integration scaffolding
  - Guinea phone number formatting (+224)
  - `GET /api/sms/status` - Check SMS configuration
  - `POST /api/sms/test` - Admin SMS testing

### Changed
- Land detail page now shows QR Code button alongside WhatsApp share
- Navbar user dropdown includes Zone Alerts link
- Map filter panel includes Zone Alert button

## [1.5.0] - 2025-04-04

### Added
- **Market Trends Dashboard**
  - Price evolution over time
  - Regional comparison charts
  - Transaction volume trends

- **Land Comparison Feature**
  - Compare up to 3 lands side-by-side
  - Price per m² comparison
  - Feature comparison matrix

- **Advanced Search with Saved Filters**
  - Save search criteria
  - Toggle notifications for saved searches
  - Quick access to saved searches

- **Local Languages Structure**
  - Pular (Pulaar) translation structure
  - Maninka translation structure
  - Soussou translation structure
  - i18next configuration for local languages

### Fixed
- Map tile caching improved for offline use

## [1.4.0] - 2025-03-31

### Added
- **Multi-Level Verification System**
  - Administrative roles: chef_quartier, chef_secteur, chef_village, maire, prefet, gouverneur
  - Verification badges with authority level
  - Verification history with timestamps

- **Dual Pricing System**
  - Reference prices by neighborhood
  - Market price comparison
  - Price per m² benchmarking

- **Feedback Collection System**
  - User suggestions
  - Bug reports
  - Admin review dashboard

- **In-App Notifications**
  - Push notification scaffolding
  - Notification center
  - Read/unread status

## [1.3.0] - 2025-03-24

### Added
- **Progressive Web App (PWA)**
  - Service worker for offline caching
  - Installable on mobile devices
  - Offline fallback page in French

- **WhatsApp Integration**
  - Contact owner via WhatsApp
  - Share listings
  - Share completed transactions
  - Guinea country code (+224)

- **Map Tile Caching**
  - 500 tiles cached with LRU eviction
  - Placeholder tiles when offline
  - Stale-while-revalidate strategy

- **Mobile Optimization**
  - Touch-friendly 44px+ tap targets
  - Responsive layouts
  - Bottom navigation controls

## [1.2.0] - 2025-03-20

### Added
- **Email Notifications** (Resend integration)
  - Transaction confirmation emails
  - Professional HTML templates in French

- **PDF Generation** (ReportLab)
  - Downloadable transaction receipts
  - Official document format

## [1.1.0] - 2025-03-15

### Added
- **Admin Dashboard**
  - Land verification workflow
  - Platform statistics
  - User management

- **File Uploads**
  - Emergent Object Storage integration
  - Multiple photos per listing
  - Document attachments

## [1.0.0] - 2025-03-10

### Added
- **Initial Release**
  - User authentication (JWT + Google OAuth)
  - Land CRUD operations
  - Interactive Mapbox map
  - Transaction recording
  - Bilingual support (French/English)
  - 8 Guinea regions

# Pet SOS - Animal Adoption Platform

## Project Overview

Pet SOS is a **Progressive Web App (PWA)** designed to connect animal NGOs (ONGs) with potential pet adopters in Portugal. Built with modern web technologies, it delivers a native app-like experience while maintaining the accessibility and reach of a web application.

### Core Objectives
- Connect homeless pets with loving families
- Increase visibility for animal NGOs
- Facilitate monetary donations (one-time and recurring)
- Streamline the adoption process with visit scheduling
- Provide comprehensive pet and shelter information

### Why PWA?
- **Instant Access**: No app store downloads required—share direct links
- **Cross-Platform**: Works seamlessly on iOS, Android, and desktop
- **Offline Support**: Core features available without internet connection
- **Easy Sharing**: NGOs can share URLs via WhatsApp, social media, SMS
- **App-Like Experience**: Install to home screen with full-screen mode
- **Automatic Updates**: Users always get the latest version
- **Cost-Effective**: Single codebase for all platforms

---

## Technology Stack

### Frontend
- **Framework**: Angular 17+ (modern standalone components)
- **Architecture**: Progressive Web App (PWA) with @angular/pwa
- **UI Library**: Angular Material or PrimeNG
- **State Management**: Angular Signals
- **Styling**: SCSS with responsive design (mobile-first)
- **Icons**: Material Icons or Font Awesome
- **Service Worker**: Angular Service Worker for offline support and caching

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with bcrypt
- **File Storage**: AWS S3 or Cloudinary for pet images
- **Email Service**: SendGrid or NodeMailer

### Additional Services
- **Payment Integration**: Stripe or MBWay (Portuguese market)
- **Maps/Location**: Google Maps API
- **Image Optimization**: Sharp or Cloudinary

---

## Database Schema

### Users (NGO Accounts)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ong_name VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  phone VARCHAR(20),
  instagram_handle VARCHAR(100),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Pets
```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL, -- Dog, Cat, Fish, Hamster, etc.
  breed VARCHAR(100),
  age INTEGER, -- in years
  gender VARCHAR(20), -- Male/Female
  size VARCHAR(20), -- Small/Medium/Large
  color VARCHAR(50),
  weight DECIMAL(5,2), -- in kg
  description TEXT,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'available', -- available, pending, adopted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Pet Images
```sql
CREATE TABLE pet_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Donations
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id UUID REFERENCES users(id) ON DELETE CASCADE,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_cpf VARCHAR(14),
  donor_birth_date DATE,
  donor_gender VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  donation_type VARCHAR(20) NOT NULL, -- one_time, monthly
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  stripe_payment_id VARCHAR(255),
  card_holder_name VARCHAR(255),
  card_last4 VARCHAR(4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Visit Appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  ong_id UUID REFERENCES users(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(20),
  preferred_date DATE,
  preferred_time TIME,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Favorites (Wishlist)
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_email VARCHAR(255) NOT NULL, -- Anonymous user tracking by email
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(visitor_email, pet_id)
);
```

---

## API Endpoints Specification

### Authentication

**POST /api/auth/register** - Register new NGO account
**POST /api/auth/login** - Login to account
**POST /api/auth/forgot-password** - Request password reset
**POST /api/auth/reset-password** - Reset password with token

### Pet Management

**GET /api/pets** - Get all available pets (with filters: location, species, size, gender, age, page, limit)
**GET /api/pets/:id** - Get pet details with images and ONG info
**POST /api/pets** - Create new pet listing (authenticated, multipart/form-data)
**PUT /api/pets/:id** - Update pet listing (authenticated, owner only)
**DELETE /api/pets/:id** - Delete pet listing (authenticated, owner only)

### User Profile

**GET /api/users/profile** - Get current NGO profile (authenticated)
**PUT /api/users/profile** - Update NGO profile
**POST /api/users/profile/image** - Upload profile image (multipart/form-data)

### Donations

**POST /api/donations** - Process donation payment (Stripe integration)
**GET /api/donations/ong/:ongId** - Get donation history and statistics (authenticated)

### Appointments

**POST /api/appointments** - Schedule visit to meet a pet
**GET /api/appointments/ong** - Get all appointments for NGO (authenticated)
**PUT /api/appointments/:id/status** - Update appointment status (authenticated)

### Favorites

**POST /api/favorites** - Add pet to favorites
**GET /api/favorites?email={email}** - Get favorite pets for user
**DELETE /api/favorites/:id** - Remove from favorites

---

## UI/UX Design Guidelines

### Color Palette

**Primary Colors:**
- Teal/Turquoise: `#5CB5B0` (buttons, headers, accents)
- Light Teal: `#B8E3E1` (input fields, cards, backgrounds)
- Dark Gray: `#2C2C2C` (body text)
- Medium Gray: `#666666` (secondary text, disabled states)
- White: `#FFFFFF` (backgrounds, cards)

**Accent Colors:**
- Orange/Yellow: `#F5A623` (stars, ratings)
- Red: `#E74C3C` (errors, warnings)
- Green: `#27AE60` (success states)

### Typography

**Font Family:** Sans-serif (Roboto, Open Sans, or similar)

**Font Sizes:**
- H1 (Page titles): 28-32px
- H2 (Section headings): 24px
- H3 (Card headings): 20px
- Body text: 16px
- Small text: 14px
- Caption: 12px

### Spacing System

Use consistent spacing multiples of 8px:
- XS: 8px
- SM: 16px
- MD: 24px
- LG: 32px
- XL: 48px

### Component Design

**Buttons:**
- Primary: Teal background, white text, rounded corners (8px)
- Secondary: White background, teal border, teal text
- Height: 48px minimum (touch-friendly)

**Input Fields:**
- Light teal background (#B8E3E1)
- Height: 48px minimum
- Border radius: 8px
- Focus state: Add teal border

**Cards:**
- White background
- Border radius: 12px
- Box shadow: subtle (0 2px 8px rgba(0,0,0,0.1))
- Padding: 16px

**Icons:**
- Size: 24px for standard icons
- Color: Teal for active, gray for inactive

### Responsive Design

**Breakpoints:**
- Mobile: 320px - 767px (primary focus)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile-First Approach:**
- Design for mobile first
- Touch-friendly targets (minimum 48x48px)
- Bottom navigation fixed on mobile
- Top navigation on desktop

---

## Core Features

### 1. Authentication System
- JWT-based authentication
- Password hashing with bcrypt (min 10 rounds)
- Password reset flow via email
- Token expiration (7 days recommended)

### 2. Image Upload & Storage
- Support JPEG, PNG, WebP
- Maximum 5MB per image
- Automatic optimization/compression
- Thumbnail generation (300x300px)
- Max 5 images per pet
- CDN delivery recommended

### 3. Location & Distance Calculation
- Store latitude/longitude for NGOs
- Calculate distance between user and shelters
- Display in kilometers
- Sort results by distance
- Google Maps API integration

### 4. Payment Processing
- Stripe integration (PCI DSS compliant)
- One-time and recurring donations
- Euro currency support
- Receipt generation
- Webhook handling for payment events

### 5. Email Notifications
- Welcome email after registration
- Password reset link
- Appointment confirmations
- Donation receipts
- Use SendGrid or NodeMailer

### 6. Search & Filtering
- Filter by: species, size, gender, age range, location
- Sort by: distance, age, date added
- Free text search (name, breed, description)
- Pagination for results

---

## Security Best Practices

### Authentication & Authorization
- Use HTTPS only in production
- Implement JWT with short expiration times
- Hash passwords with bcrypt (cost factor 10+)
- Rate limiting on auth endpoints
- Validate JWT on every protected route

### Data Validation
- Validate all input on backend
- Use class-validator decorators
- Sanitize user input to prevent XSS
- SQL injection prevention (ORM parameterized queries)
- Validate file uploads (type, size, content)

### API Security
- Implement CORS properly
- Use Helmet.js for HTTP headers
- Rate limiting (express-rate-limit)
- Request size limits
- API versioning

### Database Security
- Use environment variables for credentials
- Database connection pooling
- Regular backups
- Encryption at rest for sensitive data
- Prepared statements only

### File Upload Security
- Validate file types (whitelist approach)
- Store outside web root
- Generate secure random filenames
- Size limits enforced

---

## Performance Optimization

### Frontend
- Lazy loading for routes
- Image optimization (WebP, responsive images)
- Virtual scrolling for large lists
- Service Worker for offline capability
- Bundle size optimization
- CDN for static assets

### Backend
- Database query optimization (indexes)
- Implement caching (Redis)
- Pagination for all list endpoints
- Connection pooling
- Compression middleware (gzip)
- Rate limiting per user

### Database Indexes
```sql
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_ong_id ON pets(ong_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_donations_ong_id ON donations(ong_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
```

---

## Testing Strategy

### Unit Tests
- All service methods
- Utility functions (distance calculation, validation)
- DTO validation
- Target: 80%+ code coverage

### Integration Tests
- API endpoints
- Database operations
- Authentication flow
- Payment processing (use Stripe test mode)

### E2E Tests
- Critical user flows:
  - Registration → Login → Add Pet
  - Search → View Pet → Schedule Appointment
  - Donation flow
- Use Cypress or Playwright

### PWA Tests
- Install flow and home screen icon
- Offline functionality
- Service worker registration
- Lighthouse audit (PWA score > 90)
- Cross-platform testing

---

## Analytics & Monitoring

### Key Metrics
- Total pets listed
- Total adoptions (appointments completed)
- Total donations received
- User registrations (NGOs)
- Conversion rates (view → appointment)
- Average donation amount

### Tools
- **Application Monitoring:** Sentry (error tracking)
- **Analytics:** Google Analytics 4 or Plausible
- **Uptime Monitoring:** UptimeRobot or Pingdom

---

## Future Enhancements (Phase 2)

1. **Admin Dashboard** - Analytics, user management, content moderation
2. **Advanced Search** - Saved searches, email alerts, compatibility quiz
3. **Social Features** - Share on social media, success stories, testimonials
4. **Messaging System** - In-app chat between adopters and NGOs
5. **Native Mobile Apps** - iOS and Android with push notifications
6. **Volunteer System** - Registration, shift scheduling, hour tracking
7. **Adoption Management** - Application forms, contracts, follow-ups
8. **Multi-language Support** - Portuguese (PT & BR), English, Spanish

---

## Success Criteria

### Technical Metrics
- Page load time < 2 seconds
- API response time < 200ms (p95)
- 99.9% uptime
- Mobile responsive (100% screens)
- Lighthouse PWA score > 90

### Business Metrics
- 100+ NGOs registered (3 months)
- 1000+ pets listed (3 months)
- 500+ appointments scheduled (3 months)
- €10,000+ in donations (6 months)
- 50% conversion rate (view → appointment)

---

## Accessibility Guidelines

### Requirements
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (4.5:1 for text)
- Alt text for all images
- ARIA labels where needed
- Focus indicators

---

**Document Version:** 2.0
**Last Updated:** January 5, 2025
**Maintained By:** Pet SOS Development Team
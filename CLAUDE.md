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

## Technology Stack Recommendations

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

#### POST /api/auth/register
Register a new NGO account.

**Request Body:**
```json
{
  "ongName": "Cantinho dos Animais",
  "email": "cantinho@gmail.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "ongName": "Cantinho dos Animais",
    "email": "cantinho@gmail.com"
  },
  "accessToken": "jwt_token_here"
}
```

#### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "cantinho@gmail.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "ongName": "Cantinho dos Animais",
    "email": "cantinho@gmail.com"
  },
  "accessToken": "jwt_token_here"
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "cantinho@gmail.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent successfully"
}
```

#### POST /api/auth/reset-password
Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

---

### Pet Management

#### GET /api/pets
Get all available pets (public endpoint with filters).

**Query Parameters:**
- `location` (string): Filter by city/region (e.g., "Lisboa")
- `species` (string): Filter by species (dog, cat, fish, hamster)
- `size` (string): Filter by size (small, medium, large)
- `gender` (string): Filter by gender
- `ageMin` (number): Minimum age
- `ageMax` (number): Maximum age
- `page` (number): Page number for pagination
- `limit` (number): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Plutão",
      "species": "dog",
      "breed": "Border Collie",
      "age": 3,
      "gender": "male",
      "size": "large",
      "color": "black and white",
      "weight": 6,
      "description": "Lorem ipsum dolor sit amet...",
      "location": "Lisboa",
      "primaryImage": "https://cdn.example.com/pluto.jpg",
      "ong": {
        "id": "uuid",
        "name": "Cantinho dos Animais",
        "location": "Lisboa",
        "distance": "4.2 km",
        "rating": 5
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### GET /api/pets/:id
Get detailed information about a specific pet.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Plutão",
  "species": "dog",
  "breed": "Border Collie",
  "age": 3,
  "gender": "male",
  "size": "large",
  "color": "black and white",
  "weight": 6,
  "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
  "location": "Lisboa",
  "images": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/pluto-1.jpg",
      "isPrimary": true
    },
    {
      "id": "uuid",
      "url": "https://cdn.example.com/pluto-2.jpg",
      "isPrimary": false
    }
  ],
  "ong": {
    "id": "uuid",
    "name": "Cantinho dos Animais",
    "email": "cantinho@gmail.com",
    "phone": "1234-5678",
    "instagram": "@cantinhosdosanimais",
    "location": "Lisboa",
    "distance": "4.2 km",
    "rating": 5
  },
  "status": "available",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### POST /api/pets
Create a new pet listing (authenticated NGO only).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body (multipart/form-data):**
```json
{
  "name": "Nina",
  "species": "dog",
  "breed": "Mixed",
  "age": 2,
  "gender": "female",
  "size": "small",
  "color": "black",
  "description": "A Nina é uma cachorrinha bem brincalhona...",
  "location": "Lisboa",
  "images": ["file1.jpg", "file2.jpg"]
}
```

**Response (201):**
```json
{
  "message": "Pet created successfully",
  "pet": {
    "id": "uuid",
    "name": "Nina",
    "species": "dog",
    "primaryImage": "https://cdn.example.com/nina.jpg"
  }
}
```

#### PUT /api/pets/:id
Update existing pet listing (authenticated NGO only, owner verification).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request Body:**
```json
{
  "name": "Nina",
  "age": 3,
  "description": "Updated description...",
  "status": "pending"
}
```

#### DELETE /api/pets/:id
Delete a pet listing (authenticated NGO only, owner verification).

---

### User Profile Management

#### GET /api/users/profile
Get current NGO profile (authenticated).

**Response (200):**
```json
{
  "id": "uuid",
  "ongName": "Cantinho dos Animais",
  "email": "cantinho@gmail.com",
  "phone": "1234-5678",
  "instagram": "@cantinhosdosanimais",
  "location": "Lisboa",
  "profileImage": "https://cdn.example.com/profile.jpg",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT /api/users/profile
Update NGO profile information.

**Request Body:**
```json
{
  "ongName": "Cantinho dos Animais Updated",
  "phone": "9876-5432",
  "instagram": "@newhandle",
  "location": "Porto"
}
```

#### POST /api/users/profile/image
Upload profile image.

**Request Body (multipart/form-data):**
```
profileImage: file
```

---

### Donations

#### POST /api/donations
Process a donation payment.

**Request Body:**
```json
{
  "ongId": "uuid",
  "donorName": "João Silva",
  "donorEmail": "joao@example.com",
  "donorCpf": "123.456.789-00",
  "donorBirthDate": "1990-05-15",
  "donorGender": "male",
  "amount": 50.00,
  "donationType": "one_time",
  "cardHolderName": "JOAO SILVA",
  "cardNumber": "4242424242424242",
  "cardExpiry": "12/25",
  "cardCvv": "123"
}
```

**Response (201):**
```json
{
  "message": "Donation processed successfully",
  "donation": {
    "id": "uuid",
    "amount": 50.00,
    "donationType": "one_time",
    "paymentStatus": "completed",
    "receiptUrl": "https://stripe.com/receipt/..."
  }
}
```

#### GET /api/donations/ong/:ongId
Get donation history for an NGO (authenticated).

**Response (200):**
```json
{
  "donations": [
    {
      "id": "uuid",
      "donorName": "João Silva",
      "amount": 50.00,
      "donationType": "one_time",
      "paymentStatus": "completed",
      "createdAt": "2025-11-01T14:30:00Z"
    }
  ],
  "statistics": {
    "totalAmount": 1250.00,
    "totalDonations": 25,
    "monthlyRecurring": 300.00
  }
}
```

---

### Appointments

#### POST /api/appointments
Schedule a visit to meet a pet.

**Request Body:**
```json
{
  "petId": "uuid",
  "visitorName": "Maria Santos",
  "visitorEmail": "maria@example.com",
  "visitorPhone": "912345678",
  "preferredDate": "2025-11-10",
  "preferredTime": "14:00",
  "notes": "I would like to bring my children"
}
```

**Response (201):**
```json
{
  "message": "Appointment request sent successfully",
  "appointment": {
    "id": "uuid",
    "petName": "Plutão",
    "ongName": "Cantinho dos Animais",
    "preferredDate": "2025-11-10",
    "status": "pending"
  }
}
```

#### GET /api/appointments/ong
Get all appointments for an NGO (authenticated).

**Response (200):**
```json
{
  "appointments": [
    {
      "id": "uuid",
      "pet": {
        "id": "uuid",
        "name": "Plutão",
        "image": "https://cdn.example.com/pluto.jpg"
      },
      "visitorName": "Maria Santos",
      "visitorEmail": "maria@example.com",
      "visitorPhone": "912345678",
      "preferredDate": "2025-11-10",
      "preferredTime": "14:00",
      "status": "pending",
      "notes": "I would like to bring my children",
      "createdAt": "2025-11-02T10:00:00Z"
    }
  ]
}
```

#### PUT /api/appointments/:id/status
Update appointment status (authenticated NGO only).

**Request Body:**
```json
{
  "status": "confirmed"
}
```

---

### Favorites

#### POST /api/favorites
Add a pet to favorites.

**Request Body:**
```json
{
  "petId": "uuid",
  "visitorEmail": "user@example.com"
}
```

#### GET /api/favorites
Get favorite pets for a user.

**Query Parameters:**
- `email` (string): User email

**Response (200):**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "pet": {
        "id": "uuid",
        "name": "Plutão",
        "primaryImage": "https://cdn.example.com/pluto.jpg",
        "breed": "Border Collie",
        "age": 3
      },
      "addedAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

#### DELETE /api/favorites/:id
Remove a pet from favorites.

---

## Progressive Web App (PWA) Configuration

### Overview

Pet SOS is built as a Progressive Web App (PWA), allowing users to install it on their devices like a native app while maintaining the accessibility of a web application. This approach provides:

- **Instant access**: No app store downloads required
- **Cross-platform**: Works on iOS, Android, desktop
- **Offline support**: Core functionality available without internet
- **App-like experience**: Full screen, home screen icon, splash screen
- **Easy sharing**: NGOs can share direct URLs
- **Automatic updates**: Users always get the latest version
- **Lower barriers**: No installation friction for potential adopters

---

### PWA Setup

#### 1. Install Angular PWA Package

```bash
# Navigate to Angular project directory
cd frontend

# Add PWA support (Angular 17+)
ng add @angular/pwa
```

This command automatically:
- Installs `@angular/service-worker` package
- Creates `ngsw-config.json` (Service Worker configuration)
- Updates `angular.json` with PWA build settings
- Generates `manifest.webmanifest` file
- Adds icon assets in various sizes
- Updates `index.html` with manifest link and theme color

---

### 2. Web App Manifest Configuration

**File:** `src/manifest.webmanifest`

```json
{
  "name": "Pet SOS - Adoção de Animais",
  "short_name": "Pet SOS",
  "description": "Plataforma para conectar animais abandonados com famílias amorosas",
  "theme_color": "#5CB5B0",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Adotar Pet",
      "short_name": "Adotar",
      "description": "Encontrar animais para adoção",
      "url": "/home",
      "icons": [
        {
          "src": "assets/icons/shortcut-pets.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Doar",
      "short_name": "Doar",
      "description": "Fazer uma doação",
      "url": "/doar",
      "icons": [
        {
          "src": "assets/icons/shortcut-donate.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "categories": ["lifestyle", "social"],
  "screenshots": [
    {
      "src": "assets/screenshots/home-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "assets/screenshots/pet-detail-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "assets/screenshots/home-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

**Manifest Properties Explained:**

- **name**: Full app name (shown during install)
- **short_name**: Abbreviated name (shown under icon, max 12 chars)
- **theme_color**: Browser UI color (our teal: #5CB5B0)
- **background_color**: Splash screen background
- **display**: 
  - `standalone` = Full screen, no browser UI (recommended)
  - `fullscreen` = Completely full screen
  - `minimal-ui` = Minimal browser controls
  - `browser` = Regular browser
- **scope**: URL scope for the PWA
- **start_url**: Launch URL when app is opened
- **orientation**: Lock to portrait or allow rotation
- **icons**: Must provide all sizes for different devices
- **shortcuts**: Quick actions from home screen icon (Android)
- **screenshots**: App store-like preview images

---

### 3. Service Worker Configuration

**File:** `ngsw-config.json`

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "appData": {
    "version": "1.0.0",
    "name": "Pet SOS"
  },
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-pets",
      "urls": [
        "/api/pets",
        "/api/pets/*"
      ],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "6h",
        "timeout": "5s"
      }
    },
    {
      "name": "api-ongs",
      "urls": [
        "/api/users/*",
        "/api/appointments/*"
      ],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "12h",
        "timeout": "5s"
      }
    },
    {
      "name": "pet-images",
      "urls": [
        "https://*.amazonaws.com/**",
        "https://*.cloudinary.com/**"
      ],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 200,
        "maxAge": "30d"
      }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/**/*__*/**"
  ]
}
```

**Service Worker Strategies:**

**`prefetch`** (App Shell):
- Download immediately during installation
- Always available, even offline
- Use for: Core app files, critical CSS/JS

**`lazy`** (Assets):
- Download when first requested
- Cached for future use
- Use for: Images, fonts, icons

**Caching Strategies:**

**`freshness` (Network First)**:
- Try network first
- Fall back to cache if offline
- Timeout after specified time
- Use for: Dynamic content (pet listings, user data)

**`performance` (Cache First)**:
- Check cache first
- Only fetch from network if not cached
- Use for: Static assets (pet images, logos)

---

### 4. Icon Generation

**Required Icon Sizes:**

Generate icons for all required sizes using your logo:

```bash
# Install image processing tool
npm install -g sharp-cli

# Generate all icon sizes from source
sharp -i logo-source.png -o assets/icons/icon-72x72.png resize 72 72
sharp -i logo-source.png -o assets/icons/icon-96x96.png resize 96 96
sharp -i logo-source.png -o assets/icons/icon-128x128.png resize 128 128
sharp -i logo-source.png -o assets/icons/icon-144x144.png resize 144 144
sharp -i logo-source.png -o assets/icons/icon-152x152.png resize 152 152
sharp -i logo-source.png -o assets/icons/icon-192x192.png resize 192 192
sharp -i logo-source.png -o assets/icons/icon-384x384.png resize 384 384
sharp -i logo-source.png -o assets/icons/icon-512x512.png resize 512 512
```

**Icon Design Guidelines:**

- **Background**: Use brand color (#5CB5B0) or white
- **Logo**: Center the paw print logo
- **Safe area**: Keep important content 10% from edges
- **Maskable**: Design works with different shapes (circle, rounded square)
- **Format**: PNG with transparency
- **Optimization**: Compress with tools like TinyPNG

**Alternative: Use PWA Asset Generator**

```bash
# Install
npm install -g pwa-asset-generator

# Generate all icons and splash screens
pwa-asset-generator logo-source.png ./assets/icons --background "#5CB5B0" --padding "10%"
```

---

### 5. Splash Screens (iOS)

iOS requires additional meta tags for splash screens:

**File:** `src/index.html`

```html
<head>
  <!-- ... other tags ... -->
  
  <!-- iOS Splash Screens -->
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphone5_splash.png" 
        media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphone6_splash.png" 
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphoneplus_splash.png" 
        media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphonex_splash.png" 
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphonexr_splash.png" 
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/iphonexsmax_splash.png" 
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/ipad_splash.png" 
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/ipadpro1_splash.png" 
        media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/ipadpro3_splash.png" 
        media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)">
  <link rel="apple-touch-startup-image" 
        href="assets/splash/ipadpro2_splash.png" 
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">
  
  <!-- iOS Meta Tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Pet SOS">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
</head>
```

---

### 6. Install Prompt Component

**File:** `src/app/shared/components/install-prompt/install-prompt.component.ts`

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showPrompt()) {
      <div class="install-prompt" [@slideUp]>
        <div class="install-content">
          <div class="install-icon">
            <img src="assets/icons/icon-72x72.png" alt="Pet SOS">
          </div>
          <div class="install-text">
            <h3>Adicionar Pet SOS ao seu dispositivo</h3>
            <p>Acesso rápido direto da sua tela inicial</p>
          </div>
          <div class="install-actions">
            <button class="btn-install" (click)="install()">Instalar</button>
            <button class="btn-dismiss" (click)="dismiss()">Agora não</button>
          </div>
        </div>
        <button class="btn-close" (click)="dismiss()" aria-label="Fechar">
          <span>&times;</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .install-prompt {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      padding: 16px;
      animation: slideUp 0.3s ease-out;
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 600px;
      margin: 0 auto;
    }

    .install-icon img {
      width: 56px;
      height: 56px;
      border-radius: 12px;
    }

    .install-text {
      flex: 1;
      
      h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #2C2C2C;
      }
      
      p {
        margin: 0;
        font-size: 14px;
        color: #666666;
      }
    }

    .install-actions {
      display: flex;
      gap: 8px;
    }

    .btn-install {
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      
      &:hover {
        background: #4A9792;
      }
    }

    .btn-dismiss {
      background: transparent;
      color: #666666;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-weight: 500;
      
      &:hover {
        color: #2C2C2C;
      }
    }

    .btn-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 24px;
      color: #666666;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #2C2C2C;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    @media (max-width: 600px) {
      .install-content {
        flex-direction: column;
        text-align: center;
      }
      
      .install-actions {
        width: 100%;
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class InstallPromptComponent implements OnInit {
  showPrompt = signal(false);
  private deferredPrompt: any = null;

  ngOnInit() {
    // Check if already installed
    if (this.isStandalone()) {
      return;
    }

    // Check if user dismissed prompt before
    if (localStorage.getItem('installPromptDismissed')) {
      return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        this.showPrompt.set(true);
      }, 30000);
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.showPrompt.set(false);
      this.deferredPrompt = null;
    });
  }

  async install() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show install prompt
    this.deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install');
    } else {
      console.log('User dismissed install');
    }

    this.deferredPrompt = null;
    this.showPrompt.set(false);
  }

  dismiss() {
    this.showPrompt.set(false);
    localStorage.setItem('installPromptDismissed', 'true');
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }
}
```

**Usage:**

Add to `app.component.html`:
```html
<app-install-prompt></app-install-prompt>
<router-outlet></router-outlet>
```

---

### 7. Update Notifications

**File:** `src/app/core/services/pwa-update.service.ts`

```typescript
import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval, concat } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {}

  init() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Check for updates every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    );
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(() => {
      this.swUpdate.checkForUpdate();
    });

    // Listen for available updates
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
          this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
          });
        }
      }
    });

    // Listen for unrecoverable errors
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('Unrecoverable error:', event.reason);
      if (confirm('Erro no aplicativo. Recarregar página?')) {
        window.location.reload();
      }
    });
  }
}
```

**Initialize in App:**

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};

// app.component.ts
import { Component, OnInit } from '@angular/core';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private pwaUpdate: PwaUpdateService) {}

  ngOnInit() {
    this.pwaUpdate.init();
  }
}
```

---

### 8. Offline Fallback Page

**File:** `src/app/offline/offline.component.ts`

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-container">
      <div class="offline-content">
        <img src="assets/icons/icon-192x192.png" alt="Pet SOS" class="offline-logo">
        <h1>Sem conexão com a internet</h1>
        <p>Parece que você está offline. Verifique sua conexão e tente novamente.</p>
        <button class="btn-retry" (click)="retry()">Tentar Novamente</button>
        
        <div class="offline-info">
          <h3>O que você pode fazer offline:</h3>
          <ul>
            <li>Ver pets já carregados anteriormente</li>
            <li>Navegar pelo aplicativo</li>
            <li>Suas ações serão sincronizadas quando voltar online</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, #B8E3E1 0%, #FFFFFF 100%);
    }

    .offline-content {
      text-align: center;
      max-width: 500px;
    }

    .offline-logo {
      width: 120px;
      height: 120px;
      margin-bottom: 24px;
      filter: grayscale(100%) opacity(0.5);
    }

    h1 {
      color: #2C2C2C;
      margin-bottom: 12px;
    }

    p {
      color: #666666;
      font-size: 16px;
      margin-bottom: 24px;
    }

    .btn-retry {
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      
      &:hover {
        background: #4A9792;
      }
    }

    .offline-info {
      margin-top: 48px;
      text-align: left;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      h3 {
        color: #5CB5B0;
        margin-bottom: 16px;
      }
      
      ul {
        list-style: none;
        padding: 0;
        
        li {
          padding: 8px 0;
          padding-left: 24px;
          position: relative;
          
          &::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #5CB5B0;
            font-weight: bold;
          }
        }
      }
    }
  `]
})
export class OfflineComponent {
  retry() {
    window.location.reload();
  }
}
```

---

### 9. Network Status Detection

**File:** `src/app/core/services/network.service.ts`

```typescript
import { Injectable, signal } from '@angular/core';
import { fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  isOnline = signal(navigator.onLine);

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.isOnline.set(isOnline);
      
      if (isOnline) {
        this.showNotification('Conexão restaurada!', 'success');
      } else {
        this.showNotification('Você está offline', 'warning');
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'warning') {
    // Implement toast notification
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}
```

**Usage in Components:**

```typescript
import { Component, computed } from '@angular/core';
import { NetworkService } from '@core/services/network.service';

@Component({
  selector: 'app-home',
  template: `
    @if (!network.isOnline()) {
      <div class="offline-banner">
        <span>⚠️ Você está offline. Algumas funcionalidades podem estar limitadas.</span>
      </div>
    }
    
    <!-- rest of template -->
  `
})
export class HomeComponent {
  constructor(public network: NetworkService) {}
}
```

---

### 10. Build & Deployment

**Build PWA for Production:**

```bash
# Build with PWA enabled
ng build --configuration production

# Output will include:
# - ngsw-worker.js (Service Worker)
# - ngsw.json (Service Worker manifest)
# - All optimized assets
```

**Deployment Requirements:**

1. **HTTPS is mandatory** - PWAs only work over HTTPS
   - Use Let's Encrypt for free SSL certificates
   - Most hosting providers include SSL by default

2. **Proper MIME types** - Ensure server serves correct content types:
   ```nginx
   # nginx example
   types {
     application/manifest+json  webmanifest;
     application/javascript     js;
     text/css                   css;
   }
   ```

3. **Service Worker scope** - Deploy to root or configure scope:
   ```nginx
   # nginx - serve service worker at root
   location /ngsw-worker.js {
     add_header Cache-Control "no-cache";
     add_header Service-Worker-Allowed "/";
   }
   ```

4. **Cache headers** - Different strategies for different files:
   ```nginx
   # Cache static assets
   location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   
   # Don't cache HTML and service worker
   location ~* \.(html|json)$ {
     expires -1;
     add_header Cache-Control "no-store, no-cache, must-revalidate";
   }
   ```

**Vercel Deployment (Recommended):**

```json
// vercel.json
{
  "buildCommand": "ng build --configuration production",
  "outputDirectory": "dist/pet-sos/browser",
  "headers": [
    {
      "source": "/ngsw-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

---

### 11. Testing PWA

**Lighthouse Audit:**

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://petsos.com --view

# Or use Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to "Lighthouse" tab
# 3. Select "Progressive Web App"
# 4. Click "Generate report"
```

**PWA Checklist:**

- [ ] Manifest file present and valid
- [ ] Service worker registered
- [ ] HTTPS enabled
- [ ] Responsive design (works on all screen sizes)
- [ ] Fast load time (<3s on 3G)
- [ ] Works offline
- [ ] Installable (shows install prompt)
- [ ] App icons present (all sizes)
- [ ] Splash screens configured
- [ ] Theme color matches brand
- [ ] Lighthouse PWA score >90

**Manual Testing:**

1. **Desktop Chrome:**
   - Visit site
   - Look for install icon in address bar
   - Click and install
   - Verify app opens in standalone window

2. **Android Chrome:**
   - Visit site
   - Wait for "Add to Home Screen" prompt (or menu → "Install app")
   - Install and verify icon on home screen
   - Open and verify full-screen experience

3. **iOS Safari:**
   - Visit site
   - Tap Share button
   - Select "Add to Home Screen"
   - Verify icon and splash screen

4. **Offline Test:**
   - Open app
   - Open DevTools → Application → Service Workers
   - Check "Offline"
   - Refresh page
   - Verify offline functionality

---

### 12. Analytics for PWA

**Track PWA Installation:**

```typescript
// app.component.ts
window.addEventListener('appinstalled', (evt) => {
  // Track installation with analytics
  gtag('event', 'app_installed', {
    'event_category': 'PWA',
    'event_label': 'Home Screen'
  });
  
  console.log('App installed successfully');
});
```

**Track Display Mode:**

```typescript
// Track if user is using standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  gtag('event', 'display_mode', {
    'event_category': 'PWA',
    'event_label': 'Standalone'
  });
}
```

---

### 13. Push Notifications (Optional - Phase 2)

For future implementation of push notifications:

```typescript
// notification.service.ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        environment.vapidPublicKey
      )
    });

    return subscription;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
```

---

## PWA Success Metrics

**Technical Metrics:**
- Lighthouse PWA score: >90
- Install rate: >10% of visitors
- Offline functionality: 100% core features work
- Load time: <2s on 3G
- Service worker coverage: >80% of requests cached

**User Metrics:**
- Home screen installs: Track via analytics
- Retention: PWA users vs web users
- Engagement: Session length, pages per session
- Conversion: Adoption applications, donations

**Business Metrics:**
- Increased mobile engagement
- Reduced bounce rate on mobile
- Higher conversion rates
- Lower user acquisition cost (no app store)

---

## Screen-by-Screen Implementation Guide

### 1. Login Screen (`/login`)

**Design Reference:** Page 1 of PDF

**Features:**
- Email input field
- Password input field (with show/hide toggle)
- "Esqueceu sua senha?" link
- "LOGIN" button
- "Ainda não tem uma conta? Cadastre aqui" link
- Pet paw print logo with "lorem ipsum" text

**Components:**
- `LoginComponent`
- `FormFieldComponent` (reusable)
- `ButtonComponent` (reusable)

**Validation:**
- Email: required, valid email format
- Password: required, minimum 6 characters
- Show error messages below fields
- Disable button while submitting
- Show loading spinner on button during API call

**API Integration:**
- POST `/api/auth/login`
- On success: Store JWT in localStorage/sessionStorage
- Navigate to `/home` or `/primeiro-acesso` if first login
- On error: Display error message

---

### 2. Registration Screen (`/cadastrar`)

**Design Reference:** Page 2 of PDF

**Features:**
- Profile image upload with camera icon
- Paw print decorative elements
- Nome da ONG input
- Email input
- Senha input
- Repetir senha input
- "CADASTRAR" button
- "Voltar" link

**Components:**
- `RegisterComponent`
- `ImageUploadComponent`

**Validation:**
- All fields required
- Email: valid format, check if already exists
- Password: minimum 8 characters, must match confirmation
- ONG name: minimum 3 characters
- Show password strength indicator
- Real-time validation feedback

**API Integration:**
- POST `/api/auth/register`
- On success: Auto-login and navigate to `/primeiro-acesso`
- On error: Display specific error (email exists, weak password, etc.)

---

### 3. Forgot Password Screen (`/esqueceu-senha`)

**Design Reference:** Page 3 of PDF

**Features:**
- "Esqueceu sua senha?" heading in teal
- Reassuring message: "Não se preocupe, isso acontece."
- Instruction text
- Email input field with @ icon
- "ENVIAR" button
- "Voltar" link
- Decorative paw prints

**Components:**
- `ForgotPasswordComponent`

**Flow:**
1. User enters email
2. System sends reset link via email
3. Show success message
4. User clicks link in email → redirects to reset password page

---

### 4. First Access / Onboarding (`/primeiro-acesso`)

**Design Reference:** Page 4 of PDF

**Features:**
- "Primeiro acesso" heading
- Empty state with placeholder boxes
- Profile icon in top right
- Bottom navigation: HOME | Middle button (paw) | DOAR

**Purpose:**
- Welcome new NGOs
- Guide through adding first pet
- Show empty state before content

**Components:**
- `FirstAccessComponent`
- `BottomNavigationComponent` (reusable)

**Actions:**
- Button to add first pet
- Tutorial/guide overlay (optional)

---

### 5. Home Screen (`/home`)

**Design Reference:** Page 5 of PDF

**Features:**
- Personalized greeting: "Hello, João"
- Location selector: "Lisboa, Portugal" with pin icon and search icon
- Pet type filters: Dog (selected) | Cat | Fish | Hamster
- Pet cards with:
  - Large pet image
  - Pet name (e.g., "Plutão")
  - Location with pin icon
  - Gender icon (male/female)
  - Size icon with label (e.g., "Grande")
  - Age with smiley icon (e.g., "3 anos")
  - Shelter icon with ONG name
  - Description preview (lorem ipsum)
  - "SABER MAIS" button
- Bottom navigation: HOME (active) | Paw button | DOAR

**Components:**
- `HomeComponent`
- `LocationSelectorComponent`
- `PetFilterComponent`
- `PetCardComponent`
- `BottomNavigationComponent`

**Functionality:**
- Infinite scroll or pagination
- Pull-to-refresh
- Filter by species (tabs)
- Search by location (opens location picker)
- Click card → navigate to pet detail
- Profile icon → navigate to profile

**API Integration:**
- GET `/api/pets?location=Lisboa&species=dog`
- Real-time filtering
- Cache results for better performance

---

### 6. Pet Detail Screen (`/pets/:id`)

**Design Reference:** Page 6 of PDF

**Features:**
- Back button with title "Conhecendo, Plutão! :)"
- Image carousel (swipe left/right indicators)
- Pet info banner: "Border collie | 3 anos | 6 kg"
- Full description text (scrollable)
- ONG information card:
  - Shelter name: "Cantinho dos Animais"
  - Distance: "4.2 km"
  - Rating: "5" with star icon
  - Phone icon button
  - Location icon button
- Large "AGENDAR VISITA" button
- Bottom navigation

**Components:**
- `PetDetailComponent`
- `ImageCarouselComponent`
- `OngInfoCardComponent`

**Functionality:**
- Swipe through multiple pet images
- Phone icon → open dialer with shelter phone
- Location icon → open maps with shelter address
- "AGENDAR VISITA" → open appointment modal/page
- Favorite/heart icon (add to wishlist)

**API Integration:**
- GET `/api/pets/:id`
- POST `/api/favorites` (when heart clicked)

---

### 7. Add Pet Screen (`/pets/adicionar`)

**Design Reference:** Page 7 of PDF

**Features:**
- "Adicionar Pet" heading
- Form fields:
  - Nome ONG (pre-filled, read-only)
  - Localização
  - Nome do pet
  - Cor
  - Tamanho do pet (dropdown)
  - Gênero (dropdown with checkmark)
  - Idade (dropdown with checkmark)
  - Description textarea: "Descreva brevemente algo sobre o seu pet :)"
- "SALVAR" button
- "Cancelar" link
- Image upload area (not visible in this view but implied)
- Bottom navigation

**Components:**
- `AddPetComponent`
- `FormFieldComponent`
- `DropdownComponent`
- `TextareaComponent`

**Validation:**
- All fields required except description
- Name: min 2 characters
- Age: 0-30 years
- Description: max 500 characters
- Image: at least 1 required, max 5 images

**API Integration:**
- POST `/api/pets` with multipart/form-data
- On success: Navigate to pet detail or home
- Show success toast message

---

### 8. ONG Information Screen (`/ong/:id`)

**Design Reference:** Page 8 of PDF

**Features:**
- "Mais sobre a ONG" heading
- Information cards (light teal background):
  - Building icon + ONG name
  - Email icon + email address
  - Phone icon + phone number
  - Instagram icon + instagram handle
- "Voltar" link
- Bottom navigation

**Components:**
- `OngInfoComponent`
- `InfoCardComponent`

**Functionality:**
- Email card → open email client
- Phone card → open dialer
- Instagram card → open Instagram app/web
- All cards are tappable with visual feedback

---

### 9. Profile Screen (`/perfil`)

**Design Reference:** Page 9 of PDF

**Features:**
- "Meu perfil" heading
- "Perfil" subheading
- Large empty profile area (for future profile image)
- "CADASTRAR" button
- "Voltar" link
- Bottom navigation

**Purpose:**
- View/edit NGO profile
- Upload profile photo
- Update contact information

**Components:**
- `ProfileComponent`
- `ImageUploadComponent`

---

### 10. Pets Management Screen (`/pets/gerenciar`)

**Design Reference:** Page 10 of PDF

**Features:**
- "Pets" heading
- "O que gostaria de fazer?" subheading
- Two action buttons:
  - "ADICIONAR PET" (teal, with + icon)
  - "ATUALIZAR PET" (gray, with refresh icon)
- Bottom navigation

**Components:**
- `PetsManagementComponent`

**Functionality:**
- "ADICIONAR PET" → navigate to `/pets/adicionar`
- "ATUALIZAR PET" → show list of existing pets to select for editing

---

### 11. Donation Screen (`/doar`)

**Design Reference:** Page 11 of PDF

**Features:**
- "Doar" heading
- Toggle buttons: "ÚNICA" | "MENSAL"
- Personal information section:
  - Valor da contribuição
  - Nome
  - CPF
  - E-mail
  - Data de Nascimento | Sexo (side by side)
- "Dados do cartão" section heading
  - Nome do cartão
  - Número do cartão
  - (Additional card fields implied: expiry, CVV)
- Payment button (not visible but implied)
- Bottom navigation: HOME | Paw | DOAR (active)

**Components:**
- `DonationComponent`
- `ToggleButtonComponent`
- `CreditCardFormComponent`

**Validation:**
- Amount: required, minimum 5.00
- CPF: valid Brazilian CPF format (optional for Portuguese version)
- Credit card: use Stripe Elements for PCI compliance
- All personal fields required

**API Integration:**
- POST `/api/donations`
- Integrate with Stripe/payment gateway
- Show confirmation screen on success
- Email receipt to donor

**Security:**
- Never store full credit card numbers
- Use tokenization (Stripe)
- HTTPS only
- Input sanitization

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

**Font Family:**
- Primary: Sans-serif (Roboto, Open Sans, or similar)
- Headings: Medium to Bold weight
- Body: Regular weight

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
- Disabled: Light gray background, dark gray text
- Height: 48px minimum (touch-friendly)
- Full-width on mobile

**Input Fields:**
- Light teal background (#B8E3E1)
- No border in default state
- Height: 48px minimum
- Border radius: 8px
- Dark placeholder text
- Focus state: Add teal border

**Cards:**
- White background
- Border radius: 12px
- Box shadow: subtle (0 2px 8px rgba(0,0,0,0.1))
- Padding: 16px
- Hover state: slight lift effect

**Icons:**
- Size: 24px for standard icons
- Color: Teal for active, gray for inactive
- Use outlined style for consistency

### Decorative Elements

**Paw Prints:**
- Scatter throughout background
- Light teal color (#B8E3E1)
- Semi-transparent (opacity: 0.3-0.5)
- Various sizes for visual interest
- Don't interfere with readability

### Responsive Design

**Breakpoints:**
- Mobile: 320px - 767px (primary focus)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile-First Approach:**
- Design for mobile first
- Progressively enhance for larger screens
- Touch-friendly targets (minimum 48x48px)
- Single column layout on mobile
- Bottom navigation fixed on mobile
- Top navigation on desktop

---

## Core Features Implementation

### 1. Authentication System

**Requirements:**
- JWT-based authentication
- Password hashing with bcrypt (min 10 rounds)
- Email verification (optional but recommended)
- Password reset flow via email
- Token expiration (7 days recommended)
- Refresh token mechanism (optional)

**Implementation:**
```typescript
// NestJS Guard Example
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// Usage in controller
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

---

### 2. Image Upload & Storage

**Requirements:**
- Support multiple image formats (JPEG, PNG, WebP)
- Maximum file size: 5MB per image
- Automatic image optimization/compression
- Thumbnail generation (300x300px)
- Multiple images per pet (max 5)
- Secure file naming (UUID)
- CDN delivery (recommended)

**Implementation Options:**

**Option A: AWS S3**
```typescript
// Upload service
async uploadPetImage(file: Express.Multer.File, petId: string): Promise<string> {
  const fileName = `pets/${petId}/${uuidv4()}.${file.originalname.split('.').pop()}`;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };
  
  await this.s3.upload(params).promise();
  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}
```

**Option B: Cloudinary**
```typescript
async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: 'pet-sos', transformation: { width: 800, crop: 'limit' } },
      (error, result) => {
        if (error) reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(upload);
  });
}
```

---

### 3. Location & Distance Calculation

**Requirements:**
- Store latitude/longitude for NGOs and searches
- Calculate distance between user and shelters
- Display in kilometers
- Sort results by distance
- Integrate with Google Maps API

**Implementation:**
```typescript
// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}
```

**PostgreSQL Query with Distance:**
```sql
SELECT 
  p.*,
  u.ong_name,
  u.location,
  (
    6371 * acos(
      cos(radians($1)) * cos(radians(u.latitude)) *
      cos(radians(u.longitude) - radians($2)) +
      sin(radians($1)) * sin(radians(u.latitude))
    )
  ) AS distance
FROM pets p
JOIN users u ON p.ong_id = u.id
WHERE p.status = 'available'
ORDER BY distance ASC
LIMIT 20;
```

---

### 4. Payment Processing (Stripe Integration)

**Requirements:**
- PCI DSS compliance (use Stripe Elements)
- One-time and recurring donations
- Euro currency support
- Receipt generation
- Webhook handling for payment events
- Refund capability (admin)

**Frontend Integration:**
```typescript
// Angular component
import { loadStripe } from '@stripe/stripe-js';

async processPayment(amount: number, donationType: string) {
  const stripe = await loadStripe('pk_test_...');
  
  const response = await this.http.post('/api/donations/create-payment-intent', {
    amount,
    donationType
  }).toPromise();
  
  const { clientSecret } = response;
  
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: this.cardElement,
      billing_details: {
        name: this.form.value.cardHolderName,
      },
    },
  });
  
  if (result.error) {
    // Show error
  } else {
    // Payment successful
  }
}
```

**Backend Integration:**
```typescript
// NestJS service
async createPaymentIntent(amount: number, donationType: string) {
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'eur',
    metadata: {
      donationType,
    },
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
  };
}

// Webhook handler
@Post('webhook')
async handleWebhook(@Req() req: Request) {
  const sig = req.headers['stripe-signature'];
  const event = this.stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await this.handlePaymentFailure(event.data.object);
      break;
  }
}
```

---

### 5. Email Notifications

**Use Cases:**
- Welcome email after registration
- Password reset link
- Appointment confirmation (to visitor and NGO)
- Donation receipt
- New pet alert (optional newsletter feature)

**Implementation with SendGrid:**
```typescript
async sendAppointmentConfirmation(appointment: Appointment) {
  const msg = {
    to: appointment.visitorEmail,
    from: 'noreply@petsos.com',
    subject: 'Confirmação de Visita - Pet SOS',
    html: `
      <h1>Olá ${appointment.visitorName}!</h1>
      <p>Sua visita para conhecer <strong>${appointment.pet.name}</strong> foi confirmada!</p>
      <p><strong>Data:</strong> ${appointment.preferredDate}</p>
      <p><strong>Hora:</strong> ${appointment.preferredTime}</p>
      <p><strong>Local:</strong> ${appointment.ong.name}, ${appointment.ong.location}</p>
      <p>Aguardamos você!</p>
    `,
  };
  
  await this.sendgrid.send(msg);
}
```

---

### 6. Search & Filtering System

**Features:**
- Filter by species (dog, cat, fish, hamster)
- Filter by size (small, medium, large)
- Filter by gender (male, female)
- Filter by age range
- Filter by location (city/region)
- Sort by: distance, age, date added
- Free text search (name, breed, description)

**Implementation:**
```typescript
// QueryBuilder approach
async searchPets(filters: PetSearchDto): Promise<Pet[]> {
  const query = this.petRepository
    .createQueryBuilder('pet')
    .leftJoinAndSelect('pet.ong', 'ong')
    .leftJoinAndSelect('pet.images', 'images')
    .where('pet.status = :status', { status: 'available' });
  
  if (filters.species) {
    query.andWhere('pet.species = :species', { species: filters.species });
  }
  
  if (filters.size) {
    query.andWhere('pet.size = :size', { size: filters.size });
  }
  
  if (filters.gender) {
    query.andWhere('pet.gender = :gender', { gender: filters.gender });
  }
  
  if (filters.ageMin) {
    query.andWhere('pet.age >= :ageMin', { ageMin: filters.ageMin });
  }
  
  if (filters.ageMax) {
    query.andWhere('pet.age <= :ageMax', { ageMax: filters.ageMax });
  }
  
  if (filters.location) {
    query.andWhere('ong.location ILIKE :location', { 
      location: `%${filters.location}%` 
    });
  }
  
  if (filters.search) {
    query.andWhere(
      '(pet.name ILIKE :search OR pet.breed ILIKE :search OR pet.description ILIKE :search)',
      { search: `%${filters.search}%` }
    );
  }
  
  return query
    .skip(filters.page * filters.limit)
    .take(filters.limit)
    .getMany();
}
```

---

## Security Best Practices

### 1. Authentication & Authorization
- Use HTTPS only in production
- Implement JWT with short expiration times
- Hash passwords with bcrypt (cost factor 10+)
- Implement rate limiting on auth endpoints
- Add CAPTCHA on registration/login (optional)
- Validate JWT on every protected route
- Use refresh tokens for better UX

### 2. Data Validation
- Validate all input on backend (never trust client)
- Use class-validator decorators
- Sanitize user input to prevent XSS
- Implement SQL injection prevention (ORM parameterized queries)
- Validate file uploads (type, size, content)
- Use DTOs for all API endpoints

### 3. API Security
- Implement CORS properly
- Use Helmet.js for HTTP headers
- Rate limiting (express-rate-limit)
- Request size limits
- API versioning
- Input validation middleware

### 4. Database Security
- Use environment variables for credentials
- Implement database connection pooling
- Regular backups
- Encryption at rest (for sensitive data)
- Principle of least privilege for DB users
- Prepared statements only

### 5. File Upload Security
- Validate file types (whitelist approach)
- Scan for malware (optional: ClamAV)
- Store outside web root
- Generate secure random filenames
- Size limits enforced
- Content-Type verification

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
- **Install Flow:**
  - Test install prompt appears
  - Test installation on different devices
  - Verify home screen icon appears correctly
  - Verify splash screen displays
  
- **Offline Functionality:**
  - Test app loads offline
  - Verify cached content displays
  - Test offline fallback pages
  - Verify data syncs when back online
  
- **Service Worker:**
  - Test service worker registration
  - Verify caching strategies work
  - Test update notifications
  - Test cache invalidation
  
- **Lighthouse Audit:**
  - PWA score > 90
  - Performance score > 85
  - Accessibility score > 90
  - Best Practices score > 90
  - SEO score > 85

- **Cross-Platform:**
  - Test on iOS Safari (iPhone, iPad)
  - Test on Android Chrome
  - Test on Desktop Chrome
  - Test on Desktop Firefox
  - Verify responsive design on all devices

### Test Data
- Create seed scripts for development
- Use factories for test data generation
- Reset database between test runs

---

## Deployment & DevOps

### Environment Setup

**Development:**
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/petsos_dev
JWT_SECRET=dev_secret_key_change_in_production
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=petsos-dev
SENDGRID_API_KEY=...
```

**Production:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/petsos
JWT_SECRET=<strong_random_secret>
STRIPE_SECRET_KEY=sk_live_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=petsos-production
SENDGRID_API_KEY=...
SENTRY_DSN=... (error tracking)
```

### Deployment Options

**Option 1: Railway/Render (Simplest)**
- Git-based deployment
- Automatic SSL
- Managed PostgreSQL
- Environment variables via dashboard

**Option 2: AWS (Scalable)**
- EC2 or ECS for backend
- RDS for PostgreSQL
- S3 for file storage
- CloudFront for CDN
- Route 53 for DNS

**Option 3: DigitalOcean (Balanced)**
- App Platform for backend
- Managed Databases
- Spaces for object storage

### CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Run linter
        run: npm run lint
      - name: Run Lighthouse CI (PWA Audit)
        run: |
          npm install -g @lhci/cli
          lhci autorun --collect.url=http://localhost:4200
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build PWA
        run: npm run build --configuration production
      - name: Verify Service Worker
        run: |
          if [ ! -f dist/pet-sos/browser/ngsw-worker.js ]; then
            echo "Service Worker not found!"
            exit 1
          fi
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: pwa-build
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: pwa-build
      - name: Deploy to Vercel (Frontend PWA)
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Backend to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
  post-deploy:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Run Production Lighthouse Audit
        run: |
          lhci autorun --collect.url=https://petsos.com
      - name: Verify PWA Installation
        run: |
          # Check manifest is accessible
          curl -f https://petsos.com/manifest.webmanifest || exit 1
          # Check service worker is accessible
          curl -f https://petsos.com/ngsw-worker.js || exit 1
```

**PWA Deployment Checklist:**
- [ ] Build includes service worker (ngsw-worker.js)
- [ ] Build includes manifest (manifest.webmanifest)
- [ ] All icons generated and included
- [ ] HTTPS enabled on hosting platform
- [ ] Service worker served with correct MIME type
- [ ] Cache-Control headers properly configured
- [ ] Lighthouse CI passing (PWA score > 90)

---

## Performance Optimization

### Frontend
- Lazy loading for routes
- Image optimization (WebP, responsive images)
- Implement virtual scrolling for large lists
- Service Worker for offline capability (PWA)
- Bundle size optimization
- CDN for static assets

### Backend
- Database query optimization (indexes on foreign keys, search fields)
- Implement caching (Redis for sessions, frequently accessed data)
- Pagination for all list endpoints
- Connection pooling
- Compression middleware (gzip)
- Rate limiting per user

### Database Indexes
```sql
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_location ON pets USING GIST(location);
CREATE INDEX idx_pets_ong_id ON pets(ong_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_donations_ong_id ON donations(ong_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
```

---

## Analytics & Monitoring

### Key Metrics to Track
- Total pets listed
- Total adoptions (appointments completed)
- Total donations received
- User registrations (NGOs)
- Page views per pet
- Conversion rates (view → appointment)
- Average donation amount
- Geographic distribution of users

### Tools
- **Application Monitoring:** Sentry (error tracking)
- **Analytics:** Google Analytics 4 or Plausible (privacy-friendly)
- **Uptime Monitoring:** UptimeRobot or Pingdom
- **Performance:** New Relic or DataDog

### Custom Events to Track
```typescript
// Example: Track pet view
analytics.track('Pet Viewed', {
  petId: pet.id,
  petName: pet.name,
  species: pet.species,
  ongId: pet.ong.id,
  ongName: pet.ong.name,
});

// Track appointment scheduled
analytics.track('Appointment Scheduled', {
  petId: appointment.petId,
  ongId: appointment.ongId,
});

// Track donation
analytics.track('Donation Completed', {
  amount: donation.amount,
  type: donation.donationType,
  ongId: donation.ongId,
});
```

---

## Future Enhancements

### Phase 2 Features
1. **Admin Dashboard**
   - Analytics overview
   - User management
   - Content moderation
   - Featured pets

2. **Advanced Search**
   - Saved searches
   - Email alerts for new matching pets
   - Compatibility quiz (matches users with ideal pets)

3. **Social Features**
   - Share pets on social media
   - Success stories section
   - Testimonials from adopters

4. **Messaging System**
   - In-app chat between adopters and NGOs
   - Notification system
   - Message history

5. **Mobile Apps**
   - Native iOS app
   - Native Android app
   - Push notifications

6. **Volunteer System**
   - Volunteer registration
   - Shift scheduling
   - Hour tracking

7. **Adoption Process Management**
   - Application forms
   - Background checks
   - Adoption contracts (digital signatures)
   - Post-adoption follow-ups

8. **Multi-language Support**
   - Portuguese (PT & BR)
   - English
   - Spanish

---

## Documentation Requirements

### For Developers
- API documentation (Swagger/OpenAPI)
- Database schema diagram
- Setup instructions (README.md)
- Contributing guidelines
- Code style guide

### For Users (NGOs)
- User manual (PDF or web-based)
- Video tutorials
- FAQ section
- Support contact information

---

## Accessibility (A11Y) Guidelines

### Requirements
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (4.5:1 for text)
- Alt text for all images
- ARIA labels where needed
- Focus indicators
- Error messages read by screen readers

### Implementation
```html
<!-- Example: Accessible button -->
<button 
  aria-label="Agendar visita para conhecer Plutão"
  class="btn-primary"
  type="button">
  AGENDAR VISITA
</button>

<!-- Example: Accessible form field -->
<label for="pet-name">Nome do Pet</label>
<input 
  id="pet-name"
  type="text"
  aria-required="true"
  aria-describedby="pet-name-error">
<span id="pet-name-error" role="alert" aria-live="polite">
  <!-- Error message appears here -->
</span>
```

---

## Legal & Compliance

### Required Pages
1. **Terms of Service**
   - User responsibilities
   - Prohibited uses
   - Account termination
   - Liability limitations

2. **Privacy Policy**
   - Data collection practices
   - Data usage
   - Data sharing (third parties)
   - User rights (GDPR/LGPD compliance)
   - Cookie policy

3. **Cookie Consent**
   - Banner on first visit
   - Essential vs. analytics cookies
   - Opt-in for non-essential cookies

### Data Protection (GDPR/LGPD)
- Right to access data
- Right to deletion
- Right to data portability
- Consent management
- Data breach notification procedures
- Data retention policies

### Content Moderation
- Report inappropriate content
- NGO verification process (optional)
- Community guidelines
- Content review process

---

## Success Criteria

### Technical Metrics
- Page load time < 2 seconds
- API response time < 200ms (p95)
- 99.9% uptime
- Zero critical security vulnerabilities
- Mobile responsive (100% screens)

### Business Metrics
- 100+ NGOs registered (3 months)
- 1000+ pets listed (3 months)
- 500+ appointments scheduled (3 months)
- €10,000+ in donations (6 months)
- 50% conversion rate (view → appointment)

---

## Project Timeline Estimate

### Phase 1: Core MVP (8-10 weeks)
- **Week 1-2:** Project setup, database design, authentication
- **Week 3-4:** Pet listing CRUD, image upload, home screen
- **Week 5-6:** Pet detail, search/filter, appointment booking
- **Week 7-8:** Donation integration, NGO profile
- **Week 9-10:** Testing, bug fixes, deployment

### Phase 2: Polish & Launch (4-6 weeks)
- **Week 11-12:** UI/UX refinements, performance optimization
- **Week 13-14:** Email notifications, analytics integration
- **Week 15-16:** Beta testing, documentation, marketing prep

### Phase 3: Post-Launch (Ongoing)
- Feature enhancements
- User feedback implementation
- Marketing campaigns
- Partnership development

---

## Team Composition Recommendation

### Minimum Viable Team
- **1 Full-Stack Developer** (NestJS + Angular)
- **1 UI/UX Designer** (part-time)
- **1 Project Manager** (part-time)

### Ideal Team
- **1 Backend Developer** (NestJS specialist)
- **1 Frontend Developer** (Angular specialist)
- **1 UI/UX Designer**
- **1 DevOps Engineer** (part-time)
- **1 QA Engineer** (part-time)
- **1 Product Manager**

---

## Contact & Support

### For Development Issues
- GitHub Issues: [repo-url]
- Technical Documentation: [docs-url]
- Slack Channel: #pet-sos-dev

### For Business Questions
- Product Manager: [email]
- Stakeholder: [email]

---

## Appendix

### A. API Response Standards

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### B. Environment Variables List

```bash
# Application
NODE_ENV=development|production
PORT=3000
FRONTEND_URL=http://localhost:4200

# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRATION=7d

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=petsos
AWS_REGION=eu-west-1

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@petsos.com

# Google Maps
GOOGLE_MAPS_API_KEY=...

# Monitoring
SENTRY_DSN=...
```

### C. Useful Commands

```bash
# Development
npm run start:dev     # Start backend in watch mode
npm run start:frontend # Start Angular dev server

# Database
npm run migration:generate -- MigrationName
npm run migration:run
npm run seed

# Testing
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:cov      # Generate coverage report

# Production
npm run build         # Build for production
npm run start:prod    # Start production server

# Linting
npm run lint          # Lint code
npm run format        # Format code with Prettier
```

---

## Conclusion

This CLAUDE.md file provides comprehensive specifications for implementing the Pet SOS platform. The agents should:

1. Start with authentication and database setup
2. Implement core pet listing features
3. Add search and filtering
4. Integrate payment processing
5. Polish UI/UX
6. Thoroughly test
7. Deploy to production

**Remember:** This is a platform to help animals find homes. Every feature should be designed with the goal of making adoption easier, more transparent, and more successful.

**Questions?** Refer to this document first, then consult with the product owner for clarifications on business logic or priorities.

---

**Document Version:** 1.0  
**Last Updated:** November 2, 2025  
**Maintained By:** Pet SOS Development Team

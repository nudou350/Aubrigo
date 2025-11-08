# Multi-Country Support - Aubrigo

## Overview

Aubrigo now supports multiple countries! Users will automatically see only the pets and ONGs from their country, creating a localized experience.

## Features Implemented

### 🌍 Automatic Country Detection
- The system automatically detects the user's country when they access the site
- Detection methods (in order of preference):
  1. CloudFront headers (`cloudfront-viewer-country`)
  2. Cloudflare headers (`cf-ipcountry`)
  3. Accept-Language header
  4. Default to Portugal (PT)

### 🔍 Country-Based Filtering
- **Pets**: Only pets from the user's country are displayed
- **ONGs**: Only ONGs from the user's country are shown
- **Cities**: City list filtered by country
- **Login**: Users can login from any country but see only their country's data

### 🎨 Country Selector Component
- Beautiful typeahead component with flag emojis
- Search functionality with maximum 5 results visible
- Keyboard navigation support (Arrow keys, Enter, Escape)
- Located in user profile for easy access
- Page automatically reloads after country change to apply filters

## Database Changes

### New Field: `country_code`

Added to the following tables:
- `users` - ISO 3166-1 alpha-2 country code (2 characters)
- `ongs` - ISO 3166-1 alpha-2 country code (2 characters)
- `pets` - ISO 3166-1 alpha-2 country code (2 characters)

### Migration

File: `backend/src/database/migrations/1736300000000-AddCountryCodeSupport.ts`

- Adds `country_code` column to users, ongs, and pets tables
- Sets default value to 'PT' for existing records
- Creates indexes for better query performance

### Indexes Created

```sql
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_ongs_country_code ON ongs(country_code);
CREATE INDEX idx_pets_country_code ON pets(country_code);
```

## Backend Implementation

### 1. Country Service (`backend/src/country/`)

**Files:**
- `country.service.ts` - Core country detection and search logic
- `country.controller.ts` - REST API endpoints
- `country.module.ts` - Module configuration

**API Endpoints:**
- `GET /api/country/detect` - Detects user's country from request headers
- `GET /api/country/all` - Returns list of all available countries
- `GET /api/country/search?q={query}&limit={limit}` - Search countries

**Supported Countries:**
- Portugal 🇵🇹
- Brasil 🇧🇷
- España 🇪🇸
- France 🇫🇷
- Italia 🇮🇹
- Deutschland 🇩🇪
- United Kingdom 🇬🇧
- United States 🇺🇸
- Canada 🇨🇦
- México 🇲🇽
- Argentina 🇦🇷
- Chile 🇨🇱
- Colombia 🇨🇴
- And many more... (40+ countries total)

### 2. Updated Entities

**User Entity:**
```typescript
@Column({ name: 'country_code', length: 2, default: 'PT' })
countryCode: string;
```

**Ong Entity:**
```typescript
@Column({ name: 'country_code', length: 2, default: 'PT' })
countryCode: string;
```

**Pet Entity:**
```typescript
@Column({ name: 'country_code', length: 2, default: 'PT' })
countryCode: string;
```

### 3. Updated DTOs

Added `countryCode` field to:
- `RegisterUserDto`
- `RegisterOngDto`
- `CreatePetDto`
- `SearchPetsDto`

### 4. Updated Services

**AuthService:**
- Automatically detects and assigns country code during registration
- Uses CountryService for detection if country not provided

**PetsService:**
- Filters pets by country code in search queries
- Auto-assigns ONG's country code to new pets
- `getCitiesWithPets()` now accepts optional country code

## Frontend Implementation

### 1. Country Service (`frontend/src/app/core/services/country.service.ts`)

**Features:**
- Uses Angular signals for reactive state management
- Stores selected country in localStorage
- Automatic country detection on app initialization
- Search functionality for countries

**Key Methods:**
```typescript
detectCountry(): Observable<any>
getAllCountries(): Observable<Country[]>
searchCountries(query: string, limit: number): Observable<Country[]>
setCountry(countryCode: string): void
getCountry(): string
```

### 2. Country Selector Component

**Location:** `frontend/src/app/shared/components/country-selector/`

**Features:**
- Standalone Angular component
- Typeahead search with 5 result limit
- Flag emojis for visual identification
- Keyboard navigation support
- Responsive design
- Auto-reload on country change

**Styling:**
- Matches Aubrigo design system
- Teal color scheme (#5CB5B0)
- Light teal backgrounds (#B8E3E1)
- Mobile-responsive

### 3. Updated Services

**PetsService:**
- Automatically includes current country code in all search requests
- `getCitiesWithPets()` filters by country
- Injects CountryService to get current country

### 4. Profile Integration

The country selector is integrated into the user profile page:
- Located between "My Favorites" and "Change Password" sections
- Accessible to all users (both regular users and ONGs)
- Clear description of functionality

## Usage

### For Users

1. **Automatic Detection:**
   - Visit the site - your country is automatically detected
   - See only pets and ONGs from your country

2. **Manual Selection:**
   - Go to your Profile
   - Find the "País / Country" section
   - Search or select your country
   - Page reloads with filtered content

### For Developers

**Backend - Filter by Country:**
```typescript
// Automatic filtering in PetsService
const pets = await this.petsService.search({
  species: 'dog',
  // countryCode is automatically added
});
```

**Frontend - Using CountryService:**
```typescript
constructor(private countryService: CountryService) {}

ngOnInit() {
  // Get current country
  const country = this.countryService.getCountry();

  // Listen to country changes
  effect(() => {
    const currentCountry = this.countryService.currentCountry();
    console.log('Country changed:', currentCountry);
  });
}
```

**Creating a Pet (Automatic Country Assignment):**
```typescript
// Frontend - no need to specify country
this.petsService.createPet(petFormData).subscribe(...);

// Backend - country is automatically assigned from ONG
const pet = await this.petsService.create(createPetDto, userId, imageUrls);
```

## Testing Checklist

- [x] User registration auto-detects country
- [x] ONG registration auto-detects country
- [x] Pet search filters by country
- [x] City list filters by country
- [x] Country selector shows in profile
- [x] Country selector search works
- [x] Country selector keyboard navigation works
- [x] Page reloads after country change
- [x] Pets inherit ONG's country code
- [x] Existing data defaults to 'PT'

## Migration Guide

### Running the Migration

```bash
# Backend
cd backend
npm run migration:run
```

### Seeding Test Data

To test multi-country support:

1. Create ONGs in different countries
2. Create pets for each ONG (they inherit the ONG's country)
3. Switch countries in profile to see filtered results

### Rollback (if needed)

```bash
cd backend
npm run migration:revert
```

## Future Enhancements

1. **IP Geolocation Service:**
   - Integrate with MaxMind GeoIP2 or similar
   - More accurate country detection
   - Fallback to current method if API fails

2. **Language Localization:**
   - Translate interface based on country
   - Multi-language support (pt-PT, pt-BR, en-US, es-ES, etc.)

3. **Country-Specific Features:**
   - Different currencies for donations
   - Country-specific regulations
   - Localized phone number formats

4. **Analytics:**
   - Track usage by country
   - Popular countries
   - Cross-border interest

## Technical Notes

### Why Country Code at Entity Level?

- **Data Isolation:** Ensures data sovereignty and privacy
- **Performance:** Indexed queries are faster than filtering in application
- **Simplicity:** Clean separation of data by country
- **Scalability:** Easy to add country-specific features later

### Why Auto-Detection?

- **User Experience:** No manual selection needed on first visit
- **Accuracy:** Most users will be in their home country
- **Convenience:** Reduces friction in onboarding

### Why Page Reload After Country Change?

- **Data Consistency:** Ensures all components use the new country
- **Simplicity:** Avoids complex state synchronization
- **User Expectation:** Clear indication that content has changed

## Support

For questions or issues with multi-country support:
- Check the code in `backend/src/country/` and `frontend/src/app/core/services/country.service.ts`
- Review the migration file: `backend/src/database/migrations/1736300000000-AddCountryCodeSupport.ts`
- Test the country selector in the profile page

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Author:** Aubrigo Development Team

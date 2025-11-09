export interface CityConfig {
  countryCode: string;
  countryName: string;
  loader: () => Promise<{ cities: string[] }>;
}

export const CITY_CONFIGS: Record<string, CityConfig> = {
  PT: {
    countryCode: 'PT',
    countryName: 'Portugal',
    loader: () => import('./portugal-cities').then(m => ({ cities: m.PORTUGAL_CITIES }))
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    loader: () => import('./brazil-cities').then(m => ({ cities: m.BRAZIL_CITIES }))
  }
};

// Fallback country if detection fails
export const DEFAULT_COUNTRY = 'PT';

// Check if a country is supported
export function isSupportedCountry(countryCode: string): boolean {
  return countryCode in CITY_CONFIGS;
}

// Get supported country codes
export function getSupportedCountries(): string[] {
  return Object.keys(CITY_CONFIGS);
}

import { Injectable } from '@nestjs/common';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

@Injectable()
export class CountryService {
  private readonly countries: Country[] = [
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: 'ES', name: 'España', flag: '🇪🇸' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italia', flag: '🇮🇹' },
    { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
    { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  ];

  /**
   * Detect country from IP address or request headers
   * This is a simplified implementation - in production, you would use a service like
   * ipapi.co, ip-api.com, or MaxMind GeoIP2
   */
  detectCountryFromRequest(req: any): string {
    console.log('=== Country Detection Debug ===');
    console.log('CloudFront header:', req.headers['cloudfront-viewer-country']);
    console.log('Cloudflare header:', req.headers['cf-ipcountry']);
    console.log('Accept-Language:', req.headers['accept-language']);
    console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('==============================');

    // Try to get country from CloudFront or other CDN headers
    const cloudFrontCountry = req.headers['cloudfront-viewer-country'];
    if (cloudFrontCountry) {
      console.log('✅ Detected from CloudFront:', cloudFrontCountry.toUpperCase());
      return cloudFrontCountry.toUpperCase();
    }

    // Try to get country from Cloudflare headers
    const cloudflareCountry = req.headers['cf-ipcountry'];
    if (cloudflareCountry) {
      console.log('✅ Detected from Cloudflare:', cloudflareCountry.toUpperCase());
      return cloudflareCountry.toUpperCase();
    }

    // IMPORTANT: Accept-Language is NOT reliable for geolocation
    // A user in Portugal might have en-US as their browser language
    // We should only use this as a very last resort and be smart about it

    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const language = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

      // Only trust Portuguese language variants for country detection
      // For other languages, default to PT since this is a Portugal-based platform
      if (language === 'pt') {
        // Check for pt-BR vs pt-PT
        if (acceptLanguage.includes('-')) {
          const region = acceptLanguage.split(',')[0].split('-')[1].toUpperCase();
          if (region === 'BR') {
            console.log('✅ Detected Brazilian Portuguese:', region);
            return 'BR';
          }
        }
        console.log('✅ Detected Portuguese, defaulting to Portugal');
        return 'PT';
      }

      // For non-Portuguese languages, check if there's a valid region
      // But IGNORE en-US, en-GB etc in favor of defaulting to PT
      if (acceptLanguage.includes('-') && language !== 'en') {
        const region = acceptLanguage.split(',')[0].split('-')[1].toUpperCase();
        if (this.isValidCountryCode(region)) {
          console.log('⚠️  Detected from Accept-Language region (non-English):', region);
          return region;
        }
      }
    }

    // Default to Portugal - this is a Portugal-based platform
    console.log('⚠️  No reliable geolocation found, defaulting to Portugal (PT)');
    return 'PT';
  }

  /**
   * Get all available countries
   */
  getAllCountries(): Country[] {
    return this.countries;
  }

  /**
   * Search countries by name
   */
  searchCountries(query: string, limit: number = 5): Country[] {
    const lowerQuery = query.toLowerCase();
    return this.countries
      .filter(country =>
        country.name.toLowerCase().includes(lowerQuery) ||
        country.code.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }

  /**
   * Get country by code
   */
  getCountryByCode(code: string): Country | undefined {
    return this.countries.find(c => c.code === code.toUpperCase());
  }

  /**
   * Check if country code is valid
   */
  isValidCountryCode(code: string): boolean {
    return this.countries.some(c => c.code === code.toUpperCase());
  }
}

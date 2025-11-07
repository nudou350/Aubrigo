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
    // Try to get country from CloudFront or other CDN headers
    const cloudFrontCountry = req.headers['cloudfront-viewer-country'];
    if (cloudFrontCountry) {
      return cloudFrontCountry.toUpperCase();
    }

    // Try to get country from Cloudflare headers
    const cloudflareCountry = req.headers['cf-ipcountry'];
    if (cloudflareCountry) {
      return cloudflareCountry.toUpperCase();
    }

    // Try to get from Accept-Language header as fallback
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const language = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

      // Map common languages to countries
      const languageMap: Record<string, string> = {
        'pt': 'PT',
        'br': 'BR',
        'es': 'ES',
        'fr': 'FR',
        'it': 'IT',
        'de': 'DE',
        'en': 'US',
      };

      // If Accept-Language includes region (e.g., pt-BR, pt-PT)
      if (acceptLanguage.includes('-')) {
        const region = acceptLanguage.split(',')[0].split('-')[1].toUpperCase();
        if (this.isValidCountryCode(region)) {
          return region;
        }
      }

      if (languageMap[language]) {
        return languageMap[language];
      }
    }

    // Default to Portugal
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

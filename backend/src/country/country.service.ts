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
   * Priority: Custom header (testing) > CDN headers > IP detection > Default (PT)
   */
  async detectCountryFromRequest(req: any): Promise<string> {
    // Priority 1: Custom header for testing (X-User-Country)
    const customCountry = req.headers['x-user-country'];
    if (customCountry) {
      console.log('[CountryService] Using custom header country:', customCountry);
      return customCountry.toUpperCase();
    }

    // Priority 2: CDN headers (CloudFront)
    const cloudFrontCountry = req.headers['cloudfront-viewer-country'];
    if (cloudFrontCountry) {
      console.log('[CountryService] Using CloudFront country:', cloudFrontCountry);
      return cloudFrontCountry.toUpperCase();
    }

    // Priority 3: CDN headers (Cloudflare)
    const cloudflareCountry = req.headers['cf-ipcountry'];
    if (cloudflareCountry) {
      console.log('[CountryService] Using Cloudflare country:', cloudflareCountry);
      return cloudflareCountry.toUpperCase();
    }

    // Priority 4: Detect from IP address
    const clientIp = this.getClientIp(req);
    console.log('[CountryService] Client IP:', clientIp);

    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      try {
        const detectedCountry = await this.detectCountryFromIp(clientIp);
        if (detectedCountry) {
          console.log(`[CountryService] ✅ Detected country ${detectedCountry} from IP ${clientIp}`);
          return detectedCountry;
        }
      } catch (error) {
        console.error('[CountryService] IP detection failed:', error.message);
      }
    } else {
      console.log('[CountryService] ⚠️ Local/private IP detected, cannot determine country from IP');
    }

    // Priority 5: Default to PT
    console.log('[CountryService] No detection method available, defaulting to PT');
    return 'PT';
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(req: any): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || null;
  }

  /**
   * Detect country from IP using ipapi.co (free tier: 30k requests/month)
   * Falls back to ip-api.com if ipapi.co fails
   */
  private async detectCountryFromIp(ip: string): Promise<string | null> {
    try {
      // Try ipapi.co first (no API key needed for basic usage)
      const response = await fetch(`https://ipapi.co/${ip}/country/`, {
        headers: { 'User-Agent': 'Aubrigo/1.0' },
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (response.ok) {
        const countryCode = await response.text();
        return countryCode.trim().toUpperCase();
      }
    } catch (error) {
      console.warn('[CountryService] ipapi.co failed, trying fallback');
    }

    try {
      // Fallback to ip-api.com (free, no key needed)
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.countryCode?.toUpperCase() || null;
      }
    } catch (error) {
      console.warn('[CountryService] ip-api.com fallback failed');
    }

    return null;
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

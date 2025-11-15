import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency?: string;
  currencySymbol?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresPhone?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private readonly API_URL = `${environment.apiUrl}/country`;
  private readonly STORAGE_KEY = 'selectedCountry';

  // Signal for reactive country state
  public currentCountry = signal<string>('PT'); // Default to Portugal
  public currentCountryData = signal<Country | null>(null);

  private http = inject(HttpClient);
  private cacheService = inject(CacheService);

  constructor() {
    this.initializeCountry();
  }

  /**
   * Initialize country from storage or detect automatically
   * Priority: User selection (localStorage) > IP detection > Default (PT)
   *
   * IMPORTANT: If stored country is 'PT' (default), we force redetection
   * to ensure users get the correct country based on their actual location
   */
  private initializeCountry(): void {
    const storedCountry = localStorage.getItem(this.STORAGE_KEY);

    // Force redetection if stored country is PT (could be stale default)
    // OR if no country is stored
    if (!storedCountry || storedCountry === 'PT') {
      console.log('[CountryService] Forcing country redetection (stored:', storedCountry, ')');

      // Set temporary PT while detecting
      this.currentCountry.set('PT');

      // Detect from backend
      this.detectCountry().subscribe({
        next: (result) => {
          console.log('[CountryService] Country detected:', result);
          if (result?.countryCode) {
            // Only update if different from PT or if we have a real detection
            if (result.countryCode !== 'PT' || !storedCountry) {
              console.log('[CountryService] Updating country to:', result.countryCode);
              this.setCountry(result.countryCode);
              this.currentCountryData.set(result.country);
            } else {
              console.log('[CountryService] Confirmed PT is correct');
              this.currentCountry.set('PT');
              this.loadCountryData('PT');
            }
          }
        },
        error: (err) => {
          console.error('[CountryService] Detection failed, using PT:', err);
          // Keep PT if detection fails
          this.currentCountry.set('PT');
          this.loadCountryData('PT');
        }
      });
    } else {
      console.log('[CountryService] Using explicitly selected country:', storedCountry);
      // User has explicitly selected a country (not PT) - respect their choice
      this.currentCountry.set(storedCountry);
      this.loadCountryData(storedCountry);
    }
  }

  /**
   * Detect user's country from backend
   */
  detectCountry(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/detect`).pipe(
      catchError(() => of({ countryCode: 'PT', country: { code: 'PT', name: 'Portugal', flag: '🇵🇹' } }))
    );
  }

  /**
   * Get all available countries
   */
  getAllCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.API_URL}/all`);
  }

  /**
   * Search countries by name or code
   */
  searchCountries(query: string, limit = 5): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.API_URL}/search`, {
      params: { q: query, limit: limit.toString() }
    });
  }

  /**
   * Set current country
   */
  setCountry(countryCode: string): void {
    const newCountry = countryCode.toUpperCase();
    const oldCountry = this.currentCountry();

    console.log(`[CountryService] Setting country from ${oldCountry} to ${newCountry}`);

    // Clear pets cache when country changes to prevent showing wrong data
    if (oldCountry !== newCountry) {
      console.log('[CountryService] Country changed, clearing pets cache');
      this.cacheService.invalidate('pets:*');
      this.cacheService.invalidate('ongs:*');
      this.cacheService.invalidate('cities:*');
    }

    this.currentCountry.set(newCountry);
    localStorage.setItem(this.STORAGE_KEY, newCountry);
    this.loadCountryData(countryCode);
  }

  /**
   * Get current country code
   */
  getCountry(): string {
    return this.currentCountry();
  }

  /**
   * Get current country data
   */
  getCurrentCountryData(): Country | null {
    return this.currentCountryData();
  }

  /**
   * Load country data
   */
  private loadCountryData(countryCode: string): void {
    this.getAllCountries().subscribe({
      next: (countries) => {
        const country = countries.find(c => c.code === countryCode.toUpperCase());
        if (country) {
          this.currentCountryData.set(country);
        }
      }
    });
  }

  /**
   * Clear stored country and re-detect from current location
   */
  clearCountry(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeCountry();
  }

  /**
   * Force re-detection of country (useful if user changed location)
   */
  forceRedetect(): void {
    this.detectCountry().subscribe({
      next: (result) => {
        if (result?.countryCode) {
          this.setCountry(result.countryCode);
          this.currentCountryData.set(result.country);
        }
      },
      error: () => {
      }
    });
  }

  /**
   * Get currency information for a country
   */
  getCurrency(countryCode: string): { code: string; symbol: string; locale: string } {
    const country = countryCode.toUpperCase();

    if (country === 'BR') {
      return { code: 'BRL', symbol: 'R$', locale: 'pt-BR' };
    } else if (country === 'PT') {
      return { code: 'EUR', symbol: '€', locale: 'pt-PT' };
    }

    // Default to EUR for other countries
    return { code: 'EUR', symbol: '€', locale: 'pt-PT' };
  }

  /**
   * Get available payment methods for a country
   */
  getPaymentMethods(countryCode: string): PaymentMethod[] {
    const country = countryCode.toUpperCase();

    if (country === 'PT') {
      return [
        {
          id: 'mbway',
          name: 'MB WAY',
          description: 'Pagamento instantâneo via telemóvel',
          icon: 'phone_iphone',
          requiresPhone: true
        },
        {
          id: 'multibanco',
          name: 'Multibanco',
          description: 'Referência para pagamento em ATM',
          icon: 'account_balance',
          requiresPhone: false
        },
        {
          id: 'card',
          name: 'Cartão',
          description: 'Cartão de crédito ou débito',
          icon: 'credit_card',
          requiresPhone: false
        }
      ];
    } else if (country === 'BR') {
      return [
        {
          id: 'pix',
          name: 'PIX',
          description: 'Pagamento instantâneo',
          icon: 'account_balance',
          requiresPhone: false
        },
        {
          id: 'boleto',
          name: 'Boleto',
          description: 'Boleto bancário',
          icon: 'receipt',
          requiresPhone: false
        },
        {
          id: 'card',
          name: 'Cartão',
          description: 'Cartão de crédito ou débito',
          icon: 'credit_card',
          requiresPhone: false
        }
      ];
    }

    // Default to card only for other countries
    return [
      {
        id: 'card',
        name: 'Cartão',
        description: 'Cartão de crédito ou débito',
        icon: 'credit_card',
        requiresPhone: false
      }
    ];
  }

  /**
   * Check if country confirmation is needed (first time load)
   */
  needsConfirmation(): boolean {
    const CONFIRMATION_KEY = 'countryConfirmed';
    return !localStorage.getItem(CONFIRMATION_KEY);
  }

  /**
   * Mark country as confirmed by user
   */
  markAsConfirmed(): void {
    const CONFIRMATION_KEY = 'countryConfirmed';
    localStorage.setItem(CONFIRMATION_KEY, 'true');
  }

  /**
   * Reset confirmation status (for testing or user request)
   */
  resetConfirmation(): void {
    const CONFIRMATION_KEY = 'countryConfirmed';
    localStorage.removeItem(CONFIRMATION_KEY);
  }
}

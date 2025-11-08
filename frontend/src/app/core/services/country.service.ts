import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Country {
  code: string;
  name: string;
  flag: string;
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

  constructor(private http: HttpClient) {
    this.initializeCountry();
  }

  /**
   * Initialize country from storage or detect automatically
   * Priority: User selection (localStorage) > IP detection > Default (PT)
   */
  private initializeCountry(): void {
    const storedCountry = localStorage.getItem(this.STORAGE_KEY);

    if (storedCountry) {
      // User has previously selected a country - respect their choice
      this.currentCountry.set(storedCountry);
      this.loadCountryData(storedCountry);
    } else {
      // No stored country - detect from backend on first visit
      this.detectCountry().subscribe({
        next: (result) => {
          if (result?.countryCode) {
            this.setCountry(result.countryCode);
            this.currentCountryData.set(result.country);
          }
        },
        error: () => {
          // Fallback to PT if detection fails
          this.setCountry('PT');
        }
      });
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
  searchCountries(query: string, limit: number = 5): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.API_URL}/search`, {
      params: { q: query, limit: limit.toString() }
    });
  }

  /**
   * Set current country
   */
  setCountry(countryCode: string): void {
    this.currentCountry.set(countryCode.toUpperCase());
    localStorage.setItem(this.STORAGE_KEY, countryCode.toUpperCase());
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
        console.error('Country detection failed');
      }
    });
  }
}

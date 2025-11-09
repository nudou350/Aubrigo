import { Injectable, signal, inject, computed } from '@angular/core';
import { CountryService } from './country.service';
import { CITY_CONFIGS, DEFAULT_COUNTRY, isSupportedCountry } from '../constants/cities';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private countryService = inject(CountryService);

  // Signals for reactive state
  private citiesCache = signal<Record<string, string[]>>({});
  private isLoading = signal(false);
  private currentCountryCode = signal<string>(DEFAULT_COUNTRY);

  // Computed signal for current cities
  public cities = computed(() => {
    const countryCode = this.currentCountryCode();
    return this.citiesCache()[countryCode] || [];
  });

  constructor() {
    // Initialize cities for the current country
    this.initializeCities();
  }

  /**
   * Initialize cities for the current country
   */
  private async initializeCities(): Promise<void> {
    const countryCode = this.countryService.getCountry();
    await this.loadCitiesForCountry(countryCode);
  }

  /**
   * Load cities for a specific country (with caching)
   */
  async loadCitiesForCountry(countryCode: string): Promise<string[]> {
    // Normalize country code
    const normalizedCode = countryCode.toUpperCase();

    // Return from cache if already loaded
    const cache = this.citiesCache();
    if (cache[normalizedCode]) {
      this.currentCountryCode.set(normalizedCode);
      return cache[normalizedCode];
    }

    // Use default country if not supported
    const codeToLoad = isSupportedCountry(normalizedCode)
      ? normalizedCode
      : DEFAULT_COUNTRY;

    this.isLoading.set(true);

    try {
      const config = CITY_CONFIGS[codeToLoad];
      const { cities } = await config.loader();

      // Update cache
      this.citiesCache.update(cache => ({
        ...cache,
        [codeToLoad]: cities
      }));

      this.currentCountryCode.set(codeToLoad);
      this.isLoading.set(false);

      return cities;
    } catch (error) {
      console.error(`Failed to load cities for ${codeToLoad}`, error);
      this.isLoading.set(false);
      return [];
    }
  }

  /**
   * Get cities for current country (reactive)
   */
  getCities(): string[] {
    return this.cities();
  }

  /**
   * Get loading state
   */
  getLoadingState(): boolean {
    return this.isLoading();
  }

  /**
   * Get current country code
   */
  getCurrentCountryCode(): string {
    return this.currentCountryCode();
  }

  /**
   * Filter cities by query
   */
  filterCities(query: string, limit: number = 5): string[] {
    const cities = this.cities();

    if (!query.trim()) {
      return cities.slice(0, limit);
    }

    return cities
      .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  /**
   * Refresh cities (e.g., when country changes)
   */
  async refreshCities(): Promise<void> {
    const countryCode = this.countryService.getCountry();

    // Clear cache for this country to force reload
    this.citiesCache.update(cache => {
      const newCache = { ...cache };
      delete newCache[countryCode];
      return newCache;
    });

    await this.loadCitiesForCountry(countryCode);
  }

  /**
   * Preload cities for a country (for optimization)
   */
  async preloadCountry(countryCode: string): Promise<void> {
    await this.loadCitiesForCountry(countryCode);
  }

  /**
   * Get all supported countries
   */
  getSupportedCountries(): string[] {
    return Object.keys(CITY_CONFIGS);
  }

  /**
   * Check if a country is supported
   */
  isCountrySupported(countryCode: string): boolean {
    return isSupportedCountry(countryCode);
  }
}

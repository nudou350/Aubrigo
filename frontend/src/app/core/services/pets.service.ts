import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CountryService } from './country.service';
import { CacheService } from './cache.service';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  size?: string;
  color?: string;
  weight?: number;
  description?: string;
  location?: string;
  status: string;
  primaryImage?: string;
  images?: PetImage[];
  ong?: ONG;
  createdAt: string;
}

export interface PetImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ONG {
  id: string;
  ongName: string;
  email: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  distance?: string;
  rating?: number;
}

export interface SearchPetsParams {
  location?: string;
  ongId?: string;
  species?: string;
  size?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  ageRange?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  countryCode?: string;
}

export interface PetsResponse {
  data: Pet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PetsService {
  private http = inject(HttpClient);
  private countryService = inject(CountryService);
  private cacheService = inject(CacheService);
  private apiUrl = `${environment.apiUrl}/pets`;

  searchPets(params: SearchPetsParams): Observable<PetsResponse> {
    // Automatically add current country code if not provided
    const currentCountry = this.countryService.getCountry();
    const searchParams = {
      ...params,
      countryCode: params.countryCode || currentCountry
    };

    // Generate unique cache key based on search parameters
    const cacheKey = this.cacheService.generateKey('pets:search', searchParams);

    // Try to get from cache
    const cached = this.cacheService.get<PetsResponse>(cacheKey);

    // If we have fresh cached data, return it immediately
    if (cached && !this.cacheService.isStale(cacheKey)) {
      return of(cached);
    }

    // If data is stale but exists, return it and refresh in background
    if (cached && this.cacheService.isStale(cacheKey)) {
      // Return stale data immediately (stale-while-revalidate)
      setTimeout(() => {
        // Refresh in background
        this.fetchPets(searchParams, cacheKey).subscribe();
      }, 0);

      return of(cached);
    }

    // No cache, fetch fresh data
    return this.fetchPets(searchParams, cacheKey);
  }

  private fetchPets(searchParams: SearchPetsParams, cacheKey: string): Observable<PetsResponse> {
    let httpParams = new HttpParams();

    Object.keys(searchParams).forEach((key) => {
      const value = searchParams[key as keyof SearchPetsParams];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PetsResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap((response) => this.cacheService.set(cacheKey, response, 'pets'))
    );
  }

  getPetById(id: string): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/${id}`);
  }

  createPet(petData: FormData): Observable<Pet> {
    return this.http.post<Pet>(this.apiUrl, petData).pipe(
      tap(() => {
        // Invalidate all pet search caches when a new pet is created
        this.cacheService.invalidate('pets:*');
        this.cacheService.invalidate('cities:*');
      })
    );
  }

  updatePet(id: string, petData: Partial<Pet>): Observable<Pet> {
    return this.http.put<Pet>(`${this.apiUrl}/${id}`, petData).pipe(
      tap(() => {
        // Invalidate all pet search caches when a pet is updated
        this.cacheService.invalidate('pets:*');
        this.cacheService.invalidate(`pet:${id}`);
      })
    );
  }

  deletePet(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Invalidate all pet search caches when a pet is deleted
        this.cacheService.invalidate('pets:*');
        this.cacheService.invalidate(`pet:${id}`);
        this.cacheService.invalidate('cities:*');
      })
    );
  }

  getCitiesWithPets(countryCode?: string): Observable<string[]> {
    const country = countryCode || this.countryService.getCountry();

    // Generate cache key
    const cacheKey = `cities:${country}`;

    // Try to get from cache
    const cached = this.cacheService.get<string[]>(cacheKey);

    // Cities data is fairly static, so we use longer cache time
    if (cached) {
      return of(cached);
    }

    // Fetch fresh data
    const params = new HttpParams().set('countryCode', country);
    return this.http.get<string[]>(`${this.apiUrl}/cities`, { params }).pipe(
      tap((cities) => this.cacheService.set(cacheKey, cities, 'cities'))
    );
  }
}

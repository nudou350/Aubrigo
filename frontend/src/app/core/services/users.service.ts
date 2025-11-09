import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ONG {
  id: string;
  ongName: string;
  profileImageUrl?: string;
  location?: string;
  phone?: string;
  instagramHandle?: string;
  urgencyLevel?: string;
  urgencyCategory?: string;
  urgencyDescription?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfileResponse {
  user: User;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface UploadImageResponse {
  message: string;
  profileImageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private apiUrl = `${environment.apiUrl}/users`;

  // Keep track of current user profile
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  /**
   * Update user profile
   */
  updateUserProfile(data: UpdateProfileDto): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(`${this.apiUrl}/profile`, data).pipe(
      tap((response) => this.currentUserSubject.next(response.user))
    );
  }

  /**
   * Upload profile image
   */
  uploadProfileImage(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);

    return this.http
      .post<UploadImageResponse>(`${this.apiUrl}/profile/image`, formData)
      .pipe(
        tap((response) => {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            this.currentUserSubject.next({
              ...currentUser,
              profileImageUrl: response.profileImageUrl,
            });
          }
        })
      );
  }

  /**
   * Change password
   */
  changePassword(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/profile/password`,
      data
    );
  }

  /**
   * Delete user account
   */
  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profile`);
  }

  /**
   * Get current user from subject (synchronous)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Clear current user (on logout)
   */
  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
  }

  /**
   * Get all ONGs with optional filters
   */
  getAllOngs(filters?: { search?: string; location?: string; countryCode?: string }): Observable<ONG[]> {
    // Generate unique cache key based on filters
    const cacheKey = this.cacheService.generateKey('ongs:list', filters);

    // Try to get from cache
    const cached = this.cacheService.get<ONG[]>(cacheKey);

    // If we have fresh cached data, return it immediately
    if (cached && !this.cacheService.isStale(cacheKey)) {
      return of(cached);
    }

    // If data is stale but exists, return it and refresh in background
    if (cached && this.cacheService.isStale(cacheKey)) {
      // Return stale data immediately (stale-while-revalidate)
      setTimeout(() => {
        // Refresh in background
        this.fetchOngs(filters, cacheKey).subscribe();
      }, 0);

      return of(cached);
    }

    // No cache, fetch fresh data
    return this.fetchOngs(filters, cacheKey);
  }

  private fetchOngs(filters: { search?: string; location?: string; countryCode?: string } | undefined, cacheKey: string): Observable<ONG[]> {
    let url = this.apiUrl;
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.location) {
      params.append('location', filters.location);
    }

    if (filters?.countryCode) {
      params.append('countryCode', filters.countryCode);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ONG[]>(url).pipe(
      tap((ongs) => this.cacheService.set(cacheKey, ongs, 'ongs'))
    );
  }
}

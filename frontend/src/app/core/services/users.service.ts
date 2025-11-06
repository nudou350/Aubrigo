import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
      `${this.apiUrl}/profile/change-password`,
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
  getAllOngs(filters?: { search?: string; location?: string }): Observable<ONG[]> {
    let url = this.apiUrl;
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.location) {
      params.append('location', filters.location);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ONG[]>(url);
  }
}

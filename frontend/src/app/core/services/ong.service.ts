import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Pet } from './pets.service';

export interface OngProfile {
  id: string;
  email: string;
  ongName: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  profileImageUrl?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOngProfileDto {
  ongName?: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface OngDashboardStats {
  totalPets: number;
  availablePets: number;
  adoptedPets: number;
  pendingAppointments: number;
  totalDonations: number;
  monthlyDonations: number;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  donationType: 'one_time' | 'monthly';
  paymentStatus: string;
  createdAt: string;
}

export interface UpdateOngProfileResponse {
  message: string;
  ong: OngProfile;
}

export interface UploadImageResponse {
  message: string;
  profileImageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class OngService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ong`;

  // Keep track of current ONG profile
  private currentOngSubject = new BehaviorSubject<OngProfile | null>(null);
  public currentOng$ = this.currentOngSubject.asObservable();

  /**
   * Get current ONG profile
   */
  getOngProfile(): Observable<OngProfile> {
    return this.http.get<OngProfile>(`${this.apiUrl}/profile`).pipe(
      tap((ong) => this.currentOngSubject.next(ong))
    );
  }

  /**
   * Update ONG profile
   */
  updateOngProfile(data: UpdateOngProfileDto): Observable<UpdateOngProfileResponse> {
    return this.http
      .put<UpdateOngProfileResponse>(`${this.apiUrl}/profile`, data)
      .pipe(tap((response) => this.currentOngSubject.next(response.ong)));
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
          const currentOng = this.currentOngSubject.value;
          if (currentOng) {
            this.currentOngSubject.next({
              ...currentOng,
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
   * Get ONG's own pets
   */
  getMyPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/my-pets`);
  }

  /**
   * Get donations received by this ONG
   */
  getDonations(): Observable<Donation[]> {
    return this.http.get<Donation[]>(`${this.apiUrl}/donations`);
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<OngDashboardStats> {
    return this.http.get<OngDashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  /**
   * Get ONG profile by ID (public endpoint)
   */
  getOngById(id: string): Observable<OngProfile> {
    return this.http.get<OngProfile>(`${environment.apiUrl}/ong/${id}`);
  }

  /**
   * Get current ONG from subject (synchronous)
   */
  getCurrentOng(): OngProfile | null {
    return this.currentOngSubject.value;
  }

  /**
   * Clear current ONG (on logout)
   */
  clearCurrentOng(): void {
    this.currentOngSubject.next(null);
  }

  /**
   * Delete ONG account
   */
  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profile`);
  }
}

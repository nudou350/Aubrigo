import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pet } from './pets.service';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  ongName?: string;
  phone?: string;
  location?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ong {
  id: string;
  email: string;
  ongName: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  profileImageUrl?: string;
  rating?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingOng extends Ong {
  status: 'pending' | 'approved' | 'rejected';
}

export interface Donation {
  id: string;
  ongId: string;
  ongName?: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  donationType: 'one_time' | 'monthly';
  paymentStatus: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalOngs: number;
  totalPets: number;
  totalDonations: number;
  totalDonationAmount: number;
  pendingOngs: number;
  recentUsers?: User[];
  recentOngs?: Ong[];
  recentPets?: Pet[];
}

export interface ApproveOngDto {
  ongId: string;
}

export interface RejectOngDto {
  ongId: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  /**
   * Get all users
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Update user
   */
  updateUser(userId: string, data: Partial<User>): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/users/${userId}`, data);
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Get all ONGs
   */
  getOngs(): Observable<Ong[]> {
    return this.http.get<Ong[]>(`${this.apiUrl}/ongs`);
  }

  /**
   * Get pending ONGs awaiting approval
   */
  getPendingOngs(): Observable<PendingOng[]> {
    return this.http.get<PendingOng[]>(`${this.apiUrl}/ongs/pending`);
  }

  /**
   * Get ONG by ID
   */
  getOngById(ongId: string): Observable<Ong> {
    return this.http.get<Ong>(`${this.apiUrl}/ongs/${ongId}`);
  }

  /**
   * Approve ONG
   */
  approveOng(ongId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/ongs/${ongId}/approve`, {});
  }

  /**
   * Reject ONG
   */
  rejectOng(ongId: string, reason?: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/ongs/${ongId}/reject`, { reason });
  }

  /**
   * Update ONG
   */
  updateOng(ongId: string, data: Partial<Ong>): Observable<{ message: string; ong: Ong }> {
    return this.http.put<{ message: string; ong: Ong }>(`${this.apiUrl}/ongs/${ongId}`, data);
  }

  /**
   * Delete ONG
   */
  deleteOng(ongId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${ongId}`);
  }

  /**
   * Get all pets (admin view)
   */
  getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/pets`);
  }

  /**
   * Get pet by ID (admin view)
   */
  getPetById(petId: string): Observable<Pet> {
    return this.http.get<Pet>(`${this.apiUrl}/pets/${petId}`);
  }

  /**
   * Moderate pet (approve/reject)
   */
  moderatePet(petId: string, status: 'approved' | 'rejected'): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/pets/${petId}/moderate`, { status });
  }

  /**
   * Delete pet
   */
  deletePet(petId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/pets/${petId}`);
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  /**
   * Get all donations (admin view)
   */
  getDonations(limit?: number): Observable<Donation[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<Donation[]>(`${this.apiUrl}/donations`, { params });
  }

  /**
   * Get reports/analytics data
   */
  getReports(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports`);
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService, EventType } from './analytics.service';

export type UserRole = 'admin' | 'ong' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  ongName?: string;
  profileImageUrl?: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  ongStatus?: 'pending' | 'approved' | 'rejected';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  ong?: {
    id: string;
    ongName: string;
    email: string;
    approvalStatus: string;
  };
}

export interface RegisterDto {
  ongName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  location?: string;
}

export interface RegisterOngDto {
  ongName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  description?: string;
  registrationNumber?: string;
  website?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;

  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.loadUserFromStorage();
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  registerUser(data: RegisterUserDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register/user`, data)
      .pipe(tap((response) => {
        this.handleAuthSuccess(response);
        // Track user registration
        this.analytics.track(EventType.USER_REGISTER, {
          metadata: {
            role: response.user.role,
            accountType: 'user'
          }
        });
      }));
  }

  registerOng(data: RegisterOngDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register/ong`, data)
      .pipe(tap((response) => {
        this.handleAuthSuccess(response);
        // Track ONG registration
        this.analytics.track(EventType.USER_REGISTER, {
          metadata: {
            role: response.user.role,
            accountType: 'ong',
            ongName: response.user.ongName
          }
        });
      }));
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => {
        this.handleAuthSuccess(response);
        // Track user login
        this.analytics.track(EventType.USER_LOGIN, {
          metadata: {
            role: response.user.role,
            accountType: response.user.role === 'ong' ? 'ong' : 'user'
          }
        });
      }));
  }

  // Role checks
  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  isOng(): boolean {
    return this.currentUser()?.role === 'ong';
  }

  isRegularUser(): boolean {
    return this.currentUser()?.role === 'user';
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }

  logout(): void {
    const currentUser = this.currentUser();

    // Track logout before clearing user data
    if (currentUser) {
      this.analytics.track(EventType.USER_LOGOUT, {
        metadata: {
          role: currentUser.role,
          accountType: currentUser.role === 'ong' ? 'ong' : 'user'
        }
      });
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
      confirmPassword
    });
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);

    // Redirect based on user role
    this.redirectBasedOnRole(response.user.role);
  }

  // Public method to update current user (called after profile updates)
  updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private redirectBasedOnRole(role: UserRole): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'ong':
        this.router.navigate(['/ong']);
        break;
      case 'user':
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        this.currentUserSignal.set(JSON.parse(userJson));
      } catch (e) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
      }
    }
  }
}

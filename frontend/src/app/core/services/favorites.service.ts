import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Favorite {
  id: string;
  visitorEmail: string;
  petId: string;
  pet?: {
    id: string;
    name: string;
    primaryImage?: string;
    breed?: string;
    age?: number;
    species: string;
    location?: string;
  };
  createdAt: string;
}

export interface FavoriteResponse {
  message: string;
  favorite?: Favorite;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/favorites`;

  // Track favorites count for UI badges
  private favoritesCountSubject = new BehaviorSubject<number>(0);
  public favoritesCount$ = this.favoritesCountSubject.asObservable();

  /**
   * Add a pet to favorites
   */
  addToFavorites(petId: string, visitorEmail: string): Observable<FavoriteResponse> {
    return this.http.post<FavoriteResponse>(this.apiUrl, {
      petId,
      visitorEmail,
    }).pipe(
      tap(() => this.updateFavoritesCount(visitorEmail))
    );
  }

  /**
   * Get all favorites for a visitor email
   */
  getFavorites(email: string): Observable<Favorite[]> {
    return this.http.get<Favorite[]>(`${this.apiUrl}?email=${email}`).pipe(
      tap((favorites) => this.favoritesCountSubject.next(favorites.length))
    );
  }

  /**
   * Remove a favorite by ID
   */
  removeFavorite(id: string, email: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.updateFavoritesCount(email))
    );
  }

  /**
   * Remove a favorite by pet ID (useful for quick toggle)
   */
  removeFavoriteByPetId(petId: string, email: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/pet/${petId}?email=${email}`).pipe(
      tap(() => this.updateFavoritesCount(email))
    );
  }

  /**
   * Check if a pet is favorited by the user
   */
  isFavorite(petId: string, email: string): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(
      `${this.apiUrl}/check/${petId}?email=${email}`
    );
  }

  /**
   * Update favorites count by fetching latest data
   */
  private updateFavoritesCount(email: string): void {
    if (email) {
      this.getFavorites(email).subscribe();
    }
  }

  /**
   * Get visitor email from localStorage (for anonymous users)
   */
  getVisitorEmail(): string | null {
    return localStorage.getItem('visitorEmail');
  }

  /**
   * Set visitor email in localStorage
   */
  setVisitorEmail(email: string): void {
    localStorage.setItem('visitorEmail', email);
  }

  /**
   * Clear visitor email from localStorage
   */
  clearVisitorEmail(): void {
    localStorage.removeItem('visitorEmail');
  }
}

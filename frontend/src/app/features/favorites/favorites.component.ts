import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';
import { FavoritesService, Favorite } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, BackButtonComponent],
  template: `
    <app-back-button [fallbackRoute]="'/home'"></app-back-button>

    <div class="favorites-container">
      <header class="favorites-header">
        <h1>Meus Favoritos</h1>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Carregando favoritos...</p>
        </div>
      } @else {
        @if (favorites().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2>Nenhum favorito ainda</h2>
            <p>Comece a adicionar pets aos seus favoritos para vê-los aqui!</p>
            <button class="btn-primary" routerLink="/home">
              Explorar Pets
            </button>
          </div>
        } @else {
          <div class="favorites-grid">
            @for (favorite of favorites(); track favorite.id) {
              <div class="pet-card">
                <div class="pet-image" [routerLink]="['/pets', favorite.pet.id]">
                  @if (favorite.pet.primaryImage) {
                    <img [src]="favorite.pet.primaryImage" [alt]="favorite.pet.name || 'Pet'">
                  } @else {
                    <div class="placeholder-image">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  }
                </div>
                <div class="pet-info" [routerLink]="['/pets', favorite.pet.id]">
                  <h3 class="pet-name">{{ favorite.pet.name || 'Pet' }}</h3>
                  <div class="pet-details">
                    <span class="detail-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {{ favorite.pet.location || 'Localização não informada' }}
                    </span>
                    @if (favorite.pet.breed) {
                      <span class="detail-item">{{ favorite.pet.breed }}</span>
                    }
                    @if (favorite.pet.age !== undefined) {
                      <span class="detail-item">{{ favorite.pet.age }} anos</span>
                    }
                  </div>
                </div>
                <button
                  class="remove-button"
                  (click)="removeFavorite(favorite.id, $event)"
                  title="Remover dos favoritos"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .favorites-container {
      min-height: 100vh;
      background: #F5F5F5;
    }

    .favorites-header {
      padding: 80px 20px 20px 20px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .favorites-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #2C2C2C;
    }

    /* Desktop adjustments */
    @media (min-width: 1024px) {
      .favorites-header {
        padding: 120px 20px 20px 20px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #666666;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #E0E0E0;
      border-top-color: #5CB5B0;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .empty-icon {
      margin-bottom: 24px;
      color: #B8E3E1;
    }

    .empty-state h2 {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .empty-state p {
      margin: 0 0 32px 0;
      font-size: 16px;
      color: #666666;
      max-width: 400px;
    }

    .btn-primary {
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-primary:hover {
      background: #4A9792;
    }

    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .pet-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }

    .pet-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .pet-image {
      width: 100%;
      height: 280px;
      overflow: hidden;
      cursor: pointer;
      background: #F5F5F5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pet-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-image {
      color: #B8E3E1;
    }

    .pet-info {
      padding: 16px;
      cursor: pointer;
    }

    .pet-name {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .pet-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #666666;
    }

    .detail-item svg {
      flex-shrink: 0;
      color: #5CB5B0;
    }

    .remove-button {
      position: absolute;
      top: 12px;
      right: 12px;
      background: white;
      border: none;
      padding: 10px;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      color: #E74C3C;
      transition: all 0.2s ease;
      z-index: 5;
    }

    .remove-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 768px) {
      .favorites-grid {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .favorites-header h1 {
        font-size: 20px;
      }
    }
  `],
})
export class FavoritesComponent implements OnInit {
  private favoritesService = inject(FavoritesService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  favorites = signal<Favorite[]>([]);
  loading = signal(false);
  visitorEmail: string | null = null;

  ngOnInit(): void {
    this.visitorEmail = this.favoritesService.getVisitorEmail();

    if (!this.visitorEmail) {
      // Prompt user to enter email
      const email = prompt('Por favor, insira seu e-mail para ver seus favoritos:');
      if (email) {
        this.favoritesService.setVisitorEmail(email);
        this.visitorEmail = email;
        this.loadFavorites();
      } else {
        this.toastService.warning('E-mail necessário para ver favoritos');
        this.router.navigate(['/home']);
      }
    } else {
      this.loadFavorites();
    }
  }

  loadFavorites(): void {
    if (!this.visitorEmail) return;

    this.loading.set(true);
    this.favoritesService.getFavorites(this.visitorEmail).subscribe({
      next: (favorites) => {
        this.favorites.set(favorites);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.toastService.error('Erro ao carregar favoritos');
        this.loading.set(false);
      },
    });
  }

  removeFavorite(id: string, event: Event): void {
    event.stopPropagation();

    if (!this.visitorEmail) return;

    this.favoritesService.removeFavorite(id, this.visitorEmail).subscribe({
      next: () => {
        this.favorites.set(this.favorites().filter((f) => f.id !== id));
        this.toastService.success('Removido dos favoritos');
      },
      error: (error) => {
        console.error('Error removing favorite:', error);
        this.toastService.error('Erro ao remover favorito');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}

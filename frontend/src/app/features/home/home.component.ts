import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { FavoritesService } from "../../core/services/favorites.service";
import { ToastService } from "../../core/services/toast.service";
import { PetsService, Pet, SearchPetsParams } from "../../core/services/pets.service";
import { PwaService } from "../../core/services/pwa.service";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-screen">
      <!-- Header Section -->
      <div class="header-section">
        <div class="greeting">
          <h1 class="greeting-text">{{ getGreeting() }}</h1>
          <div class="header-actions">
            @if (pwaService.isInstallable() && !pwaService.isInstalled()) {
              <button class="pwa-install-button" (click)="installPwa()" title="Instalar aplicativo">
                📱
              </button>
            }
            @if (authService.isAuthenticated()) {
            <button class="profile-button" (click)="goToProfile()">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </button>
            } @else {
            <button class="login-button" (click)="goToLogin()">
              Login / Registrar
            </button>
            }
          </div>
        </div>

        <!-- Location & Species Filter Bar -->
        <div class="filter-bar">
          <div class="location-search-container">
            <svg class="location-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </svg>
            <input
              type="text"
              class="location-input"
              [value]="getLocationInputValue()"
              (input)="onLocationInput($event)"
              (focus)="onLocationFocus()"
              (keydown)="onLocationKeydown($event)"
              [placeholder]="getLocationPlaceholder()"
            />
            @if (showLocationDropdown() && filteredLocations().length > 0) {
              <div class="location-dropdown">
                @for (location of filteredLocations(); track $index) {
                  <button
                    class="location-option"
                    [class.selected]="selectedLocationIndex() === $index"
                    (click)="selectLocation(location)"
                  >
                    <svg class="option-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {{ location }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Species Filter Tabs -->
          <div class="species-tabs">
          <button
            class="species-tab"
            [class.active]="selectedSpecies() === 'dog'"
            (click)="filterBySpecies('dog')"
          >
            <div class="tab-icon">🐕</div>
          </button>
          <button
            class="species-tab"
            [class.active]="selectedSpecies() === 'cat'"
            (click)="filterBySpecies('cat')"
          >
            <div class="tab-icon">🐈</div>
          </button>
          <button
            class="species-tab"
            [class.active]="selectedSpecies() === 'fish'"
            (click)="filterBySpecies('fish')"
          >
            <div class="tab-icon">🐠</div>
          </button>
          <button
            class="species-tab"
            [class.active]="selectedSpecies() === 'hamster'"
            (click)="filterBySpecies('hamster')"
          >
            <div class="tab-icon">🐹</div>
          </button>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      @if (loading()) {
      <div class="loading">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <span class="loading-text">Carregando pets...</span>
        </div>
      </div>
      }

      <!-- Pet List -->
      <div class="pet-list">
        @if (pets().length === 0 && !loading()) {
        <div class="no-pets">Nenhum pet encontrado</div>
        } @else { @for (pet of pets(); track pet.id) {
        <div class="pet-card" (click)="viewPetDetail(pet.id)">
          <div class="pet-image-container">
            <img [src]="pet.primaryImage" [alt]="pet.name" class="pet-image" />
            <button
              class="favorite-button"
              [class.favorited]="favoritePetIds().has(pet.id)"
              (click)="toggleFavorite(pet.id, $event)"
              title="Adicionar aos favoritos"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" [attr.fill]="favoritePetIds().has(pet.id) ? 'currentColor' : 'none'" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <div class="pet-info">
            <h3 class="pet-name">{{ pet.name }}</h3>

            <div class="pet-details">
              <div class="detail-item">
                <svg
                  class="detail-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
                <span>{{ pet.location }}</span>
              </div>

              <div class="detail-item">
                <svg
                  class="detail-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  @if (pet.gender === 'male') {
                  <path
                    d="M9 9c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3zm12 4h-3v3h-3v3h-3v-6H9v6H6v-3H3v-3H0v-2h3V7h3V4h3V1h3v6h3V4h3v3h3z"
                  />
                  } @else {
                  <path
                    d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-1 2v3H8v5h8v-5h-3v-3z"
                  />
                  }
                </svg>
                <span>{{
                  pet.gender === "male" ? "Masculino" : "Feminino"
                }}</span>
              </div>

              <div class="detail-item">
                <svg
                  class="detail-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  />
                </svg>
                <span>{{ getSizeLabel(pet.size) }}</span>
              </div>

              <div class="detail-item">
                <svg
                  class="detail-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="15.5" cy="9.5" r="1.5" />
                  <circle cx="8.5" cy="9.5" r="1.5" />
                  <path
                    d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                  />
                </svg>
                <span>{{ pet.age }} anos</span>
              </div>
            </div>

            <div class="ong-info">
              <svg class="ong-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
                />
              </svg>
              <span>{{ pet.ong?.ongName || 'N/A' }}</span>
            </div>

            <p class="pet-description">{{ pet.description }}</p>

            <button class="learn-more-button">SABER MAIS</button>
          </div>
        </div>
        } }
      </div>
    </div>

    <!-- iOS Install Instructions Modal -->
    @if (showIosInstructions()) {
      <div class="ios-modal-overlay" (click)="closeIosInstructions()">
        <div class="ios-modal" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeIosInstructions()">✕</button>

          <div class="modal-header">
            <span class="icon">📱</span>
            <h2>Instalar Aubrigo</h2>
            <p>Siga os passos abaixo para adicionar o app à sua tela inicial</p>
          </div>

          <div class="instructions">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Toque no botão Compartilhar</h3>
                <p>Procure pelo ícone <strong>
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" style="display: inline; vertical-align: middle;">
                    <path d="M8 0L6.59 1.41L12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z" transform="rotate(-90 8 8)"/>
                  </svg>
                </strong> na parte inferior da tela</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Role para baixo</h3>
                <p>No menu que aparecer, role até encontrar a opção</p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Adicionar à Tela de Início</h3>
                <p>Toque em <strong>"Adicionar à Tela de Início"</strong> ou <strong>"Add to Home Screen"</strong></p>
              </div>
            </div>

            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Confirme</h3>
                <p>Toque em <strong>"Adicionar"</strong> no canto superior direito</p>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <p>✨ Pronto! O ícone do Aubrigo estará na sua tela inicial</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .home-screen {
        min-height: 100vh;
        background: #ffffff;
        padding-bottom: 24px;
      }

      /* Header Section */
      .header-section {
        background: #ffffff;
        padding: 16px 20px 20px 20px;
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .greeting {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .greeting-text {
        font-size: 24px;
        font-weight: 500;
        color: #4ca8a0;
        margin: 0;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pwa-install-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 20px;
      }

      .pwa-install-button:hover {
        background: rgba(76, 168, 160, 0.2);
        transform: scale(1.05);
      }

      .pwa-install-button:active {
        transform: scale(0.95);
      }

      /* Hide PWA install button on desktop */
      @media (min-width: 1024px) {
        .pwa-install-button {
          display: none;
        }
      }

      .profile-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .profile-button svg {
        width: 24px;
        height: 24px;
        color: #4ca8a0;
      }

      .profile-button:hover {
        background: rgba(184, 227, 225, 0.5);
      }

      .login-button {
        background: #4ca8a0;
        color: white;
        border: none;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .login-button:hover {
        background: #3d9690;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(76, 168, 160, 0.3);
      }

      .filter-bar {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 20px;
      }

      .location-search-container {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(184, 227, 225, 0.3);
        padding: 12px 16px;
        border-radius: 12px;
      }

      .location-icon {
        width: 20px;
        height: 20px;
        color: #4ca8a0;
        flex-shrink: 0;
      }

      .location-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 15px;
        color: #2c2c2c;
        font-weight: 500;
        outline: none;
      }

      .location-input::placeholder {
        color: #999999;
        font-weight: 400;
      }

      .location-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        max-height: 300px;
        overflow-y: auto;
      }

      .location-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: none;
        background: white;
        cursor: pointer;
        transition: background 0.2s ease;
        text-align: left;
        font-size: 15px;
        color: #2c2c2c;
      }

      .location-option:hover {
        background: rgba(184, 227, 225, 0.2);
      }

      .location-option.selected {
        background: rgba(184, 227, 225, 0.5);
        font-weight: 600;
      }

      .option-icon {
        width: 18px;
        height: 18px;
        color: #4ca8a0;
        flex-shrink: 0;
      }

      .search-button {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #4ca8a0;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
        transition: all 0.2s ease;
      }

      .search-button svg {
        width: 24px;
        height: 24px;
        color: #ffffff;
      }

      .search-button:hover {
        background: #3d9690;
        transform: translateY(-2px);
      }

      /* Species Filter Tabs */
      .species-tabs {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .species-tab {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: #ffffff;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .species-tab.active {
        background: #4ca8a0;
        box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
        transform: translateY(-2px);
      }

      .tab-icon {
        font-size: 32px;
      }

      .species-tab:hover:not(.active) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      /* Pet List */
      .pet-list {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .loading-content {
        background: #ffffff;
        padding: 32px 48px;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #b8e3e1;
        border-top-color: #4ca8a0;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        color: #2c2c2c;
        font-size: 16px;
        font-weight: 500;
      }

      .no-pets {
        text-align: center;
        padding: 40px 20px;
        color: #666666;
        font-size: 16px;
      }

      .pet-card {
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .pet-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .pet-image-container {
        width: 100%;
        height: 280px;
        overflow: hidden;
        background: #f0f0f0;
        position: relative;
      }

      .pet-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .favorite-button {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        z-index: 10;
        color: #666666;
      }

      .favorite-button:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .favorite-button.favorited {
        color: #E74C3C;
        background: #FFF5F5;
      }

      .favorite-button:active {
        transform: scale(0.95);
      }

      .pet-info {
        padding: 20px;
      }

      .pet-name {
        font-size: 24px;
        font-weight: 600;
        color: #4ca8a0;
        margin: 0 0 16px 0;
      }

      .pet-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #666666;
      }

      .detail-icon {
        width: 18px;
        height: 18px;
        color: #4ca8a0;
        flex-shrink: 0;
      }

      .ong-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: rgba(184, 227, 225, 0.2);
        border-radius: 8px;
      }

      .ong-icon {
        width: 20px;
        height: 20px;
        color: #4ca8a0;
        flex-shrink: 0;
      }

      .ong-info span {
        font-size: 14px;
        font-weight: 500;
        color: #2c2c2c;
      }

      .pet-description {
        font-size: 14px;
        line-height: 1.6;
        color: #666666;
        margin: 0 0 16px 0;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .learn-more-button {
        width: 100%;
        background: #4ca8a0;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 14px;
        font-size: 15px;
        font-weight: 600;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
      }

      .learn-more-button:hover {
        background: #3d9690;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(76, 168, 160, 0.4);
      }

      /* Responsive Design */
      @media (min-width: 768px) {
        .pet-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .header-section {
          padding: 24px 32px;
        }
      }

      @media (min-width: 1024px) {
        .home-screen {
          max-width: 1920px;
          margin: 0 auto;
        }

        .pet-list {
          grid-template-columns: repeat(3, 1fr);
          padding: 32px 48px;
        }

        .header-section {
          padding: 32px 48px;
        }

        .login-button {
          display: none;
        }

        .filter-bar {
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .location-search-container {
          max-width: 500px;
          padding: 16px 20px;
        }

        .location-icon {
          width: 24px;
          height: 24px;
        }

        .location-input {
          font-size: 17px;
        }

        .species-tabs {
          gap: 16px;
        }

        .species-tab {
          width: 64px;
          height: 64px;
        }

        .tab-icon {
          font-size: 32px;
        }
      }

      @media (min-width: 1440px) {
        .pet-list {
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }
      }

      @media (min-width: 1920px) {
        .pet-list {
          grid-template-columns: repeat(5, 1fr);
          gap: 32px;
        }
      }

      /* iOS Install Instructions Modal */
      .ios-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        backdrop-filter: blur(4px);
      }

      .ios-modal {
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: #f0f0f0;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
        z-index: 1;
      }

      .close-btn:hover {
        background: #e0e0e0;
        color: #333;
      }

      .modal-header {
        text-align: center;
        padding: 40px 30px 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      .modal-header .icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }

      .modal-header h2 {
        font-size: 24px;
        font-weight: 700;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      .modal-header p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .instructions {
        padding: 24px 30px;
      }

      .step {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }

      .step:last-child {
        margin-bottom: 0;
      }

      .step-number {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        background: #4ca8a0;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
      }

      .step-content {
        flex: 1;
      }

      .step-content h3 {
        font-size: 16px;
        font-weight: 600;
        color: #2C2C2C;
        margin: 0 0 6px 0;
      }

      .step-content p {
        font-size: 14px;
        color: #666;
        margin: 0;
        line-height: 1.6;
      }

      .step-content strong {
        color: #4ca8a0;
        font-weight: 600;
      }

      .modal-footer {
        background: #f9f9f9;
        padding: 20px 30px;
        border-top: 1px solid #f0f0f0;
        border-bottom-left-radius: 20px;
        border-bottom-right-radius: 20px;
      }

      .modal-footer p {
        text-align: center;
        font-size: 14px;
        color: #4ca8a0;
        margin: 0;
        font-weight: 600;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  private petsService = inject(PetsService);
  private router = inject(Router);
  authService = inject(AuthService);
  private favoritesService = inject(FavoritesService);
  private toastService = inject(ToastService);
  pwaService = inject(PwaService);

  pets = signal<Pet[]>([]);
  loading = signal(true);
  selectedSpecies = signal<string>("dog");
  showIosInstructions = signal(false);
  currentLocation = signal("Todas as cidades");
  favoritePetIds = signal<Set<string>>(new Set());
  visitorEmail: string | null = null;

  // Location typeahead
  showLocationDropdown = signal(false);
  availableLocations: string[] = ["Todas as cidades"];
  filteredLocations = signal<string[]>(this.availableLocations);
  selectedLocationIndex = signal(-1);

  ngOnInit() {
    this.loadCitiesWithPets();
    this.loadPets();
    this.initFavorites();

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.location-search-container')) {
        this.showLocationDropdown.set(false);
      }
    });
  }

  initFavorites() {
    // Get or prompt for visitor email
    this.visitorEmail = this.favoritesService.getVisitorEmail();

    if (!this.visitorEmail) {
      // Generate a temporary email for anonymous users
      const tempEmail = `temp-${Date.now()}@petsos.com`;
      this.favoritesService.setVisitorEmail(tempEmail);
      this.visitorEmail = tempEmail;
    }

    // Load existing favorites
    this.loadFavorites();
  }

  loadFavorites() {
    if (!this.visitorEmail) return;

    this.favoritesService.getFavorites(this.visitorEmail).subscribe({
      next: (favorites) => {
        const petIds = new Set(favorites.map(f => f.petId));
        this.favoritePetIds.set(petIds);
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      }
    });
  }

  toggleFavorite(petId: string, event: Event) {
    event.stopPropagation(); // Prevent navigation to pet detail

    if (!this.visitorEmail) {
      this.toastService.warning('Por favor, configure seu e-mail primeiro');
      return;
    }

    const favorites = this.favoritePetIds();
    const isFavorited = favorites.has(petId);

    if (isFavorited) {
      // Remove from favorites
      this.favoritesService.removeFavoriteByPetId(petId, this.visitorEmail).subscribe({
        next: () => {
          const newFavorites = new Set(favorites);
          newFavorites.delete(petId);
          this.favoritePetIds.set(newFavorites);
          this.toastService.success('Removido dos favoritos');
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
          this.toastService.error('Erro ao remover dos favoritos');
        }
      });
    } else {
      // Add to favorites
      this.favoritesService.addToFavorites(petId, this.visitorEmail).subscribe({
        next: () => {
          const newFavorites = new Set(favorites);
          newFavorites.add(petId);
          this.favoritePetIds.set(newFavorites);
          this.toastService.success('Adicionado aos favoritos');
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
          this.toastService.error('Erro ao adicionar aos favoritos');
        }
      });
    }
  }

  loadPets() {
    this.loading.set(true);

    const params: SearchPetsParams = {};

    // Add species filter if selected
    if (this.selectedSpecies()) {
      params.species = this.selectedSpecies();
    }

    // Add location filter if selected and not "Todas as cidades"
    if (this.currentLocation() && this.currentLocation() !== "Todas as cidades") {
      params.location = this.currentLocation();
    }

    this.petsService.searchPets(params).subscribe({
      next: (response) => {
        this.pets.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error("Error loading pets:", error);
        this.toastService.error('Erro ao carregar pets');
        this.loading.set(false);
        this.pets.set([]);
      },
    });
  }

  filterBySpecies(species: string) {
    this.selectedSpecies.set(species);
    this.loadPets();
  }

  getSizeLabel(size?: string): string {
    if (!size) return 'N/A';
    const labels: any = {
      small: "Pequeno",
      medium: "Médio",
      large: "Grande",
    };
    return labels[size] || size;
  }

  viewPetDetail(petId: string) {
    this.router.navigate(["/pets", petId]);
  }

  getGreeting(): string {
    const user = this.authService.currentUser();
    if (user) {
      // Check for firstName first (regular users and admins)
      if (user.firstName) {
        return `Olá, ${user.firstName}!`;
      }
      // Fall back to ongName (for ONG accounts)
      if (user.ongName) {
        return `Olá, ${user.ongName}!`;
      }
    }
    // If no name is available, just show greeting
    return "Olá!";
  }

  goToProfile() {
    this.router.navigate(["/profile"]);
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }

  async installPwa() {
    // Check if it's iOS - show instructions instead of prompt
    if (this.pwaService.isIOS()) {
      this.showIosInstructions.set(true);
      return;
    }

    // Android/Chrome - use native prompt
    const installed = await this.pwaService.promptInstall();
    if (installed) {
      this.toastService.success('App instalado! Acesse pelo ícone na tela inicial');
    } else {
      this.toastService.info('Adicione o Aubrigo à sua tela inicial para acesso rápido!');
    }
  }

  closeIosInstructions() {
    this.showIosInstructions.set(false);
  }

  loadCitiesWithPets() {
    this.petsService.getCitiesWithPets().subscribe({
      next: (cities) => {
        this.availableLocations = ["Todas as cidades", ...cities];
        this.filteredLocations.set(this.availableLocations.slice(0, 5));
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        // Keep default if error
      }
    });
  }

  getLocationInputValue(): string {
    // If "Todas as cidades" is selected, return empty string (placeholder will show)
    const location = this.currentLocation();
    return location === "Todas as cidades" ? "" : location;
  }

  getLocationPlaceholder(): string {
    // Show current location as placeholder if "Todas as cidades" is selected
    const location = this.currentLocation();
    return location === "Todas as cidades" ? "Todas as cidades" : "Digite uma cidade...";
  }

  onLocationFocus() {
    // Show dropdown with first 5 locations when input is focused
    this.filteredLocations.set(this.availableLocations.slice(0, 5));
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();

    // If empty, reset to "Todas as cidades"
    if (!input) {
      this.currentLocation.set("Todas as cidades");
      this.filteredLocations.set(this.availableLocations.slice(0, 5));
      this.showLocationDropdown.set(true);
      this.selectedLocationIndex.set(-1);
      return;
    }

    // Update current location with typed value
    this.currentLocation.set(input);

    // Filter locations based on input (limit to 5 results)
    const filtered = this.availableLocations
      .filter(location =>
        location.toLowerCase().includes(input.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 cities

    this.filteredLocations.set(filtered);
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationKeydown(event: KeyboardEvent) {
    const locations = this.filteredLocations();

    if (!this.showLocationDropdown() || locations.length === 0) {
      if (event.key === 'Enter') {
        this.onEnterKey();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedLocationIndex.update(idx =>
          idx < locations.length - 1 ? idx + 1 : idx
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedLocationIndex.update(idx =>
          idx > 0 ? idx - 1 : -1
        );
        break;

      case 'Enter':
        event.preventDefault();
        const selectedIdx = this.selectedLocationIndex();
        if (selectedIdx >= 0 && selectedIdx < locations.length) {
          this.selectLocation(locations[selectedIdx]);
        } else {
          this.onEnterKey();
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showLocationDropdown.set(false);
        this.selectedLocationIndex.set(-1);
        break;
    }
  }

  onEnterKey() {
    // Close dropdown and search with current location value
    this.showLocationDropdown.set(false);
    this.selectedLocationIndex.set(-1);

    // If input is empty or matches no cities, search with "Todas as cidades"
    const input = this.currentLocation();
    if (!input || input === "Todas as cidades") {
      this.currentLocation.set("Todas as cidades");
    }

    this.loadPets();
  }

  selectLocation(location: string) {
    this.currentLocation.set(location);
    this.showLocationDropdown.set(false);
    this.selectedLocationIndex.set(-1);
    this.filteredLocations.set(this.availableLocations.slice(0, 5)); // Reset to first 5
    // Reload pets with location filter
    this.loadPets();
  }
}

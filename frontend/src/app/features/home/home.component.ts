import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { FavoritesService } from "../../core/services/favorites.service";
import { ToastService } from "../../core/services/toast.service";
import {
  PetsService,
  Pet,
  SearchPetsParams,
} from "../../core/services/pets.service";
import { PwaService } from "../../core/services/pwa.service";
import {
  AnalyticsService,
  EventType,
} from "../../core/services/analytics.service";
import { UsersService, ONG } from "../../core/services/users.service";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="home-screen">
      <!-- Header Section -->
      <div class="header-section">
        <div class="greeting">
          <h1 class="greeting-text">{{ getGreeting() }}</h1>
          <div class="header-actions">
            @if (pwaService.isInstallable() && !pwaService.isInstalled()) {
            <button
              class="pwa-install-button"
              (click)="installPwa()"
              title="Instalar aplicativo"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </button>
            } @if (authService.isAuthenticated()) {
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
                <svg
                  class="option-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
                {{ location }}
              </button>
              }
            </div>
            }
          </div>

          <!-- ONG Filter -->
          <div class="ong-search-container">
            <img
              ngSrc="assets/ong.webp"
              alt="ONG"
              width="18"
              height="18"
              class="ong-filter-icon"
            />
            <input
              type="text"
              class="ong-input"
              [value]="getOngInputValue()"
              (input)="onOngInput($event)"
              (focus)="onOngFocus()"
              (keydown)="onOngKeydown($event)"
              [placeholder]="getOngPlaceholder()"
            />
            @if (currentOng()) {
            <button
              class="clear-ong-button"
              (click)="clearOngFilter()"
              title="Limpar filtro"
            >
              ✕
            </button>
            } @if (showOngDropdown() && filteredOngs().length > 0) {
            <div class="ong-dropdown">
              @for (ong of filteredOngs(); track $index) {
              <button
                class="ong-option"
                [class.selected]="selectedOngIndex() === $index"
                (click)="selectOng(ong)"
              >
                <svg
                  class="option-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-2.34 2.37-3.47C10.5 13.1 9.66 13 9 13z"
                  />
                </svg>
                {{ ong.ongName }}
                @if (ong.location) {
                <span class="ong-location">- {{ ong.location }}</span>
                }
              </button>
              }
            </div>
            }
          </div>

          <!-- Filters - Mobile View -->
          <div class="filters-row mobile-filters">
            <!-- Sort Filter -->
            <select
              class="filter-select"
              [value]="sortBy()"
              (change)="onSortChange($event)"
            >
              <option value="urgent">Urgência</option>
              <option value="oldest">Mais antigos</option>
              <option value="">Mais recentes</option>
            </select>

            <!-- Gender Filter -->
            <select
              class="filter-select"
              [value]="selectedGender()"
              (change)="onGenderChange($event)"
            >
              <option value="">Gênero</option>
              <option value="male">Macho</option>
              <option value="female">Fêmea</option>
            </select>

            <!-- Size Filter -->
            <select
              class="filter-select"
              [value]="selectedSize()"
              (change)="onSizeChange($event)"
            >
              <option value="">Porte</option>
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>

            <!-- Age Range Filter -->
            <select
              class="filter-select"
              [value]="selectedAgeRange()"
              (change)="onAgeRangeChange($event)"
            >
              <option value="">Idade</option>
              <option value="0-1">0-1 anos</option>
              <option value="2-3">2-3 anos</option>
              <option value="4-6">4-6 anos</option>
              <option value="7-10">7-10 anos</option>
              <option value="10+">10+ anos</option>
            </select>
          </div>

          <!-- Filters - Desktop View -->
          <div class="filters-desktop-container">
            <button
              class="filters-toggle-button"
              (click)="toggleFiltersDropdown(); $event.stopPropagation()"
            >
              <svg class="filter-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
                />
              </svg>
              Filtros
              <svg
                class="chevron-icon"
                [class.rotated]="showFiltersDropdown()"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
              @if (hasActiveFilters()) {
              <span class="active-filters-badge">{{ getActiveFiltersCount() }}</span>
              }
            </button>

            @if (showFiltersDropdown()) {
            <div class="filters-backdrop" (click)="closeFiltersDropdown()"></div>
            <div class="filters-dropdown" (click)="$event.stopPropagation()">
              <div class="filters-dropdown-content">
                <div class="filter-group">
                  <label class="filter-label">Ordenar por</label>
                  <select
                    class="filter-select-dropdown"
                    [value]="sortBy()"
                    (change)="onSortChange($event)"
                  >
                    <option value="urgent">Urgência</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="">Mais recentes</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Gênero</label>
                  <select
                    class="filter-select-dropdown"
                    [value]="selectedGender()"
                    (change)="onGenderChange($event)"
                  >
                    <option value="">Todos</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Porte</label>
                  <select
                    class="filter-select-dropdown"
                    [value]="selectedSize()"
                    (change)="onSizeChange($event)"
                  >
                    <option value="">Todos</option>
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Idade</label>
                  <select
                    class="filter-select-dropdown"
                    [value]="selectedAgeRange()"
                    (change)="onAgeRangeChange($event)"
                  >
                    <option value="">Todas</option>
                    <option value="0-1">0-1 anos</option>
                    <option value="2-3">2-3 anos</option>
                    <option value="4-6">4-6 anos</option>
                    <option value="7-10">7-10 anos</option>
                    <option value="10+">10+ anos</option>
                  </select>
                </div>

                @if (hasActiveFilters()) {
                <button class="clear-filters-button" (click)="clearAllFilters(); $event.stopPropagation()">
                  Limpar filtros
                </button>
                }
              </div>
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
              <img
                ngSrc="assets/dog_home.webp"
                alt="Dog"
                width="48"
                height="48"
                class="tab-icon"
                priority
              />
            </button>
            <button
              class="species-tab"
              [class.active]="selectedSpecies() === 'cat'"
              (click)="filterBySpecies('cat')"
            >
              <img
                ngSrc="assets/cat_home.webp"
                alt="Cat"
                width="48"
                height="48"
                class="tab-icon"
                priority
              />
            </button>
            <button
              class="species-tab"
              [class.active]="selectedSpecies() === 'fish'"
              (click)="filterBySpecies('fish')"
            >
              <img
                ngSrc="assets/fish_home.webp"
                alt="Fish"
                width="48"
                height="48"
                class="tab-icon"
                priority
              />
            </button>
            <button
              class="species-tab"
              [class.active]="selectedSpecies() === 'hamster'"
              (click)="filterBySpecies('hamster')"
            >
              <img
                ngSrc="assets/hamster_home.webp"
                alt="Hamster"
                width="48"
                height="48"
                class="tab-icon"
                priority
              />
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
            @if (pet.primaryImage) {
            <img
              [ngSrc]="pet.primaryImage"
              [alt]="pet.name"
              fill
              class="pet-image"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            } @else {
            <div class="placeholder-image">{{ pet.name }}</div>
            }
            <button
              class="favorite-button"
              [class.favorited]="favoritePetIds().has(pet.id)"
              (click)="toggleFavorite(pet.id, $event)"
              title="Adicionar aos favoritos"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                [attr.fill]="
                  favoritePetIds().has(pet.id) ? 'currentColor' : 'none'
                "
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          <div class="pet-info">
            <h3 class="pet-name">{{ pet.name }}</h3>

            <div class="pet-details">
              <div class="detail-item">
                <img
                  ngSrc="assets/location.webp"
                  alt="Location"
                  width="14"
                  height="18"
                  class="detail-icon"
                />
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
                    d="M9 9c1.29 0 2.42.59 3.16 1.51L17.34 5.3l-2.83-.01.01-2 6.99.01.01 7h-2l-.01-2.83-5.22 5.21A4.5 4.5 0 1 1 9 9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
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
                <img
                  ngSrc="assets/size.webp"
                  alt="Size"
                  width="18"
                  height="18"
                  class="detail-icon"
                />
                <span>{{ getSizeLabel(pet.size) }}</span>
              </div>

              <div class="detail-item">
                <svg
                  class="detail-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z"
                  />
                </svg>
                <span>{{ pet.age }} anos</span>
              </div>
            </div>

            <div class="ong-info">
              <img
                ngSrc="assets/ong.webp"
                alt="ONG"
                width="20"
                height="20"
                class="ong-icon"
              />
              <span>{{ pet.ong?.ongName || "N/A" }}</span>
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
          <span class="icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </span>
          <h2>Instalar Aubrigo</h2>
          <p>Siga os passos abaixo para adicionar o app à sua tela inicial</p>
        </div>

        <div class="instructions">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Toque no botão Compartilhar</h3>
              <p>
                Procure pelo ícone
                <strong>
                  <svg
                    width="16"
                    height="20"
                    viewBox="0 0 16 20"
                    fill="currentColor"
                    style="display: inline; vertical-align: middle;"
                  >
                    <path
                      d="M8 0L6.59 1.41L12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z"
                      transform="rotate(-90 8 8)"
                    />
                  </svg>
                </strong>
                na parte inferior da tela
              </p>
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
              <p>
                Toque em <strong>"Adicionar à Tela de Início"</strong> ou
                <strong>"Add to Home Screen"</strong>
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Confirme</h3>
              <p>
                Toque em <strong>"Adicionar"</strong> no canto superior direito
              </p>
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

      .pwa-install-button svg {
        width: 24px;
        height: 24px;
        color: #5cb5b0;
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
        gap: 12px;
        margin-bottom: 20px;
      }

      .location-search-container {
        width: 100%;
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

      /* ONG Filter */
      .ong-search-container {
        width: 100%;
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(184, 227, 225, 0.3);
        padding: 12px 16px;
        border-radius: 12px;
      }

      .ong-filter-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .ong-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 15px;
        color: #2c2c2c;
        font-weight: 500;
        outline: none;
      }

      .ong-input::placeholder {
        color: #999999;
        font-weight: 400;
      }

      .clear-ong-button {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #666;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .clear-ong-button:hover {
        background: rgba(0, 0, 0, 0.2);
        color: #2c2c2c;
      }

      .ong-dropdown {
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

      .ong-option {
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

      .ong-option:hover {
        background: rgba(184, 227, 225, 0.2);
      }

      .ong-option.selected {
        background: rgba(184, 227, 225, 0.5);
        font-weight: 600;
      }

      .ong-location {
        font-size: 13px;
        color: #666;
        font-weight: 400;
        margin-left: auto;
      }

      /* Filters Row */
      .filters-row {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        flex-wrap: wrap;
      }

      .filter-select {
        flex: 1;
        min-width: 140px;
        padding: 10px 16px;
        background: rgba(184, 227, 225, 0.3);
        border: 2px solid transparent;
        border-radius: 12px;
        font-size: 14px;
        color: #2c2c2c;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
      }

      .filter-select:hover {
        background: rgba(184, 227, 225, 0.5);
      }

      .filter-select:focus {
        border-color: #4ca8a0;
        background: white;
      }

      .filter-select option:first-child {
        color: #666;
      }

      /* Hide mobile inline filters */
      .mobile-filters {
        display: none;
      }

      /* Filters dropdown for all devices */
      .filters-desktop-container {
        display: block;
        position: relative;
      }

      .filters-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 20px;
        background: #4ca8a0;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
        transition: all 0.2s ease;
        position: relative;
        width: 100%;
      }

      .filters-toggle-button:hover {
        background: #3d9690;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(76, 168, 160, 0.4);
      }

      .filter-icon {
        width: 20px;
        height: 20px;
      }

      .chevron-icon {
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
      }

      .chevron-icon.rotated {
        transform: rotate(180deg);
      }

      .active-filters-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #e74c3c;
        color: white;
        font-size: 11px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .filters-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .filters-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        left: 0;
        right: 0;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .filters-dropdown-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .filter-label {
        font-size: 13px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .filter-select-dropdown {
        width: 100%;
        padding: 12px 16px;
        background: rgba(184, 227, 225, 0.2);
        border: 2px solid transparent;
        border-radius: 10px;
        font-size: 15px;
        color: #2c2c2c;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
      }

      .filter-select-dropdown:hover {
        background: rgba(184, 227, 225, 0.4);
      }

      .filter-select-dropdown:focus {
        border-color: #4ca8a0;
        background: white;
      }

      .clear-filters-button {
        width: 100%;
        padding: 12px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 8px;
      }

      .clear-filters-button:hover {
        background: #c0392b;
        transform: translateY(-1px);
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
        justify-content: space-between;
      }

      .species-tab {
        flex: 1;
        max-width: 80px;
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
        width: 45px;
        height: 45px;
        object-fit: contain;
        border-radius: 8px;
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

      .placeholder-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
        color: #4ca8a0;
        font-size: 24px;
        font-weight: 600;
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
        color: #e74c3c;
        background: #fff5f5;
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

      .detail-icon[src*="location.webp"] {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .detail-icon[src*="size.png"] {
        object-fit: contain;
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
          gap: 16px;
        }

        .location-search-container {
          flex: 1;
          padding: 16px 20px;
        }

        .location-icon {
          width: 24px;
          height: 24px;
        }

        .location-input {
          font-size: 17px;
        }

        .ong-search-container {
          flex: 1;
          padding: 16px 20px;
        }

        .ong-filter-icon {
          width: 20px;
          height: 20px;
        }

        .ong-input {
          font-size: 17px;
        }

        /* Desktop adjustments for dropdown */
        .filters-toggle-button {
          width: auto;
          min-width: 160px;
        }

        .filters-dropdown {
          left: auto;
          right: 0;
          min-width: 340px;
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

      .modal-header .icon svg {
        width: 48px;
        height: 48px;
        color: #5cb5b0;
      }

      .modal-header h2 {
        font-size: 24px;
        font-weight: 700;
        color: #2c2c2c;
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
        color: #2c2c2c;
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
  private analytics = inject(AnalyticsService);
  private usersService = inject(UsersService);

  pets = signal<Pet[]>([]);
  loading = signal(true);
  selectedSpecies = signal<string>("dog");
  sortBy = signal<string>("urgent");
  selectedGender = signal<string>("");
  selectedSize = signal<string>("");
  selectedAgeRange = signal<string>("");
  showFiltersDropdown = signal(false);
  showIosInstructions = signal(false);
  currentLocation = signal("Todas as cidades");
  favoritePetIds = signal<Set<string>>(new Set());
  visitorEmail: string | null = null;

  // Location typeahead
  showLocationDropdown = signal(false);
  availableLocations: string[] = ["Todas as cidades"];
  filteredLocations = signal<string[]>(this.availableLocations);
  selectedLocationIndex = signal(-1);

  // ONG filter
  currentOng = signal<string | null>(null);
  showOngDropdown = signal(false);
  availableOngs = signal<ONG[]>([]);
  filteredOngs = signal<ONG[]>([]);
  selectedOngIndex = signal(-1);
  ongInput = signal("");

  ngOnInit() {
    this.loadCitiesWithPets();
    this.loadOngs();
    this.loadPets();
    this.initFavorites();

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".location-search-container")) {
        this.showLocationDropdown.set(false);
      }
      if (!target.closest(".ong-search-container")) {
        this.showOngDropdown.set(false);
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
        const petIds = new Set(favorites.map((f) => f.pet.id));
        this.favoritePetIds.set(petIds);
      },
      error: (error) => {
        console.error("Error loading favorites:", error);
      },
    });
  }

  toggleFavorite(petId: string, event: Event) {
    event.stopPropagation(); // Prevent navigation to pet detail

    if (!this.visitorEmail) {
      this.toastService.warning("Por favor, configure seu e-mail primeiro");
      return;
    }

    const favorites = this.favoritePetIds();
    const isFavorited = favorites.has(petId);

    if (isFavorited) {
      // Remove from favorites
      this.favoritesService
        .removeFavoriteByPetId(petId, this.visitorEmail)
        .subscribe({
          next: () => {
            const newFavorites = new Set(favorites);
            newFavorites.delete(petId);
            this.favoritePetIds.set(newFavorites);
            this.toastService.success("Removido dos favoritos");
          },
          error: (error) => {
            console.error("Error removing favorite:", error);
            this.toastService.error("Erro ao remover dos favoritos");
          },
        });
    } else {
      // Add to favorites
      this.favoritesService.addToFavorites(petId, this.visitorEmail).subscribe({
        next: () => {
          const newFavorites = new Set(favorites);
          newFavorites.add(petId);
          this.favoritePetIds.set(newFavorites);
          this.toastService.success("Adicionado aos favoritos");
        },
        error: (error) => {
          console.error("Error adding favorite:", error);
          this.toastService.error("Erro ao adicionar aos favoritos");
        },
      });
    }
  }

  loadPets() {
    this.loading.set(true);

    const params: SearchPetsParams = {};

    // Add ONG filter if selected
    if (this.currentOng()) {
      params.ongId = this.currentOng()!;
    }

    // Add species filter if selected
    if (this.selectedSpecies()) {
      params.species = this.selectedSpecies();
    }

    // Add location filter if selected and not "Todas as cidades"
    if (
      this.currentLocation() &&
      this.currentLocation() !== "Todas as cidades"
    ) {
      params.location = this.currentLocation();
    }

    // Add sort parameter if selected
    if (this.sortBy()) {
      params.sortBy = this.sortBy();
    }

    // Add gender filter if selected
    if (this.selectedGender()) {
      params.gender = this.selectedGender();
    }

    // Add size filter if selected
    if (this.selectedSize()) {
      params.size = this.selectedSize();
    }

    // Add age range filter if selected
    if (this.selectedAgeRange()) {
      params.ageRange = this.selectedAgeRange();
    }

    this.petsService.searchPets(params).subscribe({
      next: (response) => {
        const results = response.data || [];
        this.pets.set(results);
        this.loading.set(false);

        // Track search/filter usage
        this.analytics.track(EventType.SEARCH, {
          metadata: {
            species: params.species || "all",
            location: params.location || "all",
            resultsCount: results.length,
          },
        });
      },
      error: (error) => {
        console.error("Error loading pets:", error);
        this.toastService.error("Erro ao carregar pets");
        this.loading.set(false);
        this.pets.set([]);
      },
    });
  }

  filterBySpecies(species: string) {
    this.selectedSpecies.set(species);

    // Track filter application
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "species",
        value: species,
      },
    });

    this.loadPets();
  }

  getSizeLabel(size?: string): string {
    if (!size) return "N/A";
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
      this.toastService.success(
        "App instalado! Acesse pelo ícone na tela inicial"
      );
    } else {
      this.toastService.info(
        "Adicione o Aubrigo à sua tela inicial para acesso rápido!"
      );
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
        console.error("Error loading cities:", error);
        // Keep default if error
      },
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
    return location === "Todas as cidades"
      ? "Todas as cidades"
      : "Digite uma cidade...";
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
      .filter((location) =>
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
      if (event.key === "Enter") {
        this.onEnterKey();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedLocationIndex.update((idx) =>
          idx < locations.length - 1 ? idx + 1 : idx
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        this.selectedLocationIndex.update((idx) => (idx > 0 ? idx - 1 : -1));
        break;

      case "Enter":
        event.preventDefault();
        const selectedIdx = this.selectedLocationIndex();
        if (selectedIdx >= 0 && selectedIdx < locations.length) {
          this.selectLocation(locations[selectedIdx]);
        } else {
          this.onEnterKey();
        }
        break;

      case "Escape":
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

    // Track filter application
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "location",
        value: location,
      },
    });

    // Reload pets with location filter
    this.loadPets();
  }

  // ONG filter methods
  loadOngs() {
    this.usersService.getAllOngs().subscribe({
      next: (ongs) => {
        this.availableOngs.set(ongs);
        this.filteredOngs.set(ongs.slice(0, 5));
      },
      error: (error) => {
        console.error("Error loading ONGs:", error);
      },
    });
  }

  getOngInputValue(): string {
    const ongId = this.currentOng();
    if (!ongId) return "";

    const ong = this.availableOngs().find((o) => o.id === ongId);
    return ong?.ongName || "";
  }

  getOngPlaceholder(): string {
    return this.currentOng() ? "Digite o nome da ONG..." : "Todas as ONGs";
  }

  onOngFocus() {
    this.filteredOngs.set(this.availableOngs().slice(0, 5));
    this.showOngDropdown.set(true);
    this.selectedOngIndex.set(-1);
  }

  onOngInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.ongInput.set(input);

    if (!input) {
      this.currentOng.set(null);
      this.filteredOngs.set(this.availableOngs().slice(0, 5));
      this.showOngDropdown.set(true);
      this.selectedOngIndex.set(-1);
      return;
    }

    const filtered = this.availableOngs()
      .filter((ong) => ong.ongName.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);

    this.filteredOngs.set(filtered);
    this.showOngDropdown.set(true);
    this.selectedOngIndex.set(-1);
  }

  onOngKeydown(event: KeyboardEvent) {
    const ongs = this.filteredOngs();

    if (!this.showOngDropdown() || ongs.length === 0) {
      if (event.key === "Enter") {
        this.onOngEnterKey();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.selectedOngIndex.update((idx) =>
          idx < ongs.length - 1 ? idx + 1 : idx
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        this.selectedOngIndex.update((idx) => (idx > 0 ? idx - 1 : -1));
        break;

      case "Enter":
        event.preventDefault();
        const selectedIdx = this.selectedOngIndex();
        if (selectedIdx >= 0 && selectedIdx < ongs.length) {
          this.selectOng(ongs[selectedIdx]);
        } else {
          this.onOngEnterKey();
        }
        break;

      case "Escape":
        event.preventDefault();
        this.showOngDropdown.set(false);
        this.selectedOngIndex.set(-1);
        break;
    }
  }

  onOngEnterKey() {
    this.showOngDropdown.set(false);
    this.selectedOngIndex.set(-1);
    this.loadPets();
  }

  selectOng(ong: ONG) {
    this.currentOng.set(ong.id);
    this.ongInput.set(ong.ongName);
    this.showOngDropdown.set(false);
    this.selectedOngIndex.set(-1);
    this.filteredOngs.set(this.availableOngs().slice(0, 5));

    // Track filter application
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "ong",
        value: ong.ongName,
      },
    });

    this.loadPets();
  }

  clearOngFilter() {
    this.currentOng.set(null);
    this.ongInput.set("");
    this.filteredOngs.set(this.availableOngs().slice(0, 5));
    this.loadPets();
  }

  // Sort methods
  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);

    // Track sort change
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "sort",
        value: value || "default",
      },
    });

    this.loadPets();
  }

  onGenderChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGender.set(value);

    // Track filter change
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "gender",
        value: value || "all",
      },
    });

    this.loadPets();
  }

  onSizeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSize.set(value);

    // Track filter change
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "size",
        value: value || "all",
      },
    });

    this.loadPets();
  }

  onAgeRangeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedAgeRange.set(value);

    // Track filter change
    this.analytics.track(EventType.FILTER_APPLY, {
      metadata: {
        filterType: "ageRange",
        value: value || "all",
      },
    });

    this.loadPets();
  }

  // Filters dropdown methods
  toggleFiltersDropdown() {
    this.showFiltersDropdown.update(val => !val);
  }

  closeFiltersDropdown() {
    this.showFiltersDropdown.set(false);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedGender() ||
      this.selectedSize() ||
      this.selectedAgeRange()
    );
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedGender()) count++;
    if (this.selectedSize()) count++;
    if (this.selectedAgeRange()) count++;
    return count;
  }

  clearAllFilters() {
    this.selectedGender.set("");
    this.selectedSize.set("");
    this.selectedAgeRange.set("");
    this.loadPets();
  }
}

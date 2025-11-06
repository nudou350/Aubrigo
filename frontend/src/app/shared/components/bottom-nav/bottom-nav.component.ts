import { Component, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { AuthService } from "../../../core/services/auth.service";
import { PwaService } from "../../../core/services/pwa.service";

@Component({
  selector: "app-bottom-nav",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Install PWA button - floating bottom right (mobile only) -->
    @if (shouldShowNav() && !authService.isOng() && !authService.isAdmin()) {
    <button
      (click)="onInstallClick()"
      class="install-float-button"
      title="Instalar App"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
    </button>
    }

    <!-- Mobile Bottom Navigation -->
    <nav class="bottom-nav mobile-nav" *ngIf="shouldShowNav()">
      <a routerLink="/home" class="nav-item" [class.active]="isActive('/home')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span class="nav-label">HOME</span>
      </a>

      <!-- Central button: Toggle between ONGs and Pets -->
      @if (isActive('/ongs')) {
      <!-- Show Pets button when on ONGs page -->
      <a routerLink="/home" class="nav-item nav-item-center">
        <div class="paw-button">
          <img src="assets/paw_home.webp" alt="Pets" class="paw-image" />
        </div>
        <span class="nav-label">PETS</span>
      </a>
      } @else {
      <!-- Show ONGs button when NOT on ONGs page -->
      <a routerLink="/ongs" class="nav-item nav-item-center" [class.active]="isActive('/ongs')">
        <div class="paw-button">
          <svg class="paw-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </div>
        <span class="nav-label">ONGS</span>
      </a>
      }

      <!-- Show Favorites for regular users, Dashboard for ONG/Admin -->
      @if (!authService.isOng() && !authService.isAdmin()) {
      <a
        routerLink="/favorites"
        class="nav-item"
        [class.active]="isActive('/favorites')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <span class="nav-label">FAVORITOS</span>
      </a>
      } @else if (authService.isOng()) {
      <a routerLink="/ong" class="nav-item" [class.active]="isActive('/ong')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
          />
        </svg>
        <span class="nav-label">DASHBOARD</span>
      </a>
      } @else {
      <a
        routerLink="/admin"
        class="nav-item"
        [class.active]="isActive('/admin')"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
          />
        </svg>
        <span class="nav-label">DASHBOARD</span>
      </a>
      }
    </nav>

    <!-- Desktop Top Navigation -->
    <nav class="top-nav desktop-nav" *ngIf="shouldShowNav()">
      <div class="top-nav-container">
        <div class="nav-brand">
          <div class="brand-logo">
            <svg class="brand-paw" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="6" r="2" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="6" cy="12" r="2" />
              <circle cx="18" cy="12" r="2" />
              <ellipse cx="12" cy="16" rx="4" ry="3" />
            </svg>
          </div>
          <span class="brand-name">Pet SOS</span>
        </div>

        <div class="nav-links">
          <a
            routerLink="/home"
            class="nav-link"
            [class.active]="isActive('/home')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Home</span>
          </a>

          <!-- ONGs Link -->
          <a
            routerLink="/ongs"
            class="nav-link"
            [class.active]="isActive('/ongs')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>ONGs</span>
          </a>

          <!-- Admin Dashboard Link -->
          @if (authService.isAdmin()) {
          <a
            routerLink="/admin"
            class="nav-link"
            [class.active]="isActive('/admin')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
              />
            </svg>
            <span>Admin</span>
          </a>
          }

          <!-- ONG Dashboard Link -->
          @if (authService.isOng()) {
          <a
            routerLink="/ong"
            class="nav-link"
            [class.active]="isActive('/ong')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
              />
            </svg>
            <span>Dashboard</span>
          </a>
          }

          <!-- Show Favorites for regular users -->
          @if (!authService.isOng() && !authService.isAdmin()) {
          <a
            routerLink="/favorites"
            class="nav-link"
            [class.active]="isActive('/favorites')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <span>Favoritos</span>
          </a>
          }

          <a
            routerLink="/donate"
            class="nav-link"
            [class.active]="isActive('/donate')"
          >
            <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <span>Doar</span>
          </a>

          <!-- @if (authService.isAuthenticated()) {
            <a routerLink="/profile" class="nav-link" [class.active]="isActive('/profile')">
              <svg class="link-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Perfil</span>
            </a>
          } -->
        </div>

        <div class="nav-actions">
          @if (authService.isAuthenticated()) {
          <!-- Only show Add Pet button for ONG users -->
          @if (authService.isOng()) {
          <button (click)="onAddPet()" class="nav-cta">
            <svg class="cta-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>Adicionar Pet</span>
          </button>
          }
          <button (click)="onLogout()" class="nav-logout">Sair</button>
          } @else {
          <button (click)="goToLogin()" class="nav-login">
            Login / Registrar
          </button>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      /* Mobile Bottom Navigation - Following design image */
      .mobile-nav {
        display: flex;
      }

      .desktop-nav {
        display: none;
      }

      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: #b8e3e1;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0 20px;
        z-index: 1000;
        box-shadow: 0px -2px 8px rgba(0, 0, 0, 0.08);
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: #4ca8a0;
        transition: all 0.2s ease;
        flex: 1;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        min-height: 44px;
      }

      .nav-item.active {
        color: #4ca8a0;
      }

      .nav-item:hover {
        opacity: 0.8;
      }

      .nav-icon {
        width: 24px;
        height: 24px;
      }

      .nav-label {
        font-size: 10px;
        font-weight: 500;
        font-family: "Inter", sans-serif;
        text-transform: uppercase;
        color: #4ca8a0;
        margin-top: 2px;
      }

      .nav-item-center {
        position: relative;
        margin-bottom: 25px;
      }

      .paw-button {
        width: 60px;
        height: 60px;
        background: #4ca8a0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 4px 12px rgba(76, 168, 160, 0.4);
        transition: all 0.2s ease;
      }

      .nav-item-center:hover .paw-button {
        transform: scale(1.05);
        box-shadow: 0px 6px 16px rgba(76, 168, 160, 0.5);
      }

      .nav-item-center:active .paw-button {
        transform: scale(0.95);
      }

      .paw-icon {
        width: 30px;
        height: 30px;
        color: #ffffff;
      }

      .paw-image {
        width: 40px;
        height: 40px;
        object-fit: contain;
      }

      /* Install PWA Floating Button - Bottom right */
      .install-float-button {
        position: fixed;
        bottom: 100px; /* Above bottom nav with spacing */
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(76, 168, 160, 0.4);
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 999;
      }

      .install-float-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(76, 168, 160, 0.5);
      }

      .install-float-button:active {
        transform: translateY(0);
      }

      .install-float-button svg {
        width: 28px;
        height: 28px;
        color: #ffffff;
      }

      /* Desktop Top Navigation */
      @media (min-width: 1024px) {
        .mobile-nav {
          display: none;
        }

        .desktop-nav {
          display: block;
        }

        .install-float-button {
          display: none;
        }

        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ffffff;
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 1000;
        }

        .top-nav-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
        }

        .brand-logo {
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0px 2px 8px rgba(76, 168, 160, 0.3);
        }

        .brand-paw {
          width: 28px;
          height: 28px;
          color: #ffffff;
        }

        .brand-name {
          font-size: 28px;
          font-weight: 600;
          color: var(--color-primary);
          font-family: "Inter", sans-serif;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: 18px;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(76, 168, 160, 0.08);
          color: var(--color-primary);
        }

        .nav-link.active {
          color: var(--color-primary);
          background: rgba(76, 168, 160, 0.12);
        }

        .link-icon {
          width: 24px;
          height: 24px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-primary);
          color: #ffffff;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0px 4px 12px rgba(76, 168, 160, 0.3);
        }

        .nav-cta:hover {
          background: #3d9690;
          transform: translateY(-1px);
          box-shadow: 0px 6px 16px rgba(76, 168, 160, 0.4);
        }

        .nav-cta:active {
          transform: translateY(0);
        }

        .nav-login {
          background: transparent;
          color: var(--color-primary);
          border: 2px solid var(--color-primary);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-login:hover {
          background: var(--color-primary);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .nav-login:active {
          transform: translateY(0);
        }

        .nav-logout {
          background: transparent;
          color: #e74c3c;
          border: 2px solid #e74c3c;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-logout:hover {
          background: #e74c3c;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .nav-logout:active {
          transform: translateY(0);
        }

        .cta-icon {
          width: 22px;
          height: 20px;
        }
      }

      @media (max-width: 414px) {
        .bottom-nav {
          padding: 0 16px;
        }
      }
    `,
  ],
})
export class BottomNavComponent {
  private router = Router;
  currentRoute = signal<string>("");
  authService = inject(AuthService);
  private pwaService = inject(PwaService);

  constructor(private routerInstance: Router) {
    // Track current route
    this.currentRoute.set(this.routerInstance.url);
    this.routerInstance.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });
  }

  shouldShowNav(): boolean {
    // Always show navigation globally
    return true;
  }

  isActive(route: string): boolean {
    const current = this.currentRoute();
    if (route === "/home") {
      return current === "/" || current === "/home";
    }
    return current.startsWith(route);
  }

  onAddPet(): void {
    if (this.authService.isOng()) {
      this.routerInstance.navigate(["/pets/add"]);
    } else if (this.authService.isAuthenticated()) {
      // Already authenticated but not ONG - redirect to home
      this.routerInstance.navigate(["/home"]);
    } else {
      this.routerInstance.navigate(["/login"]);
    }
  }

  goToLogin(): void {
    this.routerInstance.navigate(["/login"]);
  }

  onLogout(): void {
    this.authService.logout();
  }

  async onInstallClick(): Promise<void> {
    await this.pwaService.promptInstall();
  }
}

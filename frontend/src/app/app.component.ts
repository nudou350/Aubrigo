import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { UpdateNotificationComponent } from './shared/components/update-notification/update-notification.component';
import { InstallPromptComponent } from './shared/components/install-prompt/install-prompt.component';
import { NetworkStatusComponent } from './shared/components/network-status/network-status.component';
import { OfflineSyncBadgeComponent } from './shared/components/offline-sync-badge/offline-sync-badge.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent, UpdateNotificationComponent, InstallPromptComponent, NetworkStatusComponent, OfflineSyncBadgeComponent],
  template: `
    <div class="app-container">
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-bottom-nav></app-bottom-nav>
      <footer class="web-footer">
        <div class="footer-content">
          <p>
            <span>Desenvolvido por</span>
            <a href="https://www.linkedin.com/in/dev-raphaelp/" target="_blank" rel="noopener noreferrer">
              Raphael Pereira
            </a>
          </p>
          <span class="separator">•</span>
          <p>
            <span>Design por</span>
            <a href="https://www.linkedin.com/in/tharaujovieira/" target="_blank" rel="noopener noreferrer">
              Thaís Araújo
            </a>
          </p>
        </div>
      </footer>
      <app-update-notification></app-update-notification>
      <app-install-prompt></app-install-prompt>
      <app-network-status></app-network-status>
      <app-offline-sync-badge></app-offline-sync-badge>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding-bottom: 68px; /* Height of bottom navigation on mobile */
      background: #ffffff;
    }

    /* Footer - Visible on all devices */
    .web-footer {
      background: #f9f9f9;
      border-top: 1px solid #e0e0e0;
      padding: 20px 16px;
      margin-top: 40px;
      margin-bottom: 68px; /* Space for bottom navigation on mobile */
    }

    .footer-content {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .footer-content p {
      margin: 0;
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .footer-content a {
      color: #4ca8a0;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }

    .footer-content a:hover {
      color: #3a8d86;
      text-decoration: underline;
    }

    .separator {
      color: #ccc;
      font-size: 12px;
    }

    /* Desktop: Add top padding for fixed top navigation */
    @media (min-width: 1024px) {
      .main-content {
        padding-top: 88px; /* Height of larger top navigation */
        padding-bottom: 0;
      }

      .web-footer {
        padding: 24px 32px;
        margin-top: 60px;
        margin-bottom: 0; /* No bottom navbar on desktop */
      }

      .footer-content {
        gap: 16px;
      }

      .footer-content p {
        font-size: 14px;
        gap: 6px;
      }

      .separator {
        font-size: 14px;
      }
    }
  `],
})
export class AppComponent {
  title = 'Aubrigo';
}

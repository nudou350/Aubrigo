import { Component, ChangeDetectionStrategy, OnInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { UpdateNotificationComponent } from './shared/components/update-notification/update-notification.component';
import { InstallPromptComponent } from './shared/components/install-prompt/install-prompt.component';
import { NetworkStatusComponent } from './shared/components/network-status/network-status.component';
import { OfflineSyncBadgeComponent } from './shared/components/offline-sync-badge/offline-sync-badge.component';
import { CountryConfirmationDialogComponent } from './shared/components/country-confirmation-dialog/country-confirmation-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, BottomNavComponent, ToastComponent, UpdateNotificationComponent, InstallPromptComponent, NetworkStatusComponent, OfflineSyncBadgeComponent, CountryConfirmationDialogComponent, TranslateModule],
  template: `
    <div class="app-container">
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-bottom-nav></app-bottom-nav>
      <footer class="web-footer">
        <div class="footer-content">
          <p>
            <span>{{ 'footer.developedBy' | translate }}</span>
            <a href="https://www.linkedin.com/in/dev-raphaelp/" target="_blank" rel="noopener noreferrer">
              Raphael Pereira
            </a>
          </p>
          <span class="separator">•</span>
          <p>
            <span>{{ 'footer.designedBy' | translate }}</span>
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
      <app-country-confirmation-dialog></app-country-confirmation-dialog>
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
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);
  title = 'Aubrigo';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Initialize available languages
    this.translate.addLangs(['pt', 'es', 'en']);

    // Set default language
    this.translate.setDefaultLang('pt');
  }

  ngOnInit(): void {
    // Only execute in browser
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLanguage();
      this.updateHtmlLang();
    }
  }

  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem('appLanguage');

    if (savedLanguage && this.translate.langs.includes(savedLanguage)) {
      this.translate.use(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = this.translate.getBrowserLang();
      const langToUse = browserLang?.match(/pt|es|en/) ? browserLang : 'pt';
      this.translate.use(langToUse);
      localStorage.setItem('appLanguage', langToUse);
    }
  }

  private updateHtmlLang(): void {
    this.translate.onLangChange.subscribe((event) => {
      document.documentElement.lang = event.lang;
      localStorage.setItem('appLanguage', event.lang);
    });

    // Set initial lang attribute
    document.documentElement.lang = this.translate.currentLang || 'pt';
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Install Prompt Component
 *
 * Displays a smart, non-intrusive install prompt after user engagement.
 * Features:
 * - Shows after 3 page interactions (scrolls/clicks)
 * - Remembers if user dismissed it
 * - Special instructions for iOS users
 * - Highlights app benefits
 */
@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showPrompt()) {
      <div class="install-backdrop" (click)="dismiss()" [@fadeIn]>
        <div class="install-modal" (click)="$event.stopPropagation()" [@slideUp]>
          <!-- Close button -->
          <button class="close-btn" (click)="dismiss()" aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- App icon -->
          <div class="app-icon">
            <img src="/assets/icons/icon-192x192.png" alt="Aubrigo" />
          </div>

          <!-- Title and description -->
          <h2>Instalar Aubrigo</h2>
          <p class="subtitle">Tenha acesso rápido e recursos offline</p>

          <!-- Benefits list -->
          <ul class="benefits">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Acesso instantâneo da tela inicial</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span>Funciona mesmo sem internet</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mais rápido e sem anúncios</span>
            </li>
          </ul>

          <!-- iOS instructions (only on iOS) -->
          @if (isIOS) {
            <div class="ios-instructions">
              <p class="ios-title">Para instalar no iPhone/iPad:</p>
              <ol>
                <li>Toque no botão <strong>Compartilhar</strong>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: inline; vertical-align: middle;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </li>
                <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
                <li>Toque em <strong>"Adicionar"</strong></li>
              </ol>
            </div>
          }

          <!-- Action buttons -->
          <div class="actions">
            @if (!isIOS) {
              <button class="btn-install" (click)="install()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Instalar Agora
              </button>
            }
            <button class="btn-later" (click)="dismiss()">
              {{ isIOS ? 'Entendi' : 'Talvez Depois' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .install-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .install-modal {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #f5f5f5;
      color: #666;
    }

    .app-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .app-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #2C2C2C;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .subtitle {
      font-size: 16px;
      color: #666;
      margin: 0 0 24px 0;
      text-align: center;
    }

    .benefits {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
    }

    .benefits li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      color: #2C2C2C;
      font-size: 15px;
    }

    .benefits li svg {
      flex-shrink: 0;
      color: #5CB5B0;
      margin-top: 2px;
    }

    .ios-instructions {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .ios-title {
      font-weight: 600;
      color: #2C2C2C;
      margin: 0 0 12px 0;
      font-size: 15px;
    }

    .ios-instructions ol {
      margin: 0;
      padding-left: 20px;
      color: #666;
      font-size: 14px;
    }

    .ios-instructions li {
      margin-bottom: 8px;
      line-height: 1.6;
    }

    .ios-instructions strong {
      color: #2C2C2C;
      font-weight: 600;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn-install,
    .btn-later {
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-install {
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(92, 181, 176, 0.3);
    }

    .btn-install:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(92, 181, 176, 0.4);
    }

    .btn-install:active {
      transform: translateY(0);
    }

    .btn-later {
      background: transparent;
      color: #666;
      border: 1px solid #e0e0e0;
    }

    .btn-later:hover {
      background: #f5f5f5;
      border-color: #d0d0d0;
    }

    @media (max-width: 480px) {
      .install-modal {
        padding: 28px 20px;
      }

      h2 {
        font-size: 22px;
      }

      .subtitle {
        font-size: 15px;
      }

      .benefits li {
        font-size: 14px;
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateY(100px)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class InstallPromptComponent implements OnInit {
  private pwaService = inject(PwaService);

  // Control prompt visibility
  showPrompt = signal(false);

  // Check if iOS
  isIOS = false;

  // Tracking user interactions
  private interactionCount = 0;
  private readonly INTERACTIONS_THRESHOLD = 3;
  private readonly DISMISSED_KEY = 'pwa_install_dismissed';
  private readonly DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  ngOnInit(): void {
    this.isIOS = this.pwaService.isIOS();

    // Don't show if already installed or recently dismissed
    if (this.pwaService.isInstalled() || this.wasRecentlyDismissed()) {
      return;
    }

    // Track user interactions
    this.trackInteractions();
  }

  private trackInteractions(): void {
    const events = ['scroll', 'click', 'touchstart'];

    const handleInteraction = () => {
      this.interactionCount++;

      if (this.interactionCount >= this.INTERACTIONS_THRESHOLD) {
        // Remove listeners
        events.forEach(event => {
          document.removeEventListener(event, handleInteraction);
        });

        // Show prompt after a small delay
        setTimeout(() => {
          this.showPromptIfEligible();
        }, 1000);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: false });
    });
  }

  private showPromptIfEligible(): void {
    // Check if installable (or iOS, where we show instructions)
    if (this.pwaService.isInstallable() || this.isIOS) {
      this.showPrompt.set(true);
      console.log('📱 Install prompt shown after', this.interactionCount, 'interactions');
    }
  }

  private wasRecentlyDismissed(): boolean {
    const dismissedAt = localStorage.getItem(this.DISMISSED_KEY);
    if (!dismissedAt) return false;

    const dismissedTime = parseInt(dismissedAt, 10);
    const now = Date.now();

    return (now - dismissedTime) < this.DISMISS_DURATION;
  }

  async install(): Promise<void> {
    console.log('📥 User clicked install button');
    const accepted = await this.pwaService.promptInstall();

    if (accepted) {
      console.log('✅ User accepted install prompt');
      this.showPrompt.set(false);
    }
  }

  dismiss(): void {
    console.log('⏭️ User dismissed install prompt');

    // Save dismiss timestamp
    localStorage.setItem(this.DISMISSED_KEY, Date.now().toString());

    this.showPrompt.set(false);
  }
}

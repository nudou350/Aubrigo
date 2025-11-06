import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShareService } from '../../../core/services/share.service';
import { ToastService } from '../../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Share Button Component
 *
 * Reusable button with share menu for pets, ONGs, and general content.
 * Supports Web Share API and fallback to social media links.
 */
@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share-container">
      <button
        class="share-btn"
        [class.compact]="compact"
        (click)="toggleMenu()"
        [attr.aria-label]="ariaLabel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        @if (!compact) {
          <span>{{ buttonText }}</span>
        }
      </button>

      @if (showMenu()) {
        <div class="share-menu" [@slideIn] (click)="$event.stopPropagation()">
          <div class="menu-header">
            <h4>Compartilhar</h4>
            <button class="close-btn" (click)="closeMenu()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="menu-options">
            <!-- Native Share (if supported) -->
            @if (shareService.isShareSupported()) {
              <button class="option" (click)="handleNativeShare()">
                <div class="option-icon native">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <span>Compartilhar...</span>
              </button>
            }

            <!-- WhatsApp -->
            <button class="option" (click)="handleShare('whatsapp')">
              <div class="option-icon whatsapp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span>WhatsApp</span>
            </button>

            <!-- Facebook -->
            <button class="option" (click)="handleShare('facebook')">
              <div class="option-icon facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span>Facebook</span>
            </button>

            <!-- Twitter -->
            <button class="option" (click)="handleShare('twitter')">
              <div class="option-icon twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
              <span>Twitter</span>
            </button>

            <!-- Email -->
            <button class="option" (click)="handleShare('email')">
              <div class="option-icon email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Email</span>
            </button>

            <!-- Copy Link -->
            <button class="option" (click)="handleShare('copy')">
              <div class="option-icon copy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </div>
              <span>Copiar Link</span>
            </button>
          </div>
        </div>
      }

      @if (showMenu()) {
        <div class="backdrop" (click)="closeMenu()"></div>
      }
    </div>
  `,
  styles: [`
    .share-container {
      position: relative;
      display: inline-block;
    }

    .share-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: white;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      color: #5CB5B0;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .share-btn:hover {
      background: #F9F9F9;
      border-color: #5CB5B0;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(92, 181, 176, 0.2);
    }

    .share-btn.compact {
      padding: 10px;
      border-radius: 50%;
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
    }

    .share-menu {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      max-width: 600px;
      margin: 0 auto;
    }

    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #E0E0E0;
    }

    .menu-header h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #F0F0F0;
      color: #666;
    }

    .menu-options {
      padding: 16px 24px 32px;
      display: grid;
      gap: 8px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      background: transparent;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-size: 15px;
      font-weight: 500;
      color: #2C2C2C;
    }

    .option:hover {
      background: #F9F9F9;
    }

    .option:active {
      transform: scale(0.98);
    }

    .option-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .option-icon.native {
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
    }

    .option-icon.whatsapp {
      background: #25D366;
      color: white;
    }

    .option-icon.facebook {
      background: #1877F2;
      color: white;
    }

    .option-icon.twitter {
      background: #1DA1F2;
      color: white;
    }

    .option-icon.email {
      background: #EA4335;
      color: white;
    }

    .option-icon.copy {
      background: #F5F5F5;
      color: #5CB5B0;
    }

    @media (min-width: 768px) {
      .share-menu {
        position: absolute;
        bottom: auto;
        top: 100%;
        left: auto;
        right: 0;
        margin-top: 8px;
        border-radius: 12px;
        min-width: 280px;
      }

      .backdrop {
        display: none;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
  ],
})
export class ShareButtonComponent {
  public shareService = inject(ShareService);
  private toastService = inject(ToastService);

  @Input() shareData?: {
    title?: string;
    text?: string;
    url?: string;
  };

  @Input() buttonText: string = 'Compartilhar';
  @Input() compact: boolean = false;
  @Input() ariaLabel: string = 'Compartilhar conteúdo';

  /**
   * Emits the platform name when sharing succeeds.
   * Possible values: 'native', 'whatsapp', 'facebook', 'twitter', 'email'
   * Note: 'copy' does not emit an event as it's just copying the link
   */
  @Output() shareSuccess = new EventEmitter<string>();

  showMenu = signal(false);

  constructor() {
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (this.showMenu() && !(event.target as HTMLElement).closest('.share-container')) {
        this.closeMenu();
      }
    });
  }

  toggleMenu(): void {
    this.showMenu.set(!this.showMenu());
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }

  async handleNativeShare(): Promise<void> {
    const shared = await this.shareService.share(this.shareData || {});
    if (shared) {
      console.log('📤 Native share success');
      this.shareSuccess.emit('native');
      this.closeMenu();
    }
  }

  async handleShare(platform: 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'copy'): Promise<void> {
    const data = {
      text: this.shareData?.text || '',
      url: this.shareData?.url || window.location.href,
      subject: this.shareData?.title || 'Aubrigo'
    };

    const success = await this.shareService.shareVia(platform, data);

    if (success) {
      if (platform === 'copy') {
        this.toastService.success('Link copiado!');
      } else {
        console.log('📤 Share success via:', platform);
        this.shareSuccess.emit(platform);
      }
      this.closeMenu();
    } else {
      this.toastService.error('Erro ao compartilhar');
    }
  }
}

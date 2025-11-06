import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Share Target Component
 *
 * Handles shared content from other apps via Web Share Target API.
 * This page receives POST requests from the manifest share_target.
 *
 * When another app shares to Aubrigo, the user lands here.
 */
@Component({
  selector: 'app-share',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="share-page">
      <div class="share-container">
        <!-- Header -->
        <div class="share-header">
          <div class="icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h1>Conteúdo Compartilhado</h1>
          <p>Obrigado por compartilhar com o Aubrigo!</p>
        </div>

        <!-- Shared Content Display -->
        @if (sharedContent) {
          <div class="shared-content">
            @if (sharedContent.title) {
              <div class="content-item">
                <span class="label">Título:</span>
                <p>{{ sharedContent.title }}</p>
              </div>
            }

            @if (sharedContent.text) {
              <div class="content-item">
                <span class="label">Texto:</span>
                <p>{{ sharedContent.text }}</p>
              </div>
            }

            @if (sharedContent.url) {
              <div class="content-item">
                <span class="label">Link:</span>
                <a [href]="sharedContent.url" target="_blank" rel="noopener noreferrer">
                  {{ sharedContent.url }}
                </a>
              </div>
            }

            @if (sharedContent.files && sharedContent.files.length > 0) {
              <div class="content-item">
                <span class="label">Arquivos:</span>
                <div class="files-grid">
                  @for (file of sharedContent.files; track file.name) {
                    <div class="file-item">
                      @if (file.type.startsWith('image/')) {
                        <img [src]="file.preview" [alt]="file.name" />
                      }
                      <span class="file-name">{{ file.name }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Nenhum conteúdo compartilhado</p>
          </div>
        }

        <!-- Actions -->
        <div class="actions">
          <button class="btn-primary" (click)="goHome()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir para Início
          </button>

          @if (sharedContent?.url && isPetUrl(sharedContent?.url)) {
            <button class="btn-secondary" (click)="openSharedPet()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver Pet
            </button>
          }
        </div>

        <!-- Info Message -->
        <div class="info-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Este recurso permite que você compartilhe pets diretamente para o Aubrigo de outros aplicativos!</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .share-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .share-container {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .share-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #2C2C2C;
      margin: 0 0 8px 0;
    }

    .share-header p {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .shared-content {
      background: #F9F9F9;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .content-item {
      margin-bottom: 20px;
    }

    .content-item:last-child {
      margin-bottom: 0;
    }

    .label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #5CB5B0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .content-item p {
      margin: 0;
      font-size: 15px;
      color: #2C2C2C;
      line-height: 1.6;
    }

    .content-item a {
      color: #5CB5B0;
      text-decoration: none;
      word-break: break-all;
      font-size: 14px;
    }

    .content-item a:hover {
      text-decoration: underline;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .file-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      background: #E0E0E0;
    }

    .file-name {
      font-size: 12px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(92, 181, 176, 0.3);
    }

    .btn-secondary {
      background: white;
      color: #5CB5B0;
      border: 2px solid #5CB5B0;
    }

    .btn-secondary:hover {
      background: rgba(92, 181, 176, 0.1);
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #E3F2FD;
      border-radius: 12px;
      color: #1976D2;
      font-size: 14px;
      line-height: 1.5;
    }

    .info-message svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    @media (min-width: 768px) {
      .actions {
        flex-direction: row;
      }

      .btn-primary,
      .btn-secondary {
        flex: 1;
      }
    }

    @media (max-width: 480px) {
      .share-page {
        padding: 16px;
      }

      .share-container {
        padding: 24px 20px;
      }

      h1 {
        font-size: 24px;
      }

      .icon-wrapper {
        width: 64px;
        height: 64px;
      }
    }
  `],
})
export class ShareComponent implements OnInit {
  sharedContent: {
    title?: string;
    text?: string;
    url?: string;
    files?: Array<{
      name: string;
      type: string;
      preview?: string;
    }>;
  } | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    // Get shared data from query params (GET request)
    this.route.queryParams.subscribe(params => {
      if (params['title'] || params['text'] || params['url']) {
        this.sharedContent = {
          title: params['title'],
          text: params['text'],
          url: params['url']
        };
      }
    });

    // Handle POST data (from share_target)
    // Note: Angular doesn't directly handle POST form data in routing
    // You might need a backend endpoint to redirect GET request with query params
    // Or use service worker to intercept and transform

    console.log('📥 Share page loaded');
    console.log('Shared content:', this.sharedContent);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  isPetUrl(url: string | undefined): boolean {
    return url?.includes('/pets/') ?? false;
  }

  openSharedPet(): void {
    if (!this.sharedContent?.url) return;

    try {
      const urlObj = new URL(this.sharedContent.url);
      const path = urlObj.pathname;

      if (path.includes('/pets/')) {
        this.router.navigateByUrl(path);
      }
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  }
}

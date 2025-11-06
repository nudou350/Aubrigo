import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="isDark() ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
      [title]="isDark() ? 'Modo claro' : 'Modo escuro'"
    >
      <!-- Light Mode: Morning Scene (fundo branco = dia) -->
      <svg
        *ngIf="!isDark()"
        class="scene-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 60"
      >
        <!-- Sun (right side - BIGGER) -->
        <g class="sun">
          <circle cx="48" cy="12" r="7" fill="#fbbf24">
            <animate attributeName="r" values="7;7.8;7" dur="2s" repeatCount="indefinite"/>
          </circle>
          <!-- Sun rays -->
          <line x1="48" y1="3" x2="48" y2="0" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="48" y1="24" x2="48" y2="27" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="58" y1="12" x2="61" y2="12" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="38" y1="12" x2="35" y2="12" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="55" y1="5" x2="57" y2="3" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="41" y1="19" x2="39" y2="21" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="55" y1="19" x2="57" y2="21" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
          <line x1="41" y1="5" x2="39" y2="3" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Cloud (near sun - BIGGER and more to the left) -->
        <g class="cloud">
          <ellipse cx="33" cy="20" rx="4" ry="2.8" fill="#60a5fa" opacity="0.7">
            <animate attributeName="cx" values="33;35;33" dur="4s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="37" cy="20" rx="4.5" ry="3.2" fill="#60a5fa" opacity="0.7">
            <animate attributeName="cx" values="37;39;37" dur="4s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="41" cy="20" rx="4" ry="2.8" fill="#60a5fa" opacity="0.7">
            <animate attributeName="cx" values="41;43;41" dur="4s" repeatCount="indefinite"/>
          </ellipse>
        </g>

        <!-- Dog House (LOWER) -->
        <g class="house">
          <!-- House roof -->
          <path d="M 20 45 L 30 35 L 40 45 Z" fill="#ef4444"/>
          <!-- House body -->
          <rect x="22" y="45" width="16" height="12" fill="#d97706" rx="1"/>
          <!-- House entrance (arch) -->
          <path d="M 26 57 Q 26 50, 30 50 Q 34 50, 34 57 Z" fill="#1a1a1a"/>
          <!-- House details -->
          <line x1="30" y1="45" x2="30" y2="40" stroke="#d97706" stroke-width="0.5"/>
        </g>

        <!-- Ground -->
        <rect x="15" y="57" width="30" height="2" fill="#4ade80" opacity="0.7" rx="1"/>
      </svg>

      <!-- Dark Mode: Night Scene (fundo preto = noite) -->
      <svg
        *ngIf="isDark()"
        class="scene-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 60"
      >
        <!-- Stars (fewer but BIGGER) -->
        <g class="stars">
          <circle cx="10" cy="12" r="2" fill="#fbbf24" class="star">
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="18" cy="8" r="1.8" fill="#fbbf24" class="star">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="28" cy="10" r="2.2" fill="#fbbf24" class="star">
            <animate attributeName="opacity" values="1;0.5;1" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="38" cy="6" r="1.9" fill="#fbbf24" class="star">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="52" cy="8" r="2.1" fill="#fbbf24" class="star">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- Moon (right side - BIGGER crescent moon) -->
        <g class="moon">
          <circle cx="48" cy="14" r="7" fill="#fbbf24"/>
          <circle cx="51" cy="13" r="6" fill="var(--color-background)"/>
        </g>

        <!-- Dog House (LOWER) -->
        <g class="house">
          <!-- House roof -->
          <path d="M 20 45 L 30 35 L 40 45 Z" fill="#ef4444"/>
          <!-- House body -->
          <rect x="22" y="45" width="16" height="12" fill="#8B4513" rx="1"/>
          <!-- House entrance (arch) -->
          <path d="M 26 57 Q 26 50, 30 50 Q 34 50, 34 57 Z" fill="#2a2a2a"/>
          <!-- House details -->
          <line x1="30" y1="45" x2="30" y2="40" stroke="#8B4513" stroke-width="0.5"/>
        </g>

        <!-- Ground -->
        <rect x="15" y="57" width="30" height="2" fill="#27AE60" opacity="0.6" rx="1"/>
      </svg>
    </button>
  `,
  styles: [`
    .theme-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-background-secondary);
      border: 2px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-card);
      padding: 8px;
    }

    .theme-toggle:hover {
      background: var(--color-primary-lighter);
      border-color: var(--color-primary);
      transform: scale(1.08);
      box-shadow: var(--shadow-button);
    }

    .theme-toggle:active {
      transform: scale(0.95);
    }

    .scene-icon {
      width: 100%;
      height: 100%;
      transition: all 0.4s ease;
    }

    /* Animation effects */
    .stars circle,
    .moon circle,
    .sun circle,
    .cloud ellipse {
      transition: all 0.3s ease;
    }

    .theme-toggle:hover .scene-icon {
      transform: rotate(-5deg);
    }

    /* Responsive adjustments */
    @media (max-width: 767px) {
      .theme-toggle {
        bottom: 84px; /* Acima da bottom nav (68px) + espaçamento */
        right: 16px;
        width: 52px;
        height: 52px;
        padding: 6px;
      }
    }

    /* Desktop */
    @media (min-width: 1024px) {
      .theme-toggle {
        bottom: 32px;
        right: 32px;
        width: 60px;
        height: 60px;
      }
    }
  `]
})
export class ThemeToggleComponent {
  isDark = computed(() => this.themeService.currentTheme() === 'dark');

  constructor(private themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

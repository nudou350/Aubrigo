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
      <svg
        *ngIf="!isDark()"
        class="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
      </svg>
      <svg
        *ngIf="isDark()"
        class="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12,17a5,5,0,1,1,5-5A5,5,0,0,1,12,17Zm0-8a3,3,0,1,0,3,3A3,3,0,0,0,12,9ZM12,5V3a1,1,0,0,0-2,0V5a1,1,0,0,0,2,0Zm0,18V21a1,1,0,0,0-2,0v2a1,1,0,0,0,2,0ZM23,11H21a1,1,0,0,0,0,2h2a1,1,0,0,0,0-2ZM3,11H1a1,1,0,0,0,0,2H3a1,1,0,0,0,0-2ZM19.07,4.93a1,1,0,0,0-1.41,0l-1.42,1.42a1,1,0,0,0,1.42,1.41l1.41-1.42A1,1,0,0,0,19.07,4.93ZM7.76,17.24a1,1,0,0,0-1.42,0l-1.41,1.41a1,1,0,1,0,1.42,1.42l1.41-1.42A1,1,0,0,0,7.76,17.24ZM4.93,4.93a1,1,0,0,0,0,1.41L6.34,7.76A1,1,0,1,0,7.76,6.34L6.34,4.93A1,1,0,0,0,4.93,4.93ZM17.24,16.24,18.66,17.66a1,1,0,0,0,1.41-1.42l-1.41-1.41a1,1,0,0,0-1.42,1.41Z"/>
      </svg>
    </button>
  `,
  styles: [`
    .theme-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-background-secondary);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-light);
    }

    .theme-toggle:hover {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
      transform: scale(1.1);
    }

    .theme-toggle:active {
      transform: scale(0.95);
    }

    .icon {
      width: 20px;
      height: 20px;
      color: var(--color-text-primary);
      transition: all 0.3s ease;
    }

    .theme-toggle:hover .icon {
      color: var(--color-primary);
    }

    /* Responsive adjustments */
    @media (max-width: 767px) {
      .theme-toggle {
        bottom: 84px; /* Acima da bottom nav (68px) + espaçamento */
        right: 16px;
        width: 36px;
        height: 36px;
      }

      .icon {
        width: 18px;
        height: 18px;
      }
    }

    /* Desktop */
    @media (min-width: 1024px) {
      .theme-toggle {
        bottom: 32px;
        right: 32px;
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

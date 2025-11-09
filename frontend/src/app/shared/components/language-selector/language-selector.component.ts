import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  LanguageService,
  Language,
} from "../../../core/services/language.service";

@Component({
  selector: "app-language-selector",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector" (click)="$event.stopPropagation()">
      <button
        class="language-button"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'Language: ' + currentLanguage().name"
      >
        <img
          [src]="currentLanguage().flagSvg || currentLanguage().flag"
          [alt]="currentLanguage().name"
          class="flag-image"
        />
        <svg
          class="chevron-icon"
          [class.rotated]="isOpen()"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      @if (isOpen()) {
      <div class="language-dropdown">
        @for (lang of languages; track lang.code) {
        <button
          (click)="selectLanguage(lang.code)"
          [class.active]="lang.code === currentLanguageCode()"
          class="language-option"
          [attr.aria-label]="'Switch to ' + lang.name"
        >
          <img
            [src]="lang.flagSvg || lang.flag"
            [alt]="lang.name"
            class="flag-image"
          />
          <span class="language-name">{{ lang.name }}</span>
          @if (lang.code === currentLanguageCode()) {
          <svg class="check-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            />
          </svg>
          }
        </button>
        }
      </div>
      }
    </div>

    @if (isOpen()) {
    <div class="dropdown-backdrop" (click)="closeDropdown()"></div>
    }
  `,
  styles: [
    `
      .language-selector {
        position: relative;
        display: inline-block;
        z-index: 1001;
      }

      .language-button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        color: #2c2c2c;
        min-width: auto;
        height: 40px;
      }

      .language-button:hover {
        background: rgba(184, 227, 225, 0.5);
      }

      .flag-icon {
        font-size: 22px;
        line-height: 1;
      }

      .flag-image {
        width: 28px;
        height: 21px;
        object-fit: cover;
        border-radius: 2px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .language-name {
        flex: 1;
        text-align: left;
        font-weight: 500;
      }

      .chevron-icon {
        width: 18px;
        height: 18px;
        color: #4ca8a0;
        transition: transform 0.3s ease;
      }

      .chevron-icon.rotated {
        transform: rotate(180deg);
      }

      .language-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        z-index: 1002;
        animation: slideDown 0.2s ease;
        min-width: 140px;
        width: max-content;
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

      .language-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        border: none;
        background: white;
        cursor: pointer;
        transition: background 0.2s ease;
        text-align: left;
        font-size: 15px;
        color: #2c2c2c;
        white-space: nowrap;
      }

      .language-option:hover {
        background: rgba(184, 227, 225, 0.2);
      }

      .language-option.active {
        background: rgba(184, 227, 225, 0.3);
      }

      .language-option .language-name {
        flex: 1;
        font-weight: 500;
        min-width: 30px;
      }

      .check-icon {
        width: 20px;
        height: 20px;
        color: #4ca8a0;
      }

      .dropdown-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 1000;
      }

      /* Mobile Adjustments */
      @media (max-width: 767px) {
        .language-button {
          min-width: auto;
          padding: 8px 10px;
          font-size: 12px;
          gap: 4px;
          background: rgba(184, 227, 225, 0.3);
          height: 40px;
        }

        .language-name {
          font-size: 14px;
          font-weight: 600;
        }

        .language-dropdown {
          min-width: 130px;
        }

        .language-option {
          padding: 12px 16px;
          font-size: 14px;
        }

        .flag-icon {
          font-size: 20px;
        }

        .flag-image {
          width: 24px;
          height: 18px;
        }

        .chevron-icon {
          width: 14px;
          height: 14px;
        }
      }

      /* Desktop Adjustments */
      @media (min-width: 1024px) {
        .language-button {
          padding: 10px 16px;
          font-size: 15px;
        }

        .language-dropdown {
          min-width: 200px;
        }
      }
    `,
  ],
})
export class LanguageSelectorComponent implements OnInit {
  private languageService = inject(LanguageService);

  isOpen = signal(false);
  currentLanguageCode = signal("pt");
  currentLanguage = signal<Language>(
    this.languageService.getCurrentLanguageObject()
  );
  languages: Language[] = [];

  ngOnInit(): void {
    this.languages = this.languageService.getAvailableLanguages();
    this.currentLanguageCode.set(this.languageService.getCurrentLanguage());
    this.currentLanguage.set(this.languageService.getCurrentLanguageObject());

    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe((lang) => {
      this.currentLanguageCode.set(lang);
      this.currentLanguage.set(this.languageService.getCurrentLanguageObject());
      // Refresh languages to get updated flag
      this.languages = this.languageService.getAvailableLanguages();
    });
  }

  toggleDropdown(): void {
    this.isOpen.update((val) => !val);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectLanguage(code: string): void {
    this.languageService.setLanguage(code);
    this.closeDropdown();
  }
}

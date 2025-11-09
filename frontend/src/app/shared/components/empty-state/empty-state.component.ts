import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyStateIcon = 'pets' | 'favorites' | 'appointments' | 'search' | 'notifications' | 'generic';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        @switch (icon) {
          @case ('pets') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <ellipse cx="9" cy="11" rx="1" ry="1.5" fill="currentColor" stroke="none"/>
              <ellipse cx="15" cy="11" rx="1" ry="1.5" fill="currentColor" stroke="none"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 17.5c2.485 0 4.5-1.343 4.5-3h-9c0 1.657 2.015 3 4.5 3z"/>
              <ellipse cx="7" cy="8" rx="1.5" ry="2"/>
              <ellipse cx="17" cy="8" rx="1.5" ry="2"/>
              <ellipse cx="5" cy="13" rx="1.5" ry="2"/>
              <ellipse cx="19" cy="13" rx="1.5" ry="2"/>
            </svg>
          }
          @case ('favorites') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          @case ('appointments') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          @case ('search') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          @case ('notifications') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          @case ('generic') {
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        }
      </div>

      <h2 class="empty-title">{{ title }}</h2>

      @if (description) {
        <p class="empty-description">{{ description }}</p>
      }

      @if (buttonText) {
        <button class="empty-button" (click)="onButtonClick()">
          {{ buttonText }}
        </button>
      }

      @if (secondaryButtonText) {
        <button class="empty-button-secondary" (click)="onSecondaryButtonClick()">
          {{ secondaryButtonText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      min-height: 400px;
    }

    .empty-icon {
      margin-bottom: 24px;
      color: #B8E3E1;
      opacity: 0.8;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .empty-title {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 600;
      color: #2C2C2C;
      max-width: 400px;
    }

    .empty-description {
      margin: 0 0 32px 0;
      font-size: 16px;
      color: #666666;
      line-height: 1.6;
      max-width: 500px;
    }

    .empty-button {
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(92, 181, 176, 0.3);
    }

    .empty-button:hover {
      background: #4A9792;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(92, 181, 176, 0.4);
    }

    .empty-button:active {
      transform: translateY(0);
    }

    .empty-button-secondary {
      background: white;
      color: #5CB5B0;
      border: 2px solid #5CB5B0;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 12px;
    }

    .empty-button-secondary:hover {
      background: #F0F9F9;
    }

    @media (max-width: 768px) {
      .empty-state {
        padding: 40px 20px;
      }

      .empty-title {
        font-size: 20px;
      }

      .empty-description {
        font-size: 14px;
      }

      .empty-button,
      .empty-button-secondary {
        width: 100%;
        max-width: 300px;
      }
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'generic';
  @Input() title: string = '';
  @Input() description?: string;
  @Input() buttonText?: string;
  @Input() secondaryButtonText?: string;

  @Output() buttonClick = new EventEmitter<void>();
  @Output() secondaryButtonClick = new EventEmitter<void>();

  onButtonClick(): void {
    this.buttonClick.emit();
  }

  onSecondaryButtonClick(): void {
    this.secondaryButtonClick.emit();
  }
}

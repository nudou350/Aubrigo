import { Component, Input } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="back-button-overlay" (click)="goBack()" [attr.aria-label]="ariaLabel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  `,
  styles: [`
    .back-button-overlay {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .back-button-overlay svg {
      width: 24px;
      height: 24px;
      color: #5CB5B0;
    }

    .back-button-overlay:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .back-button-overlay:active {
      transform: scale(0.95);
    }

    /* Desktop adjustments */
    @media (min-width: 1024px) {
      .back-button-overlay {
        top: 120px; /* Below desktop navbar */
      }
    }
  `]
})
export class BackButtonComponent {
  @Input() ariaLabel = 'Voltar';
  @Input() fallbackRoute?: string;

  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    // Check if there's navigation history
    if (window.history.length > 1) {
      this.location.back();
    } else if (this.fallbackRoute) {
      // If no history, go to fallback route
      this.router.navigate([this.fallbackRoute]);
    } else {
      // Default fallback to home
      this.router.navigate(['/home']);
    }
  }
}

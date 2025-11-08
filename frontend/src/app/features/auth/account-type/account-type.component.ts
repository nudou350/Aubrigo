import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-account-type',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="account-type-container">
      <div class="content">
        <img src="assets/logo.svg" alt="Aubrigo" class="logo" *ngIf="false">
        <h1>{{ 'auth.accountType.title' | translate }}</h1>
        <p class="subtitle">{{ 'auth.accountType.subtitle' | translate }}</p>

        <div class="account-options">
          <button class="account-card" (click)="selectUserAccount()">
            <div class="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>{{ 'auth.accountType.user' | translate }}</h3>
            <p>{{ 'auth.accountType.userDescription' | translate }}</p>
            <ul class="features">
              <li>{{ 'auth.accountType.userFeature1' | translate }}</li>
              <li>{{ 'auth.accountType.userFeature2' | translate }}</li>
              <li>{{ 'auth.accountType.userFeature3' | translate }}</li>
              <li>{{ 'auth.accountType.userFeature4' | translate }}</li>
            </ul>
          </button>

          <button class="account-card" (click)="selectOngAccount()">
            <div class="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <h3>{{ 'auth.accountType.ong' | translate }}</h3>
            <p>{{ 'auth.accountType.ongDescription' | translate }}</p>
            <ul class="features">
              <li>{{ 'auth.accountType.ongFeature1' | translate }}</li>
              <li>{{ 'auth.accountType.ongFeature2' | translate }}</li>
              <li>{{ 'auth.accountType.ongFeature3' | translate }}</li>
              <li>{{ 'auth.accountType.ongFeature4' | translate }}</li>
            </ul>
          </button>
        </div>

        <p class="login-link">
          {{ 'auth.accountType.alreadyHaveAccount' | translate }}
          <a routerLink="/login">{{ 'auth.accountType.login' | translate }}</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .account-type-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, #B8E3E1 0%, #FFFFFF 100%);
    }

    .content {
      width: 100%;
      max-width: 900px;
      text-align: center;
    }

    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #2C2C2C;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 16px;
      color: #666666;
      margin-bottom: 40px;
    }

    .account-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .account-card {
      background: white;
      border: 2px solid #E0E0E0;
      border-radius: 16px;
      padding: 32px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;

      &:hover {
        border-color: #5CB5B0;
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(92, 181, 176, 0.15);
      }

      .icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #5CB5B0 0%, #4A9792 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;

        svg {
          color: white;
        }
      }

      h3 {
        font-size: 24px;
        font-weight: 600;
        color: #2C2C2C;
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: #666666;
        margin-bottom: 20px;
      }

      .features {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          font-size: 14px;
          color: #666666;
          padding: 8px 0;
          padding-left: 24px;
          position: relative;

          &::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #5CB5B0;
            font-weight: bold;
          }
        }
      }
    }

    .login-link {
      font-size: 14px;
      color: #666666;

      a {
        color: #5CB5B0;
        text-decoration: none;
        font-weight: 600;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 28px;
      }

      .account-options {
        grid-template-columns: 1fr;
      }

      .account-card {
        padding: 24px;
      }
    }
  `]
})
export class AccountTypeComponent {
  constructor(private router: Router) {}

  selectUserAccount(): void {
    this.router.navigate(['/register/user']);
  }

  selectOngAccount(): void {
    this.router.navigate(['/register/ong']);
  }
}

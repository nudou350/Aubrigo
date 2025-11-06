import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-screen">
      <div class="login-content">
        <div class="login-card">
          <!-- Login Title -->
          <div class="login-title-section">
            <h2 class="login-title">Login</h2>
          </div>

          <!-- Logo with Paw Print and Dogs -->
          <div class="logo-section">
            <div class="paw-background">
              <img src="assets/background_login.png" alt="Paw print" class="paw-print" />
            </div>
            <div class="dogs-overlay">
              <img src="assets/dogs_login.png" alt="Dogs" class="dogs-image" />
            </div>
          </div>

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }

            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <span class="form-error">Email inválido</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Senha</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="form-input"
                [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <span class="form-error">Senha é obrigatória</span>
              }
            </div>

            <div class="forgot-password-link">
              <a routerLink="/forgot-password">Esqueceu sua senha?</a>
            </div>

            <button
              type="submit"
              class="login-button"
              [disabled]="loginForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                LOGIN
              }
            </button>

            <div class="signup-link">
              Ainda não tem uma conta? <a routerLink="/register">Cadastre aqui</a>
            </div>
          </form>

          <!-- Test Accounts Info -->
          <div class="test-accounts">
            <h3 class="test-accounts-title">🧪 Contas de Teste</h3>
            <div class="test-account-section">
              <p class="account-type">🏠 ONGs:</p>
              <button type="button" class="test-account-btn" (click)="fillLogin('cantinho@animais.pt', 'Password123!')">
                cantinho&#64;animais.pt
              </button>
              <button type="button" class="test-account-btn" (click)="fillLogin('patinhas@amigas.pt', 'Password123!')">
                patinhas&#64;amigas.pt
              </button>
              <button type="button" class="test-account-btn" (click)="fillLogin('lar@peludo.pt', 'Password123!')">
                lar&#64;peludo.pt
              </button>
            </div>
            <div class="test-account-section">
              <p class="account-type">👤 Usuário:</p>
              <button type="button" class="test-account-btn" (click)="fillLogin('user@test.com', 'Password123!')">
                user&#64;test.com
              </button>
            </div>
            <p class="test-accounts-note">Senha para todas: <strong>Password123!</strong></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Mobile-first styles (320px - 767px) */
    .login-screen {
      min-height: 100vh;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .login-content {
      width: 100%;
      max-width: 375px;
    }

    .login-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px 20px;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
    }

    .login-title-section {
      text-align: center;
      margin-bottom: 20px;
    }

    .login-title {
      font-size: 28px;
      font-weight: 500;
      color: #7ec4c0;
      margin: 0;
      padding: 0;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 20px;
      position: relative;
      padding-top: 40px;
      min-height: 200px;
    }

    .paw-background {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 120px;
      z-index: 1;
    }

    .paw-print {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .dogs-overlay {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
      width: 100%;
    }

    .dogs-image {
      width: 100%;
      max-width: 220px;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .login-form {
      width: 100%;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      background: rgba(184, 227, 225, 0.3);
      border: none;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 16px;
      color: var(--color-text-primary);
      transition: all 0.2s ease;
    }

    .form-input:focus {
      background: rgba(184, 227, 225, 0.4);
      outline: none;
      box-shadow: 0 0 0 2px rgba(76, 168, 160, 0.2);
    }

    .form-input.error {
      border: 1px solid var(--color-error);
    }

    .form-error {
      color: var(--color-error);
      font-size: 12px;
      margin-top: 4px;
      display: block;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 12px;
      text-align: center;
      font-size: 13px;
    }

    .forgot-password-link {
      text-align: right;
      margin-bottom: 20px;
    }

    .forgot-password-link a {
      font-size: 13px;
      color: var(--color-primary);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .forgot-password-link a:hover {
      color: #3d9690;
      text-decoration: underline;
    }

    .login-button {
      width: 100%;
      background: var(--color-primary);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 15px;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0px 4px 12px rgba(76, 168, 160, 0.3);
      min-height: 48px;
    }

    .login-button:hover:not(:disabled) {
      background: #3d9690;
      transform: translateY(-1px);
      box-shadow: 0px 6px 16px rgba(76, 168, 160, 0.4);
    }

    .login-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .login-button:disabled {
      background: #cccccc;
      cursor: not-allowed;
      box-shadow: none;
    }

    .login-button .spinner {
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .signup-link {
      text-align: center;
      margin-top: 16px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .signup-link a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .signup-link a:hover {
      text-decoration: underline;
    }

    /* Test Accounts Section */
    .test-accounts {
      margin-top: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #f0faf9 0%, #e8f5f4 100%);
      border-radius: 12px;
      border: 2px dashed rgba(76, 168, 160, 0.3);
    }

    .test-accounts-title {
      font-size: 15px;
      font-weight: 600;
      color: #2C2C2C;
      margin: 0 0 16px 0;
      text-align: center;
    }

    .test-account-section {
      margin-bottom: 12px;
    }

    .test-account-section:last-of-type {
      margin-bottom: 16px;
    }

    .account-type {
      font-size: 13px;
      font-weight: 600;
      color: #666;
      margin: 0 0 8px 0;
    }

    .test-account-btn {
      width: 100%;
      background: white;
      color: var(--color-primary);
      border: 1px solid rgba(76, 168, 160, 0.3);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
    }

    .test-account-btn:last-child {
      margin-bottom: 0;
    }

    .test-account-btn:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: translateX(4px);
    }

    .test-account-btn:active {
      transform: translateX(2px);
    }

    .test-accounts-note {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin: 0;
      padding-top: 12px;
      border-top: 1px dashed rgba(76, 168, 160, 0.2);
    }

    .test-accounts-note strong {
      color: var(--color-primary);
      font-weight: 600;
    }

    /* Tablet adjustments (768px - 1023px) */
    @media (min-width: 768px) {
      .login-screen {
        padding: 32px;
      }

      .login-content {
        max-width: 450px;
      }

      .login-card {
        padding: 40px 32px;
      }

      .login-title {
        font-size: 32px;
      }

      .login-title-section {
        margin-bottom: 24px;
      }

      .logo-section {
        padding-top: 50px;
        min-height: 240px;
      }

      .paw-background {
        width: 140px;
        height: 140px;
      }

      .logo-text {
        font-size: 16px;
        top: 20px;
      }

      .dogs-image {
        max-width: 260px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        font-size: 15px;
        margin-bottom: 8px;
      }

      .form-input {
        padding: 14px 16px;
        font-size: 16px;
      }

      .forgot-password-link {
        margin-bottom: 24px;
      }

      .forgot-password-link a {
        font-size: 14px;
      }

      .login-button {
        padding: 16px;
        font-size: 16px;
      }

      .signup-link {
        margin-top: 20px;
        font-size: 14px;
      }

      .error-message {
        font-size: 14px;
        padding: 12px;
      }
    }

    /* Desktop styles (1024px+) */
    @media (min-width: 1024px) {
      .login-screen {
        padding: 48px;
        background: linear-gradient(135deg, #f8f8f8 0%, #e8f5f4 100%);
      }

      .login-content {
        max-width: 500px;
      }

      .login-card {
        padding: 48px 40px;
        box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
      }

      .login-title {
        font-size: 36px;
      }

      .login-title-section {
        margin-bottom: 28px;
      }

      .logo-section {
        padding-top: 60px;
        min-height: 280px;
      }

      .paw-background {
        width: 160px;
        height: 160px;
      }

      .logo-text {
        font-size: 18px;
        top: 25px;
      }

      .dogs-image {
        max-width: 300px;
      }

      .form-group {
        margin-bottom: 24px;
      }

      .form-label {
        font-size: 16px;
        margin-bottom: 10px;
      }

      .form-input {
        padding: 16px 18px;
        font-size: 16px;
        border-radius: 10px;
      }

      .form-input:hover {
        background: rgba(184, 227, 225, 0.35);
      }

      .forgot-password-link {
        margin-bottom: 28px;
      }

      .forgot-password-link a {
        font-size: 15px;
      }

      .login-button {
        padding: 18px;
        font-size: 17px;
        border-radius: 14px;
      }

      .signup-link {
        margin-top: 24px;
        font-size: 15px;
      }

      .error-message {
        font-size: 15px;
        padding: 14px;
      }
    }

    /* Large desktop (1440px+) */
    @media (min-width: 1440px) {
      .login-content {
        max-width: 550px;
      }

      .login-card {
        padding: 56px 48px;
      }

      .login-title {
        font-size: 40px;
      }

      .login-title-section {
        margin-bottom: 32px;
      }

      .logo-section {
        padding-top: 70px;
        min-height: 320px;
      }

      .paw-background {
        width: 180px;
        height: 180px;
      }

      .logo-text {
        top: 30px;
        font-size: 19px;
      }

      .dogs-image {
        max-width: 340px;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  fillLogin(email: string, password: string): void {
    this.loginForm.patchValue({
      email,
      password
    });
    this.loginForm.markAllAsTouched();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value as any).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Erro ao fazer login');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}

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
    <div class="screen">
      <div class="container">
        <div class="login-container">
          <div class="logo-section">
            <div class="paw-logo">🐾</div>
            <h1>Pet SOS</h1>
            <p class="subtitle">Bem-vindo de volta!</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                placeholder="seu@email.com"
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
                placeholder="Sua senha"
              />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <span class="form-error">Senha é obrigatória</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }

            <button
              type="submit"
              class="btn-primary"
              [disabled]="loginForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                LOGIN
              }
            </button>

            <div class="form-links">
              <a routerLink="/forgot-password" class="link">Esqueceu sua senha?</a>
              <p class="signup-link">
                Ainda não tem uma conta?
                <a routerLink="/register"> Cadastre aqui</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      padding-top: 48px;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 48px;
    }

    .paw-logo {
      font-size: 64px;
      margin-bottom: 16px;
    }

    h1 {
      color: var(--color-primary);
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-small);
    }

    .login-form {
      max-width: 400px;
      margin: 0 auto;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      padding: 12px;
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      text-align: center;
      font-size: var(--font-size-small);
    }

    .form-links {
      margin-top: var(--spacing-xl);
      text-align: center;
    }

    .link {
      display: block;
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-small);
    }

    .signup-link {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
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

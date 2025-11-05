import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reset-password-screen">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <button class="back-button" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 class="title">Redefinir Senha</h1>
        </div>

        <!-- Content -->
        <div class="content">
          @if (success()) {
            <!-- Success State -->
            <div class="success-container">
              <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h2>Senha Redefinida!</h2>
              <p>Sua senha foi alterada com sucesso.</p>
              <button class="btn-primary" (click)="goToLogin()">
                Ir para Login
              </button>
            </div>
          } @else {
            <!-- Form -->
            <div class="form-container">
              <div class="intro-text">
                <p>Digite sua nova senha abaixo.</p>
              </div>

              <form (ngSubmit)="resetPassword()">
                <div class="form-group">
                  <label for="newPassword">Nova Senha</label>
                  <div class="password-input">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      id="newPassword"
                      name="newPassword"
                      [(ngModel)]="formData.newPassword"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minlength="6"
                    />
                    <button
                      type="button"
                      class="toggle-password"
                      (click)="togglePassword()"
                    >
                      @if (showPassword()) {
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      }
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label for="confirmPassword">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    [(ngModel)]="formData.confirmPassword"
                    placeholder="Digite novamente"
                    required
                    minlength="6"
                  />
                </div>

                @if (errorMessage()) {
                  <div class="error-message">
                    {{ errorMessage() }}
                  </div>
                }

                <button
                  type="submit"
                  class="btn-submit"
                  [disabled]="submitting()"
                >
                  {{ submitting() ? 'Redefinindo...' : 'REDEFINIR SENHA' }}
                </button>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-screen {
      min-height: 100vh;
      background: linear-gradient(135deg, #B8E3E1 0%, #FFFFFF 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 480px;
    }

    .header {
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .back-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(184, 227, 225, 0.3);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: #4ca8a0;
    }

    .back-button:hover {
      background: rgba(184, 227, 225, 0.5);
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #4ca8a0;
      margin: 0;
    }

    .content {
      background: #ffffff;
      padding: 32px 24px;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .intro-text {
      margin-bottom: 24px;
      text-align: center;
    }

    .intro-text p {
      color: #666666;
      font-size: 15px;
      margin: 0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #2c2c2c;
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      background: #fafafa;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4ca8a0;
      background: #ffffff;
    }

    .password-input {
      position: relative;
    }

    .password-input input {
      padding-right: 48px;
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-password svg {
      width: 20px;
      height: 20px;
      color: #666666;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .btn-submit, .btn-primary {
      width: 100%;
      background: #4ca8a0;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-submit:hover:not(:disabled), .btn-primary:hover {
      background: #3d9690;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
    }

    .btn-submit:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    .success-container {
      text-align: center;
      padding: 20px 0;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #4ca8a0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .success-icon svg {
      width: 48px;
      height: 48px;
      color: #ffffff;
    }

    .success-container h2 {
      color: #2c2c2c;
      margin: 0 0 12px 0;
      font-size: 24px;
    }

    .success-container p {
      color: #666666;
      margin: 0 0 32px 0;
      font-size: 16px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  token = signal('');
  submitting = signal(false);
  success = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  formData = {
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
    if (!this.token()) {
      this.errorMessage.set('Token de redefinição inválido');
    }
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  resetPassword() {
    if (this.submitting()) return;

    this.errorMessage.set('');

    if (!this.formData.newPassword || !this.formData.confirmPassword) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return;
    }

    if (this.formData.newPassword.length < 6) {
      this.errorMessage.set('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (this.formData.newPassword !== this.formData.confirmPassword) {
      this.errorMessage.set('As senhas não coincidem');
      return;
    }

    this.submitting.set(true);

    const payload = {
      token: this.token(),
      newPassword: this.formData.newPassword,
      confirmPassword: this.formData.confirmPassword
    };

    this.http.post('http://localhost:3002/api/auth/reset-password', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao redefinir senha. O token pode estar expirado.'
        );
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

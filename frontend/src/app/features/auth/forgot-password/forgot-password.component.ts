import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="forgot-password-screen">
      <div class="forgot-password-content">
        <div class="forgot-password-card">
          <!-- Title -->
          <div class="title-section">
            <h2 class="title">Esqueceu sua senha?</h2>
            <p class="subtitle">Não se preocupe, isso acontece</p>
          </div>

          <!-- Paw Steps Background -->
          <div class="paw-steps">
            <img
              src="assets/paw_register.png"
              alt="Paw step"
              class="paw-step paw-1"
            />
            <img
              src="assets/paw_register.png"
              alt="Paw step"
              class="paw-step paw-2"
            />
            <img
              src="assets/paw_register.png"
              alt="Paw step"
              class="paw-step paw-3"
            />
            <img
              src="assets/paw_register.png"
              alt="Paw step"
              class="paw-step paw-4"
            />
          </div>

          <!-- Instructions -->
          <p class="instructions">
            Por favor, insira o email cadastrado no aplicativo.
          </p>

          <!-- Forgot Password Form -->
          <form
            [formGroup]="forgotPasswordForm"
            (ngSubmit)="onSubmit()"
            class="forgot-password-form"
          >
            @if (successMessage()) {
            <div class="success-message">{{ successMessage() }}</div>
            } @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
            }

            <div class="form-group">
              <div class="email-input-wrapper">
                <span class="email-icon">&#64;</span>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-input"
                  placeholder="Email"
                  [class.error]="
                    forgotPasswordForm.get('email')?.invalid &&
                    forgotPasswordForm.get('email')?.touched
                  "
                />
              </div>
              @if (forgotPasswordForm.get('email')?.invalid &&
              forgotPasswordForm.get('email')?.touched) {
              <span class="form-error">Email inválido</span>
              }
            </div>

            <button
              type="submit"
              class="submit-button"
              [disabled]="forgotPasswordForm.invalid || loading()"
            >
              @if (loading()) {
              <span class="spinner"></span>
              } @else { ENVIAR }
            </button>

            <div class="back-link">
              <a routerLink="/login">Voltar</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Mobile-first styles */
      .forgot-password-screen {
        min-height: 100vh;
        background: #f8f8f8;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .forgot-password-content {
        width: 100%;
        max-width: 375px;
      }

      .forgot-password-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 24px 20px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;
      }

      .title-section {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
        z-index: 2;
      }

      .title {
        font-size: 24px;
        font-weight: 500;
        color: #7ec4c0;
        margin: 0 0 8px 0;
        padding: 0;
      }

      .subtitle {
        font-size: 14px;
        color: #666666;
        margin: 0;
        padding: 0;
      }

      .instructions {
        font-size: 14px;
        color: #666666;
        text-align: center;
        margin-bottom: 24px;
        line-height: 1.5;
        position: relative;
        z-index: 2;
      }

      /* Paw Steps Background */
      .paw-steps {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }

      .paw-step {
        position: absolute;
        width: 35px;
        height: 35px;
        opacity: 0.12;
      }

      /* Vertical walking pattern from bottom to top - centered with more spacing */
      .paw-1 {
        bottom: 10%;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
      }

      .paw-2 {
        bottom: 35%;
        left: 55%;
        transform: translateX(-50%) rotate(-45deg) scaleX(-1);
      }

      .paw-3 {
        bottom: 60%;
        left: 48%;
        transform: translateX(-50%) rotate(45deg);
      }

      .paw-4 {
        bottom: 85%;
        left: 54%;
        transform: translateX(-50%) rotate(-45deg) scaleX(-1);
      }

      .forgot-password-form {
        width: 100%;
        position: relative;
        z-index: 2;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .email-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .email-icon {
        position: absolute;
        left: 14px;
        font-size: 18px;
        color: #4ca8a0;
        z-index: 1;
      }

      .form-input {
        width: 100%;
        background: rgba(184, 227, 225, 0.3);
        border: none;
        border-radius: 8px;
        padding: 12px 14px 12px 38px;
        font-size: 16px;
        color: var(--color-text-primary);
        transition: all 0.2s ease;
      }

      .form-input::placeholder {
        color: #999999;
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

      .success-message {
        background: rgba(39, 174, 96, 0.1);
        color: #27ae60;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 12px;
        text-align: center;
        font-size: 13px;
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

      .submit-button {
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
        margin-bottom: 16px;
      }

      .submit-button:hover:not(:disabled) {
        background: #3d9690;
        transform: translateY(-1px);
        box-shadow: 0px 6px 16px rgba(76, 168, 160, 0.4);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .submit-button:disabled {
        background: #cccccc;
        cursor: not-allowed;
        box-shadow: none;
      }

      .submit-button .spinner {
        border: 2px solid #ffffff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        animation: spin 0.8s linear infinite;
        display: inline-block;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .back-link {
        text-align: center;
        font-size: 13px;
      }

      .back-link a {
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 500;
      }

      .back-link a:hover {
        text-decoration: underline;
      }

      /* Tablet adjustments (768px - 1023px) */
      @media (min-width: 768px) {
        .forgot-password-screen {
          padding: 32px;
        }

        .forgot-password-content {
          max-width: 450px;
        }

        .title {
          font-size: 28px;
        }

        .subtitle {
          font-size: 15px;
        }

        .instructions {
          font-size: 15px;
          margin-bottom: 28px;
        }

        .forgot-password-card {
          padding: 40px 32px;
        }

        .paw-step {
          width: 40px;
          height: 40px;
        }

        .form-input {
          padding: 14px 16px 14px 42px;
          font-size: 16px;
        }

        .submit-button {
          padding: 16px;
          font-size: 16px;
        }

        .back-link {
          font-size: 14px;
        }
      }

      /* Desktop styles (1024px+) */
      @media (min-width: 1024px) {
        .forgot-password-screen {
          padding: 48px;
          background: linear-gradient(135deg, #f8f8f8 0%, #e8f5f4 100%);
        }

        .forgot-password-content {
          max-width: 500px;
        }

        .title {
          font-size: 32px;
        }

        .subtitle {
          font-size: 16px;
        }

        .instructions {
          font-size: 16px;
          margin-bottom: 32px;
        }

        .forgot-password-card {
          padding: 48px 40px;
          box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
        }

        .paw-step {
          width: 45px;
          height: 45px;
        }

        .form-input {
          padding: 16px 18px 16px 46px;
          font-size: 16px;
          border-radius: 10px;
        }

        .form-input:hover {
          background: rgba(184, 227, 225, 0.35);
        }

        .submit-button {
          padding: 18px;
          font-size: 17px;
          border-radius: 14px;
        }

        .back-link {
          font-size: 15px;
        }
      }

      /* Large desktop (1440px+) */
      @media (min-width: 1440px) {
        .forgot-password-content {
          max-width: 550px;
        }

        .forgot-password-card {
          padding: 56px 48px;
        }

        .title {
          font-size: 36px;
        }
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  forgotPasswordForm = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
  });

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // TODO: Implement forgotPassword in AuthService
    // For now, simulate success
    setTimeout(() => {
      this.successMessage.set("Email de recuperação enviado com sucesso!");
      this.forgotPasswordForm.reset();
      this.loading.set(false);
    }, 1500);
  }
}

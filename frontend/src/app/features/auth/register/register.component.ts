import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-screen">
      <div class="register-content">
        <div class="register-card">
          <!-- Register Title -->
          <div class="register-title-section">
            <h2 class="register-title">Cadastro</h2>
          </div>

          <!-- Paw Steps Background - S-curve pattern -->
          <div class="paw-steps">
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-1"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-2"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-3"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-4"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-5"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-6"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-7"
            />
            <img
              src="assets/paw_register.webp"
              alt="Paw step"
              class="paw-step paw-8"
            />
          </div>

          <!-- Register Form -->
          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="register-form"
          >
            @if (errorMessage()) {
            <div class="error-message">{{ errorMessage() }}</div>
            }

            <div class="form-group">
              <label class="form-label" for="ongName">Nome da ONG</label>
              <input
                id="ongName"
                type="text"
                formControlName="ongName"
                class="form-input"
                [class.error]="
                  registerForm.get('ongName')?.invalid &&
                  registerForm.get('ongName')?.touched
                "
              />
              @if (registerForm.get('ongName')?.invalid &&
              registerForm.get('ongName')?.touched) {
              <span class="form-error">Nome da ONG é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.error]="
                  registerForm.get('email')?.invalid &&
                  registerForm.get('email')?.touched
                "
              />
              @if (registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched) {
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
                [class.error]="
                  registerForm.get('password')?.invalid &&
                  registerForm.get('password')?.touched
                "
              />
              @if (registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched) {
              <span class="form-error"
                >Senha deve ter no mínimo 6 caracteres</span
              >
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmPassword"
                >Repetir senha</label
              >
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                class="form-input"
                [class.error]="
                  registerForm.get('confirmPassword')?.invalid &&
                  registerForm.get('confirmPassword')?.touched
                "
              />
              @if (registerForm.get('confirmPassword')?.invalid &&
              registerForm.get('confirmPassword')?.touched) {
              <span class="form-error">As senhas não coincidem</span>
              }
            </div>

            <button
              type="submit"
              class="register-button"
              [disabled]="registerForm.invalid || loading()"
            >
              @if (loading()) {
              <span class="spinner"></span>
              } @else { CADASTRAR }
            </button>

            <div class="login-link">
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
      .register-screen {
        min-height: 100vh;
        background: #f8f8f8;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .register-content {
        width: 100%;
        max-width: 375px;
      }

      .register-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 24px 20px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;
      }

      .register-title-section {
        text-align: center;
        margin-bottom: 20px;
        position: relative;
        z-index: 2;
      }

      .register-title {
        font-size: 28px;
        font-weight: 500;
        color: #7ec4c0;
        margin: 0;
        padding: 0;
      }

      /* Paw Steps Background */
      .paw-steps {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }

      .paw-step {
        position: absolute;
        width: 40px;
        height: 40px;
        opacity: 0.15;
      }

      /* Natural S-curve walking pattern from bottom right to top left */
      .paw-1 {
        bottom: 8%;
        right: 12%;
        transform: rotate(135deg);
      }

      .paw-2 {
        bottom: 18%;
        right: 25%;
        transform: rotate(105deg) scaleX(-1);
      }

      .paw-3 {
        bottom: 32%;
        right: 35%;
        transform: rotate(220deg);
      }

      .paw-4 {
        bottom: 45%;
        right: 42%;
        transform: rotate(115deg) scaleX(-1);
      }

      .paw-5 {
        bottom: 58%;
        left: 48%;
        transform: rotate(2000deg);
      }

      .paw-6 {
        bottom: 70%;
        left: 35%;
        transform: rotate(105deg) scaleX(-1);
      }

      .paw-7 {
        top: 18%;
        left: 20%;
        transform: rotate(180deg);
      }

      .paw-8 {
        top: 8%;
        left: 10%;
        transform: rotate(120deg) scaleX(-1);
      }

      .register-form {
        width: 100%;
        position: relative;
        z-index: 2;
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

      .register-button {
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
        margin-top: 8px;
      }

      .register-button:hover:not(:disabled) {
        background: #3d9690;
        transform: translateY(-1px);
        box-shadow: 0px 6px 16px rgba(76, 168, 160, 0.4);
      }

      .register-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .register-button:disabled {
        background: #cccccc;
        cursor: not-allowed;
        box-shadow: none;
      }

      .register-button .spinner {
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

      .login-link {
        text-align: center;
        margin-top: 16px;
        font-size: 13px;
      }

      .login-link a {
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 500;
      }

      .login-link a:hover {
        text-decoration: underline;
      }

      /* Tablet adjustments (768px - 1023px) */
      @media (min-width: 768px) {
        .register-screen {
          padding: 32px;
        }

        .register-content {
          max-width: 450px;
        }

        .register-title {
          font-size: 32px;
        }

        .register-card {
          padding: 40px 32px;
        }

        .paw-step {
          width: 45px;
          height: 45px;
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

        .register-button {
          padding: 16px;
          font-size: 16px;
        }

        .login-link {
          margin-top: 20px;
          font-size: 14px;
        }
      }

      /* Desktop styles (1024px+) */
      @media (min-width: 1024px) {
        .register-screen {
          padding: 48px;
          background: linear-gradient(135deg, #f8f8f8 0%, #e8f5f4 100%);
        }

        .register-content {
          max-width: 500px;
        }

        .register-title {
          font-size: 36px;
        }

        .register-card {
          padding: 48px 40px;
          box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
        }

        .paw-step {
          width: 50px;
          height: 50px;
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

        .register-button {
          padding: 18px;
          font-size: 17px;
          border-radius: 14px;
        }

        .login-link {
          margin-top: 24px;
          font-size: 15px;
        }
      }

      /* Large desktop (1440px+) */
      @media (min-width: 1440px) {
        .register-content {
          max-width: 550px;
        }

        .register-card {
          padding: 56px 48px;
        }

        .register-title {
          font-size: 40px;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = new FormGroup({
    ongName: new FormControl("", [
      Validators.required,
      Validators.minLength(3),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl("", [Validators.required]),
  });

  constructor() {
    // Add password match validation
    this.registerForm.get("confirmPassword")?.addValidators([
      (control) => {
        const password = this.registerForm.get("password")?.value;
        const confirmPassword = control.value;
        if (password && confirmPassword && password !== confirmPassword) {
          return { passwordMismatch: true };
        }
        return null;
      },
    ]);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const registerData = this.registerForm.value;

    this.authService.register(registerData as any).subscribe({
      next: () => {
        this.router.navigate(["/home"]);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || "Erro ao criar conta");
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}

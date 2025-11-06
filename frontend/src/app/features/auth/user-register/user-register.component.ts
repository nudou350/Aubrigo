import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="icon">❤️</div>
          <h1>Criar Conta de Usuário</h1>
          <p>Comece sua jornada para adotar um novo amigo</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          @if (errorMessage()) {
            <div class="error-banner">
              {{ errorMessage() }}
            </div>
          }

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nome</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="João"
                [class.error]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
              />
              @if (registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched) {
                <span class="error-text">Nome é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="lastName">Sobrenome</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                placeholder="Silva"
                [class.error]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
              />
              @if (registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched) {
                <span class="error-text">Sobrenome é obrigatório</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="joao@example.com"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            />
            @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
              <span class="error-text">Email válido é obrigatório</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Mínimo 8 caracteres"
              [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            />
            @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
              <span class="error-text">Senha deve ter no mínimo 8 caracteres</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Repita sua senha"
              [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
            />
            @if (registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) {
              <span class="error-text">Senhas não coincidem</span>
            }
          </div>

          <button
            type="submit"
            class="btn-primary"
            [disabled]="registerForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
            }
            {{ isLoading() ? 'Criando conta...' : 'CRIAR CONTA' }}
          </button>

          <div class="footer-links">
            <p>Já tem uma conta? <a routerLink="/login">Entrar</a></p>
            <p><a routerLink="/account-type">← Voltar para escolha de conta</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: linear-gradient(135deg, #B8E3E1 0%, #FFFFFF 100%);
    }

    .register-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 40px;
      max-width: 500px;
      width: 100%;
    }

    .register-header {
      text-align: center;
      margin-bottom: 32px;

      .icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      h1 {
        color: #2C2C2C;
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      p {
        color: #666666;
        margin: 0;
      }
    }

    .error-banner {
      background: #FEE;
      color: #E74C3C;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 14px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        color: #2C2C2C;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;
      }

      input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid transparent;
        background: #B8E3E1;
        border-radius: 8px;
        font-size: 16px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #5CB5B0;
          background: white;
        }

        &.error {
          border-color: #E74C3C;
          background: #FEE;
        }

        &::placeholder {
          color: #999;
        }
      }

      .error-text {
        display: block;
        color: #E74C3C;
        font-size: 12px;
        margin-top: 4px;
      }
    }

    .btn-primary {
      width: 100%;
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 16px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      &:hover:not(:disabled) {
        background: #4A9792;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(92, 181, 176, 0.3);
      }

      &:disabled {
        background: #CCC;
        cursor: not-allowed;
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .footer-links {
      margin-top: 24px;
      text-align: center;

      p {
        color: #666;
        font-size: 14px;
        margin: 8px 0;

        a {
          color: #5CB5B0;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    @media (max-width: 600px) {
      .register-card {
        padding: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserRegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const registerData = this.registerForm.value;

    this.authService.registerUser(registerData).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    });
  }
}

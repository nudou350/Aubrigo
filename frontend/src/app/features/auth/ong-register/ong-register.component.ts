import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

@Component({
  selector: 'app-ong-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="icon">🏠</div>
          <h1>Criar Conta ONG</h1>
          <p>Registre sua organização para ajudar animais a encontrarem um lar</p>
          <div class="approval-notice">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Sua conta será revisada por um administrador antes de ser aprovada</span>
          </div>
        </div>

        @if (successMessage()) {
          <div class="success-banner">
            <h3>✓ Registro Enviado!</h3>
            <p>{{ successMessage() }}</p>
            <button class="btn-secondary" routerLink="/login">IR PARA LOGIN</button>
          </div>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            @if (errorMessage()) {
              <div class="error-banner">
                {{ errorMessage() }}
              </div>
            }

            <div class="form-group">
              <label for="ongName">Nome da ONG</label>
              <input
                id="ongName"
                type="text"
                formControlName="ongName"
                placeholder="Cantinho dos Animais"
                [class.error]="registerForm.get('ongName')?.invalid && registerForm.get('ongName')?.touched"
              />
              @if (registerForm.get('ongName')?.invalid && registerForm.get('ongName')?.touched) {
                <span class="error-text">Nome da ONG é obrigatório (mínimo 3 caracteres)</span>
              }
            </div>

            <div class="form-group">
              <label for="city">Cidade</label>
              <select
                id="city"
                formControlName="city"
                [class.error]="registerForm.get('city')?.invalid && registerForm.get('city')?.touched"
              >
                <option value="">Selecione uma cidade</option>
                <option value="Lisboa">Lisboa</option>
                <option value="Porto">Porto</option>
                <option value="Beja">Beja</option>
                <option value="Évora">Évora</option>
                <option value="Coimbra">Coimbra</option>
                <option value="Braga">Braga</option>
                <option value="Faro">Faro</option>
              </select>
              @if (registerForm.get('city')?.invalid && registerForm.get('city')?.touched) {
                <span class="error-text">Cidade é obrigatória</span>
              }
            </div>

            <div class="form-group">
              <label for="email">Email da ONG</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="contato@cantinho.pt"
                [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
              />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <span class="error-text">Email válido é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="phone">Telefone</label>
              <div class="phone-input-wrapper">
                <button
                  type="button"
                  class="flag-selector"
                  (click)="toggleCountryDropdown()"
                  [class.error]="registerForm.get('phone')?.invalid && registerForm.get('phone')?.touched"
                >
                  <span class="flag">{{ selectedCountry()?.flag || '🌐' }}</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" class="dropdown-icon">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  placeholder="21 234 5678"
                  class="phone-input"
                  [class.error]="registerForm.get('phone')?.invalid && registerForm.get('phone')?.touched"
                />
                @if (showCountryDropdown()) {
                  <div class="country-dropdown-overlay" (click)="closeCountryDropdown()"></div>
                  <div class="country-dropdown">
                    <input
                      type="text"
                      formControlName="countrySearch"
                      placeholder="Pesquisar país..."
                      class="country-search"
                      (input)="onCountrySearch($event)"
                      autocomplete="off"
                      #searchInput
                    />
                    <div class="country-list">
                      @for (country of filteredCountries(); track country.code) {
                        <div class="country-item" (click)="selectCountry(country)">
                          <span class="country-flag">{{ country.flag }}</span>
                          <span class="country-name">{{ country.name }}</span>
                          <span class="country-code">{{ country.dialCode }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
                <input type="hidden" formControlName="countryCode" />
              </div>
              @if (registerForm.get('phone')?.invalid && registerForm.get('phone')?.touched) {
                <span class="error-text">Telefone é obrigatório</span>
              }
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  formControlName="hasWhatsapp"
                  class="checkbox-input"
                />
                <span class="checkbox-text">WhatsApp</span>
              </label>
            </div>

            <div class="form-group">
              <label for="instagram">Instagram</label>
              <input
                id="instagram"
                type="text"
                formControlName="instagramHandle"
                placeholder="opcional"
              />
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
              {{ isLoading() ? 'Enviando...' : 'ENVIAR PARA APROVAÇÃO' }}
            </button>

            <div class="footer-links">
              <p>Já tem uma conta? <a routerLink="/login">Entrar</a></p>
              <p><a routerLink="/account-type">← Voltar para escolha de conta</a></p>
            </div>
          </form>
        }
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
        margin: 0 0 16px 0;
      }
    }

    .approval-notice {
      background: #FFF4E5;
      border: 2px solid #F5A623;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;

      svg {
        width: 24px;
        height: 24px;
        color: #F5A623;
        flex-shrink: 0;
      }

      span {
        color: #8B6914;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .success-banner {
      background: #E8F5E9;
      border: 2px solid #27AE60;
      border-radius: 12px;
      padding: 32px;
      text-align: center;

      h3 {
        color: #27AE60;
        font-size: 24px;
        margin: 0 0 12px 0;
      }

      p {
        color: #1B5E20;
        margin: 0 0 24px 0;
        line-height: 1.6;
      }

      .btn-secondary {
        background: #27AE60;
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.2s;

        &:hover {
          background: #229954;
          transform: translateY(-1px);
        }
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

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        color: #2C2C2C;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;
      }

      input, select {
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

      select {
        cursor: pointer;
      }

      .error-text {
        display: block;
        color: #E74C3C;
        font-size: 12px;
        margin-top: 4px;
      }
    }

    .checkbox-group {
      margin-bottom: 16px;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-weight: normal;
      }

      .checkbox-input {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #5CB5B0;
      }

      .checkbox-text {
        color: #2C2C2C;
        font-size: 14px;
      }
    }

    .phone-input-wrapper {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: 0;
    }

    .flag-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0 12px;
      background: #B8E3E1;
      border: 2px solid transparent;
      border-right: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 70px;

      &:hover {
        background: #A0D8D5;
      }

      &:focus {
        outline: none;
        border-color: #5CB5B0;
        background: white;
      }

      &.error {
        border-color: #E74C3C;
        background: #FEE;
      }

      .flag {
        font-size: 24px;
        line-height: 1;
      }

      .dropdown-icon {
        width: 16px;
        height: 16px;
        color: #666;
      }
    }

    .phone-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid transparent;
      border-left: none;
      background: #B8E3E1;
      border-radius: 0 8px 8px 0;
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

    .country-dropdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: 999;
    }

    .country-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #5CB5B0;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .country-search {
      width: 100%;
      padding: 12px 16px;
      border: none;
      border-bottom: 2px solid #E0E0E0;
      font-size: 15px;
      background: #F5F5F5;

      &:focus {
        outline: none;
        background: white;
        border-bottom-color: #5CB5B0;
      }

      &::placeholder {
        color: #999;
      }
    }

    .country-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .country-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #B8E3E1;
      }

      .country-flag {
        font-size: 22px;
        line-height: 1;
        min-width: 30px;
      }

      .country-name {
        flex: 1;
        color: #2C2C2C;
        font-size: 14px;
        font-weight: 500;
      }

      .country-code {
        color: #5CB5B0;
        font-weight: 600;
        font-size: 14px;
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
    }
  `]
})
export class OngRegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showCountryDropdown = signal(false);
  searchQuery = signal('');
  selectedCountry = signal<Country | null>(null);

  countries: Country[] = [
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
    { code: 'ES', name: 'Espanha', dialCode: '+34', flag: '🇪🇸' },
    { code: 'FR', name: 'França', dialCode: '+33', flag: '🇫🇷' },
    { code: 'IT', name: 'Itália', dialCode: '+39', flag: '🇮🇹' },
    { code: 'DE', name: 'Alemanha', dialCode: '+49', flag: '🇩🇪' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
    { code: 'NL', name: 'Holanda', dialCode: '+31', flag: '🇳🇱' },
    { code: 'BE', name: 'Bélgica', dialCode: '+32', flag: '🇧🇪' },
    { code: 'CH', name: 'Suíça', dialCode: '+41', flag: '🇨🇭' },
    { code: 'AT', name: 'Áustria', dialCode: '+43', flag: '🇦🇹' },
    { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
    { code: 'IE', name: 'Irlanda', dialCode: '+353', flag: '🇮🇪' },
    { code: 'LU', name: 'Luxemburgo', dialCode: '+352', flag: '🇱🇺' },
  ];

  filteredCountries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.countries.slice(0, 5); // Show first 5 by default
    }

    const filtered = this.countries.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    );

    return filtered.slice(0, 5); // Limit to 5 results
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      ongName: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['', Validators.required],
      countrySearch: [''],
      phone: ['', Validators.required],
      hasWhatsapp: [false],
      instagramHandle: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Set Portugal as default
    this.selectedCountry.set(this.countries[0]);
    this.registerForm.patchValue({ countryCode: this.countries[0].dialCode });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  toggleCountryDropdown() {
    this.showCountryDropdown.set(!this.showCountryDropdown());
    if (this.showCountryDropdown()) {
      // Reset search and focus on search input
      this.searchQuery.set('');
      this.registerForm.patchValue({ countrySearch: '' });
    }
  }

  closeCountryDropdown() {
    this.showCountryDropdown.set(false);
    this.searchQuery.set('');
    this.registerForm.patchValue({ countrySearch: '' });
  }

  onCountrySearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectCountry(country: Country) {
    this.selectedCountry.set(country);
    this.registerForm.patchValue({
      countryCode: country.dialCode,
      countrySearch: ''
    });
    this.searchQuery.set('');
    this.showCountryDropdown.set(false);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Map city to location and send all required fields
    const formValue = this.registerForm.value;

    // Combine country code with phone number
    const fullPhone = formValue.countryCode && formValue.phone
      ? `${formValue.countryCode} ${formValue.phone}`
      : formValue.phone;

    const registerData = {
      ongName: formValue.ongName,
      email: formValue.email,
      phone: fullPhone,
      hasWhatsapp: formValue.hasWhatsapp,
      instagramHandle: formValue.instagramHandle || undefined,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      location: formValue.city, // Map city to location for backend
    };

    this.authService.registerOng(registerData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(
          'Seu registro foi enviado com sucesso! Nossa equipe irá revisar sua organização e você receberá um email quando for aprovada. Isso geralmente leva 1-2 dias úteis.'
        );
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    });
  }
}

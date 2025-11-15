import { Component, ChangeDetectionStrategy, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { CountryService } from "../../../core/services/country.service";
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

@Component({
  selector: "app-ong-register",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="icon">🏠</div>
          <h1>{{ 'auth.register.ongTitle' | translate }}</h1>
          <p>
            {{ 'auth.register.ongSubtitle' | translate }}
          </p>
          <div class="approval-notice">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            <span>{{ 'auth.register.approvalNotice' | translate }}</span>
          </div>
        </div>

        @if (successMessage()) {
        <div class="success-banner">
          <h3>{{ 'auth.register.registrationSubmitted' | translate }}</h3>
          <p>{{ successMessage() }}</p>
          <button class="btn-secondary" routerLink="/login">
            {{ 'auth.register.goToLogin' | translate }}
          </button>
        </div>
        } @else {
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          @if (errorMessage()) {
          <div class="error-banner">
            {{ errorMessage() }}
          </div>
          }

          <div class="form-group">
            <label for="ongName">{{ 'auth.register.ongName' | translate }}</label>
            <input
              id="ongName"
              type="text"
              formControlName="ongName"
              [placeholder]="'auth.register.ongNamePlaceholder' | translate"
              [class.error]="
                registerForm.get('ongName')?.invalid &&
                registerForm.get('ongName')?.touched
              "
            />
            @if (registerForm.get('ongName')?.invalid &&
            registerForm.get('ongName')?.touched) {
            <span class="error-text">{{ 'auth.register.ongNameRequired' | translate }}</span>
            }
          </div>

          <div class="form-group">
            <label for="city">{{ 'auth.register.city' | translate }}</label>
            <select
              id="city"
              formControlName="city"
              [class.error]="
                registerForm.get('city')?.invalid &&
                registerForm.get('city')?.touched
              "
            >
              <option value="">{{ 'auth.register.cityPlaceholder' | translate }}</option>
              <option value="Lisboa">Lisboa</option>
              <option value="Porto">Porto</option>
              <option value="Beja">Beja</option>
              <option value="Évora">Évora</option>
              <option value="Coimbra">Coimbra</option>
              <option value="Braga">Braga</option>
              <option value="Faro">Faro</option>
            </select>
            @if (registerForm.get('city')?.invalid &&
            registerForm.get('city')?.touched) {
            <span class="error-text">{{ 'auth.register.cityRequired' | translate }}</span>
            }
          </div>

          <div class="form-group">
            <label for="email">{{ 'auth.register.ongEmail' | translate }}</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [placeholder]="'auth.register.ongEmailPlaceholder' | translate"
              [class.error]="
                registerForm.get('email')?.invalid &&
                registerForm.get('email')?.touched
              "
            />
            @if (registerForm.get('email')?.invalid &&
            registerForm.get('email')?.touched) {
            <span class="error-text">{{ 'auth.register.emailRequired' | translate }}</span>
            }
          </div>

          <div class="form-group">
            <label for="phone">{{ 'auth.register.phone' | translate }}</label>
            <div class="phone-input-wrapper">
              <button
                type="button"
                class="flag-selector"
                (click)="toggleCountryDropdown()"
                [class.error]="
                  registerForm.get('phone')?.invalid &&
                  registerForm.get('phone')?.touched
                "
              >
                <span class="flag">{{ selectedCountry()?.flag || "🌐" }}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="dropdown-icon"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                [placeholder]="'auth.register.phonePlaceholder' | translate"
                class="phone-input radius-left-0"
                [class.error]="
                  registerForm.get('phone')?.invalid &&
                  registerForm.get('phone')?.touched
                "
              />
              @if (showCountryDropdown()) {
              <div
                class="country-dropdown-overlay"
                (click)="closeCountryDropdown()"
              ></div>
              <div class="country-dropdown">
                <input
                  type="text"
                  formControlName="countrySearch"
                  [placeholder]="'auth.register.countrySearch' | translate"
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
            @if (registerForm.get('phone')?.invalid &&
            registerForm.get('phone')?.touched) {
            <span class="error-text">{{ 'auth.register.phoneRequired' | translate }}</span>
            }
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                formControlName="hasWhatsapp"
                class="checkbox-input"
              />
              <span class="checkbox-text">{{ 'auth.register.whatsapp' | translate }}</span>
            </label>
          </div>

          <div class="form-group">
            <label for="instagram">{{ 'auth.register.instagram' | translate }}</label>
            <input
              id="instagram"
              type="text"
              formControlName="instagramHandle"
              [placeholder]="'auth.register.instagramPlaceholder' | translate"
            />
          </div>

          <!-- Payment Account Section -->
          <div class="payment-section">
            <h3>💳 Conta para Receber Doações (Opcional)</h3>
            <p class="help-text">
              Preencha estes dados para configurar sua conta de pagamentos e começar a receber doações imediatamente
            </p>

            <!-- Portugal Fields -->
            @if (isPortugal()) {
              <div class="form-group">
                <label for="taxId">NIF / NIPC (Portugal)</label>
                <input
                  id="taxId"
                  type="text"
                  formControlName="taxId"
                  placeholder="Ex: 123456789"
                />
                <small class="field-hint">
                  Número de identificação fiscal da sua organização
                </small>
              </div>

              <div class="form-group">
                <label for="bankAccountIban">IBAN</label>
                <input
                  id="bankAccountIban"
                  type="text"
                  formControlName="bankAccountIban"
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                />
                <small class="field-hint">
                  As doações serão depositadas diretamente nesta conta
                </small>
              </div>
            }

            <!-- Brazil Fields -->
            @if (isBrazil()) {
              <div class="form-group">
                <label for="taxId">CNPJ</label>
                <input
                  id="taxId"
                  type="text"
                  formControlName="taxId"
                  placeholder="Ex: 12.345.678/0001-90"
                />
                <small class="field-hint">
                  Número de identificação fiscal da sua organização
                </small>
              </div>

              <div class="form-group">
                <label for="bankName">Nome do Banco</label>
                <input
                  id="bankName"
                  type="text"
                  formControlName="bankName"
                  placeholder="Ex: Banco do Brasil"
                />
                <small class="field-hint">
                  Nome do banco para transferências
                </small>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="bankRoutingNumber">Código do Banco (Agência)</label>
                  <input
                    id="bankRoutingNumber"
                    type="text"
                    formControlName="bankRoutingNumber"
                    placeholder="0001"
                  />
                </div>

                <div class="form-group">
                  <label for="bankAccountNumber">Número da Conta</label>
                  <input
                    id="bankAccountNumber"
                    type="text"
                    formControlName="bankAccountNumber"
                    placeholder="12345678-9"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="pixKeyType">Tipo de Chave PIX</label>
                <select
                  id="pixKeyType"
                  formControlName="pixKeyType"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Telefone</option>
                  <option value="Random">Chave Aleatória</option>
                </select>
              </div>

              <div class="form-group">
                <label for="pixKey">Chave PIX</label>
                <input
                  id="pixKey"
                  type="text"
                  formControlName="pixKey"
                  placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                />
                <small class="field-hint">
                  Sua chave PIX para receber doações instantaneamente
                </small>
              </div>
            }

            <div class="info-box">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <div>
                <strong>Por que pedimos isso?</strong>
                <p>
                  Estes dados permitem configurar sua conta para receber doações manualmente.
                  Você pode preencher agora ou configurar mais tarde no painel.
                </p>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="password">{{ 'auth.register.password' | translate }}</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [placeholder]="'auth.register.passwordPlaceholder' | translate"
              [class.error]="
                registerForm.get('password')?.invalid &&
                registerForm.get('password')?.touched
              "
            />
            @if (registerForm.get('password')?.invalid &&
            registerForm.get('password')?.touched) {
            <span class="error-text">{{ 'auth.register.passwordRequired' | translate }}</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ 'auth.register.confirmPassword' | translate }}</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              [placeholder]="'auth.register.confirmPasswordPlaceholder' | translate"
              [class.error]="
                (registerForm.get('confirmPassword')?.invalid ||
                registerForm.errors?.['mismatch']) &&
                registerForm.get('confirmPassword')?.touched
              "
            />
            @if ((registerForm.get('confirmPassword')?.invalid ||
            registerForm.errors?.['mismatch']) &&
            registerForm.get('confirmPassword')?.touched) {
            <span class="error-text">{{ 'auth.register.passwordMismatch' | translate }}</span>
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
            {{ isLoading() ? ('auth.register.sending' | translate) : ('auth.register.sendForApproval' | translate) }}
          </button>

          <div class="footer-links">
            <p>{{ 'auth.register.alreadyHaveAccount' | translate }} <a routerLink="/login">{{ 'auth.register.loginHere' | translate }}</a></p>
            <p>
              <a routerLink="/account-type">{{ 'auth.register.backToAccountType' | translate }}</a>
            </p>
          </div>
        </form>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .register-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(135deg, #b8e3e1 0%, #ffffff 100%);
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
          color: #2c2c2c;
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
        background: #fff4e5;
        border: 2px solid #f5a623;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;

        svg {
          width: 24px;
          height: 24px;
          color: #f5a623;
          flex-shrink: 0;
        }

        span {
          color: #8b6914;
          font-size: 14px;
          font-weight: 500;
        }
      }

      .success-banner {
        background: #e8f5e9;
        border: 2px solid #27ae60;
        border-radius: 12px;
        padding: 32px;
        text-align: center;

        h3 {
          color: #27ae60;
          font-size: 24px;
          margin: 0 0 12px 0;
        }

        p {
          color: #1b5e20;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        .btn-secondary {
          background: #27ae60;
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
        background: #fee;
        color: #e74c3c;
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
          color: #2c2c2c;
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 14px;
        }

        input,
        select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid transparent;
          background: #b8e3e1;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;

          &:focus {
            outline: none;
            border-color: #5cb5b0;
            background: white;
          }

          &.error {
            border-color: #e74c3c;
            background: #fee;
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
          color: #e74c3c;
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
          accent-color: #5cb5b0;
        }

        .checkbox-text {
          color: #2c2c2c;
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
        background: #b8e3e1;
        border: 2px solid transparent;
        border-right: none;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 70px;

        &:hover {
          background: #a0d8d5;
        }

        &:focus {
          outline: none;
          border-color: #5cb5b0;
          background: white;
        }

        &.error {
          border-color: #e74c3c;
          background: #fee;
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
        background: #b8e3e1;
        border-radius: 0 8px 8px 0;
        font-size: 16px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #5cb5b0;
          border-left: none;
          background: white;
        }

        &.error {
          border-color: #e74c3c;
          border-left: none;
          background: #fee;
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
        border: 2px solid #5cb5b0;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }

      .country-search {
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-bottom: 2px solid #e0e0e0;
        font-size: 15px;
        background: #f5f5f5;

        &:focus {
          outline: none;
          background: white;
          border-bottom-color: #5cb5b0;
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
          background: #b8e3e1;
        }

        .country-flag {
          font-size: 22px;
          line-height: 1;
          min-width: 30px;
        }

        .country-name {
          flex: 1;
          color: #2c2c2c;
          font-size: 14px;
          font-weight: 500;
        }

        .country-code {
          color: #5cb5b0;
          font-weight: 600;
          font-size: 14px;
        }
      }

      .btn-primary {
        width: 100%;
        background: #5cb5b0;
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
          background: #4a9792;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(92, 181, 176, 0.3);
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
      .radius-left-0 {
        border-radius: 0 8px 8px 0 !important;
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
        to {
          transform: rotate(360deg);
        }
      }

      .payment-section {
        background: #f8f9fa;
        border: 2px solid #5cb5b0;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;

        h3 {
          color: #2c2c2c;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .help-text {
          color: #666;
          font-size: 14px;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .field-hint {
          display: block;
          color: #666;
          font-size: 12px;
          margin-top: 4px;
          font-style: italic;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        align-items: end;
        margin-bottom: 20px;

        @media (min-width: 768px) {
          grid-template-columns: 1fr 1fr;
        }

        .form-group {
          margin-bottom: 0;
          width: 100%;

          label {
            min-height: 40px;
            display: flex;
            align-items: flex-end;
            line-height: 1.3;
          }
        }
      }

      .info-box {
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        gap: 12px;
        margin-top: 16px;

        svg {
          width: 24px;
          height: 24px;
          color: #2196f3;
          flex-shrink: 0;
          margin-top: 2px;
        }

        div {
          flex: 1;

          strong {
            color: #1976d2;
            font-size: 14px;
            display: block;
            margin-bottom: 4px;
          }

          p {
            color: #1565c0;
            font-size: 13px;
            margin: 0;
            line-height: 1.5;
          }
        }
      }

      .footer-links {
        margin-top: 24px;
        text-align: center;

        p {
          color: #666;
          font-size: 14px;
          margin: 8px 0;

          a {
            color: #5cb5b0;
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
    `,
  ],
})
export class OngRegisterComponent {
  private translate = inject(TranslateService);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal("");
  successMessage = signal("");
  showCountryDropdown = signal(false);
  searchQuery = signal("");
  selectedCountry = signal<Country | null>(null);

  countries: Country[] = [
    { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷" },
    { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
    { code: "ES", name: "Espanha", dialCode: "+34", flag: "🇪🇸" },
    { code: "FR", name: "França", dialCode: "+33", flag: "🇫🇷" },
    { code: "IT", name: "Itália", dialCode: "+39", flag: "🇮🇹" },
    { code: "DE", name: "Alemanha", dialCode: "+49", flag: "🇩🇪" },
    { code: "GB", name: "Reino Unido", dialCode: "+44", flag: "🇬🇧" },
    { code: "NL", name: "Holanda", dialCode: "+31", flag: "🇳🇱" },
    { code: "BE", name: "Bélgica", dialCode: "+32", flag: "🇧🇪" },
    { code: "CH", name: "Suíça", dialCode: "+41", flag: "🇨🇭" },
    { code: "AT", name: "Áustria", dialCode: "+43", flag: "🇦🇹" },
    { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸" },
    { code: "CA", name: "Canadá", dialCode: "+1", flag: "🇨🇦" },
    { code: "IE", name: "Irlanda", dialCode: "+353", flag: "🇮🇪" },
    { code: "LU", name: "Luxemburgo", dialCode: "+352", flag: "🇱🇺" },
  ];

  // Inject CountryService
  private countryService = inject(CountryService);

  // Country helpers - use detected country from service
  isPortugal = computed(() => this.countryService.currentCountry() === 'PT');
  isBrazil = computed(() => this.countryService.currentCountry() === 'BR');

  filteredCountries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.countries.slice(0, 5); // Show first 5 by default
    }

    const filtered = this.countries.filter(
      (country) =>
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
    this.registerForm = this.fb.group(
      {
        ongName: ["", [Validators.required, Validators.minLength(3)]],
        city: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        countryCode: ["", Validators.required],
        countrySearch: [""],
        phone: ["", Validators.required],
        hasWhatsapp: [false],
        instagramHandle: [""],
        password: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", Validators.required],
        // Payment account fields (optional)
        taxId: [""],
        bankAccountIban: [""],
        bankName: [""],
        bankRoutingNumber: [""],
        bankAccountNumber: [""],
        pixKey: [""],
        pixKeyType: [""],
      },
      { validators: this.passwordMatchValidator }
    );

    // Initialize with auto-detected country from CountryService
    const detectedCountryCode = this.countryService.currentCountry();
    const initialCountry = this.countries.find(c => c.code === detectedCountryCode) || this.countries[1]; // PT is at index 1
    this.selectedCountry.set(initialCountry);
    this.registerForm.patchValue({ countryCode: initialCountry.dialCode });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  toggleCountryDropdown() {
    this.showCountryDropdown.set(!this.showCountryDropdown());
    if (this.showCountryDropdown()) {
      // Reset search and focus on search input
      this.searchQuery.set("");
      this.registerForm.patchValue({ countrySearch: "" });
    }
  }

  closeCountryDropdown() {
    this.showCountryDropdown.set(false);
    this.searchQuery.set("");
    this.registerForm.patchValue({ countrySearch: "" });
  }

  onCountrySearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectCountry(country: Country) {
    this.selectedCountry.set(country);
    // Update CountryService so conditional fields react
    this.countryService.setCountry(country.code);
    this.registerForm.patchValue({
      countryCode: country.dialCode,
      countrySearch: "",
    });
    this.searchQuery.set("");
    this.showCountryDropdown.set(false);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set("");

    // Map city to location and send all required fields
    const formValue = this.registerForm.value;

    // Combine country code with phone number
    const fullPhone =
      formValue.countryCode && formValue.phone
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
      countryCode: this.selectedCountry()?.code, // Send country code (PT/BR)
      // Payment account fields (optional)
      taxId: formValue.taxId || undefined,
      bankAccountIban: formValue.bankAccountIban || undefined,
      bankName: formValue.bankName || undefined,
      bankRoutingNumber: formValue.bankRoutingNumber || undefined,
      bankAccountNumber: formValue.bankAccountNumber || undefined,
      pixKey: formValue.pixKey || undefined,
      pixKeyType: formValue.pixKeyType || undefined,
    };

    this.authService.registerOng(registerData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(
          this.translate.instant('auth.register.ongSuccessMessage')
        );
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || this.translate.instant('auth.register.registerError')
        );
      },
    });
  }
}

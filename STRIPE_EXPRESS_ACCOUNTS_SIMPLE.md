# Stripe Express Accounts - Simple Implementation

**Best for:** Nonprofit platforms where you want minimal friction for ONGs

## Why Express Accounts?

✅ **You create accounts on behalf of ONGs** (no OAuth flow)
✅ **Minimal information required** (just bank account + tax ID)
✅ **Fast onboarding** (2-3 minutes vs 15+ minutes)
✅ **You pre-fill everything** (less work for ONGs)
✅ **ONGs still get their own dashboard** (optional)
✅ **Money goes directly to ONGs** (not to you)

---

## How It Works

### **Step 1: ONG Registers on Aubrigo**

```
┌─────────────────────────────────────┐
│  ONG Registration Form              │
├─────────────────────────────────────┤
│ Name: Abrigo Lisboa                 │
│ Email: contato@abrigolisboa.pt     │
│ Tax ID (NIPC): 123456789           │
│ Bank Account (IBAN): PT50...       │
│ Representative: João Silva          │
└─────────────────────────────────────┘
              ↓
    Backend automatically creates
    Stripe Express Account
              ↓
        Done! ✅
```

### **Step 2: Donations Flow**

```
Donor donates €50
       ↓
Stripe processes payment
       ↓
€47.50 → ONG's bank account
€2.50  → Your platform fee (optional)
```

---

## Backend Implementation

### 1. Update Stripe Connect Service

**File: `backend/src/stripe-connect/stripe-connect.service.ts`**

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreateExpressAccountDto {
  email: string;
  ongName: string;
  taxId: string; // NIPC for Portugal
  country: string; // 'PT' or 'BR'
  iban?: string; // Bank account for Portugal
  routingNumber?: string; // For Brazil
  accountNumber?: string; // For Brazil
  representativeName?: string;
  representativeEmail?: string;
}

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create Express Account for ONG (automatically during registration)
   */
  async createExpressAccount(dto: CreateExpressAccountDto): Promise<{
    accountId: string;
    onboardingUrl?: string;
  }> {
    try {
      // Step 1: Create Express Account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: dto.country,
        email: dto.email,
        business_type: 'non_profit',
        business_profile: {
          name: dto.ongName,
          product_description: 'Animal shelter accepting donations',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          platform: 'aubrigo',
          ongName: dto.ongName,
        },
      });

      this.logger.log(`Created Express Account: ${account.id} for ${dto.ongName}`);

      // Step 2: Add bank account if provided
      if (dto.iban) {
        await this.addBankAccount(account.id, {
          country: dto.country,
          currency: dto.country === 'PT' ? 'eur' : 'brl',
          account_holder_name: dto.ongName,
          account_holder_type: 'company',
          account_number: dto.iban, // IBAN for Portugal
        });
      }

      // Step 3: Update account with business details
      await this.stripe.accounts.update(account.id, {
        business_profile: {
          name: dto.ongName,
          url: `https://aubrigo.com/ongs/${account.id}`,
        },
        company: {
          tax_id: dto.taxId, // NIPC
          name: dto.ongName,
        },
      });

      // Step 4: Generate onboarding link (if additional info needed)
      const accountLink = await this.createAccountLink(account.id);

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url, // Optional: for additional verification
      };
    } catch (error) {
      this.logger.error('Failed to create Express Account:', error);
      throw new BadRequestException('Failed to create payment account');
    }
  }

  /**
   * Add bank account to Express Account
   */
  private async addBankAccount(
    accountId: string,
    bankDetails: {
      country: string;
      currency: string;
      account_holder_name: string;
      account_holder_type: 'individual' | 'company';
      account_number: string; // IBAN for SEPA countries
    }
  ): Promise<void> {
    try {
      await this.stripe.accounts.createExternalAccount(accountId, {
        external_account: {
          object: 'bank_account',
          country: bankDetails.country,
          currency: bankDetails.currency,
          account_holder_name: bankDetails.account_holder_name,
          account_holder_type: bankDetails.account_holder_type,
          account_number: bankDetails.account_number,
        },
      });

      this.logger.log(`Added bank account to ${accountId}`);
    } catch (error) {
      this.logger.error('Failed to add bank account:', error);
      throw new BadRequestException('Invalid bank account details');
    }
  }

  /**
   * Create Account Link for additional onboarding (if needed)
   */
  async createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    try {
      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/ong/onboarding/refresh`,
        return_url: `${this.configService.get('FRONTEND_URL')}/ong/dashboard`,
        type: 'account_onboarding',
      });
    } catch (error) {
      this.logger.error('Failed to create account link:', error);
      throw new BadRequestException('Failed to create onboarding link');
    }
  }

  /**
   * Get Express Account status
   */
  async getAccountStatus(accountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements?: string[];
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
      };
    } catch (error) {
      this.logger.error('Failed to get account status:', error);
      throw new BadRequestException('Failed to retrieve account status');
    }
  }

  /**
   * Create payment with Express Account (same as before)
   */
  async createConnectedPayment(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    donationId: string;
    donorEmail: string;
    paymentMethod: string;
  }): Promise<Stripe.PaymentIntent> {
    const { amount, currency, connectedAccountId, donationId, donorEmail, paymentMethod } = params;

    const amountInCents = Math.round(amount * 100);

    // Calculate platform fee (5% example)
    const platformFeePercentage = this.configService.get<number>('STRIPE_PLATFORM_FEE_PERCENTAGE') || 5;
    const applicationFeeAmount = Math.round(amountInCents * (platformFeePercentage / 100));

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          payment_method_types: [paymentMethod === 'card' ? 'card' : paymentMethod],
          application_fee_amount: applicationFeeAmount,
          metadata: {
            donationId,
            donorEmail,
            platformFee: applicationFeeAmount.toString(),
          },
        },
        {
          stripeAccount: connectedAccountId, // Process on ONG's account
        }
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error('Payment creation failed:', error);
      throw new BadRequestException('Payment failed');
    }
  }

  /**
   * Get Express Account dashboard link
   */
  async getExpressDashboardLink(accountId: string): Promise<{ url: string }> {
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return { url: loginLink.url };
    } catch (error) {
      this.logger.error('Failed to create dashboard link:', error);
      throw new BadRequestException('Failed to create dashboard link');
    }
  }
}
```

---

## Integration with ONG Registration

### 1. Update ONG Registration DTO

**File: `backend/src/auth/dto/ong-register.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class OngRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  ongName: string;

  @IsString()
  @Matches(/^\d{9}$/, { message: 'NIPC must be 9 digits' })
  taxId: string; // NIPC for Portugal

  @IsString()
  @Matches(/^PT50[0-9]{21}$/, { message: 'Invalid Portuguese IBAN' })
  iban: string; // Bank account

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  representativeName?: string;
}
```

### 2. Update ONG Registration Flow

**File: `backend/src/auth/auth.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';

@Injectable()
export class AuthService {
  constructor(
    private stripeConnectService: StripeConnectService,
    // ... other services
  ) {}

  async registerOng(registerDto: OngRegisterDto): Promise<any> {
    // 1. Create user account in database
    const user = await this.createUser({
      email: registerDto.email,
      password: registerDto.password,
      ongName: registerDto.ongName,
      role: 'ong',
    });

    // 2. Create Stripe Express Account automatically
    try {
      const stripeAccount = await this.stripeConnectService.createExpressAccount({
        email: registerDto.email,
        ongName: registerDto.ongName,
        taxId: registerDto.taxId,
        country: 'PT',
        iban: registerDto.iban,
        representativeName: registerDto.representativeName,
      });

      // 3. Save Stripe account ID to user record
      await this.updateUserStripeAccount(user.id, stripeAccount.accountId);

      return {
        user,
        stripeAccountId: stripeAccount.accountId,
        onboardingUrl: stripeAccount.onboardingUrl, // May be null if no additional info needed
      };
    } catch (error) {
      // If Stripe fails, user is still created but needs to complete setup later
      this.logger.error('Stripe account creation failed:', error);
      return {
        user,
        stripeError: true,
        message: 'Account created, but payment setup needs completion',
      };
    }
  }
}
```

---

## Frontend: Simplified ONG Registration

### Registration Form

**File: `frontend/src/app/features/auth/ong-register/ong-register.component.html`**

```html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
  <h2>Registar ONG</h2>
  <p class="subtitle">Configure sua conta para receber doações</p>

  <!-- Basic Info -->
  <div class="form-group">
    <label>Nome da ONG</label>
    <input formControlName="ongName" type="text" placeholder="Abrigo Lisboa">
  </div>

  <div class="form-group">
    <label>Email</label>
    <input formControlName="email" type="email" placeholder="contato@abrigo.pt">
  </div>

  <div class="form-group">
    <label>Senha</label>
    <input formControlName="password" type="password">
  </div>

  <!-- Payment Info (Simple!) -->
  <div class="payment-section">
    <h3>💰 Informações de Pagamento</h3>
    <p class="help-text">Necessário para receber doações diretamente na sua conta bancária</p>

    <div class="form-group">
      <label>NIPC (Número de Identificação Fiscal)</label>
      <input formControlName="taxId" type="text" placeholder="123456789" maxlength="9">
      <small>9 dígitos do seu NIPC</small>
    </div>

    <div class="form-group">
      <label>IBAN (Conta Bancária)</label>
      <input formControlName="iban" type="text" placeholder="PT50 0000 0000 0000 0000 0000 0">
      <small>As doações serão depositadas diretamente nesta conta</small>
    </div>

    <div class="info-box">
      ✅ Configuração automática do pagamento<br>
      ✅ Receba doações direto na sua conta<br>
      ✅ Sem taxas escondidas (apenas 5% de taxa de plataforma)
    </div>
  </div>

  <button type="submit" [disabled]="registerForm.invalid || isLoading()">
    @if (isLoading()) {
      <span class="spinner"></span>
      Criando conta...
    } @else {
      Criar Conta
    }
  </button>
</form>
```

### Registration Component

```typescript
export class OngRegisterComponent {
  registerForm = this.fb.group({
    ongName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    taxId: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    iban: ['', [Validators.required, Validators.pattern(/^PT50[0-9]{21}$/)]],
    location: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.registerOng(this.registerForm.value).subscribe({
        next: (response) => {
          if (response.onboardingUrl) {
            // Rare: Additional verification needed
            window.location.href = response.onboardingUrl;
          } else {
            // Success! Ready to receive donations
            this.router.navigate(['/ong/dashboard']);
            this.toastService.success('Conta criada! Já pode receber doações.');
          }
        },
        error: (error) => {
          this.toastService.error('Erro ao criar conta');
        }
      });
    }
  }
}
```

---

## Comparison: Standard vs Express

### Standard Accounts (Original)
```
❌ ONG leaves your site
❌ Creates Stripe account from scratch
❌ Enters all business details
❌ Uploads verification documents
❌ Connects bank account
❌ 10-15 minutes
❌ High drop-off rate (~40%)
```

### Express Accounts (Better!)
```
✅ Everything in your site
✅ You create account automatically
✅ ONG just enters IBAN + NIPC
✅ No document upload (handled later if needed)
✅ 2-3 minutes
✅ Low drop-off rate (~5%)
```

---

## Important Notes

### 1. **Verification**
- Most ONGs can receive donations immediately
- Stripe may request verification later (for large amounts)
- You can handle this with a simple "Complete Verification" button in dashboard

### 2. **Platform Fee**
```typescript
// Set in .env
STRIPE_PLATFORM_FEE_PERCENTAGE=5  // 5% goes to you, 95% to ONG
```

### 3. **Bank Account**
- Portugal: Use IBAN (PT50...)
- Brazil: Use routing + account number

### 4. **Dashboard Access**
ONGs can view their Stripe dashboard:
```typescript
// In ONG dashboard, add button:
const link = await stripeConnectService.getExpressDashboardLink(ongId);
// Opens Stripe Express dashboard
```

---

## Summary

**For ONGs:**
1. Register on Aubrigo (1 form)
2. Enter IBAN + NIPC (2 minutes)
3. Done! ✅ Start receiving donations

**For You:**
1. Register Stripe Connect once
2. Backend creates accounts automatically
3. Collect your platform fee (optional)

**Result:**
- ✅ 95% less friction
- ✅ Higher ONG registration rate
- ✅ Same benefits (direct deposits)
- ✅ ONGs still get their own dashboard

**Much better for nonprofits!** 🎉

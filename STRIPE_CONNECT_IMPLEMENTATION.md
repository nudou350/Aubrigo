# Stripe Connect Implementation Guide

This guide explains how to implement Stripe Connect for Aubrigo's multi-ONG donation platform.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Stripe Connect Setup](#stripe-connect-setup)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Integration](#frontend-integration)
5. [Testing](#testing)
6. [Going Live](#going-live)

---

## Architecture Overview

### Payment Flow with Stripe Connect

```
┌─────────────┐
│   Donor     │
└──────┬──────┘
       │ €50 Donation
       ↓
┌─────────────────┐
│ Aubrigo Platform│ (Your account - doesn't hold money)
└──────┬──────────┘
       │ Routes payment to connected ONG
       ↓
┌─────────────────┐
│  ONG's Stripe   │ Connected Account
│     Account     │
└──────┬──────────┘
       │ €47.50 (after fees)
       ↓
┌─────────────────┐
│  ONG's Bank     │
│    Account      │
└─────────────────┘

Platform Fee: €2.50 (optional 5%)
```

### Account Types

**Standard Accounts (Recommended):**
- ✅ ONG creates their own Stripe account
- ✅ ONG controls everything (payouts, settings)
- ✅ Simplest for you (less liability)
- ✅ ONG gets full Stripe dashboard access

**Express Accounts:**
- You create account on behalf of ONG
- More control, more responsibility
- Better if ONGs are non-technical

---

## Stripe Connect Setup

### Step 1: Enable Connect in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Connect → Get Started**
3. Select: **"Build a platform or marketplace"**
4. Platform type: **"Nonprofit/Fundraising"**
5. Account type: **Standard** (recommended)

### Step 2: Configure Connect Settings

1. **Branding:**
   - Platform name: "Aubrigo"
   - Icon: Upload your logo
   - Colors: Match your brand (#5CB5B0)

2. **OAuth Settings:**
   - Redirect URIs:
     - Development: `http://localhost:4200/ong/connect/callback`
     - Production: `https://aubrigo.com/ong/connect/callback`

3. **Get Your Connect Client ID:**
   ```
   Connect Client ID: ca_xxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Enable Payment Methods

**For Portugal:**
- Navigate to **Settings → Payment Methods**
- Enable:
  - ✅ MB WAY (requires business verification)
  - ✅ Multibanco
  - ✅ Cards (Visa, Mastercard, Amex)

**For Brazil (if using Stripe):**
- Requires Brazilian business registration (CNPJ)
- PIX support limited - use EBANX instead

---

## Backend Implementation

### 1. Install Stripe SDK (if not already)

```bash
cd backend
npm install stripe
```

### 2. Update Environment Variables

```env
# .env
STRIPE_SECRET_KEY=sk_test_xxxxx  # Or sk_live_xxxxx in production
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
STRIPE_PLATFORM_FEE_PERCENTAGE=5  # Optional platform fee (0-10%)
STRIPE_API_VERSION=2023-10-16
```

### 3. Create Stripe Connect Module

**File: `backend/src/stripe-connect/stripe-connect.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectController } from './stripe-connect.controller';

@Module({
  imports: [ConfigModule],
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
  exports: [StripeConnectService],
})
export class StripeConnectModule {}
```

### 4. Create Stripe Connect Service

**File: `backend/src/stripe-connect/stripe-connect.service.ts`**

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripe: Stripe;
  private platformFeePercentage: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });

    this.platformFeePercentage =
      this.configService.get<number>('STRIPE_PLATFORM_FEE_PERCENTAGE') || 0;
  }

  /**
   * Generate OAuth link for ONG to connect their Stripe account
   */
  generateConnectLink(ongId: string, redirectUrl: string): string {
    const clientId = this.configService.get<string>('STRIPE_CONNECT_CLIENT_ID');

    const params = new URLSearchParams({
      client_id: clientId,
      state: ongId, // Track which ONG is connecting
      scope: 'read_write',
      redirect_uri: redirectUrl,
      'stripe_user[business_type]': 'non_profit',
      'stripe_user[country]': 'PT',
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Complete OAuth flow and get connected account ID
   */
  async completeOAuthFlow(authorizationCode: string): Promise<{
    stripeAccountId: string;
    scope: string;
    livemode: boolean;
  }> {
    try {
      const response = await this.stripe.oauth.token({
        grant_type: 'authorization_code',
        code: authorizationCode,
      });

      this.logger.log(`ONG connected: ${response.stripe_user_id}`);

      return {
        stripeAccountId: response.stripe_user_id,
        scope: response.scope,
        livemode: response.livemode,
      };
    } catch (error) {
      this.logger.error('OAuth flow failed:', error);
      throw new BadRequestException('Failed to connect Stripe account');
    }
  }

  /**
   * Create a payment with destination charge (money goes to ONG)
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

    // Calculate platform fee (e.g., 5% of donation)
    const applicationFeeAmount = this.platformFeePercentage > 0
      ? Math.round(amountInCents * (this.platformFeePercentage / 100))
      : 0;

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method_types: [paymentMethod],
        application_fee_amount: applicationFeeAmount, // Your platform fee
        transfer_data: {
          destination: connectedAccountId, // ONG's Stripe account
        },
        metadata: {
          donationId,
          donorEmail,
          platformFee: applicationFeeAmount.toString(),
        },
      });

      this.logger.log(
        `Connected payment created: ${paymentIntent.id} for account ${connectedAccountId}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error('Connected payment failed:', error);
      throw new BadRequestException('Payment creation failed');
    }
  }

  /**
   * Get connected account details
   */
  async getAccountDetails(accountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error) {
      this.logger.error(`Failed to retrieve account ${accountId}:`, error);
      throw new BadRequestException('Failed to retrieve account details');
    }
  }

  /**
   * Disconnect an ONG's Stripe account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      await this.stripe.oauth.deauthorize({
        client_id: this.configService.get<string>('STRIPE_CONNECT_CLIENT_ID'),
        stripe_user_id: accountId,
      });

      this.logger.log(`Account disconnected: ${accountId}`);
    } catch (error) {
      this.logger.error(`Failed to disconnect account ${accountId}:`, error);
      throw new BadRequestException('Failed to disconnect account');
    }
  }
}
```

### 5. Create Stripe Connect Controller

**File: `backend/src/stripe-connect/stripe-connect.controller.ts`**

```typescript
import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { StripeConnectService } from './stripe-connect.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stripe-connect')
export class StripeConnectController {
  constructor(private stripeConnectService: StripeConnectService) {}

  /**
   * Generate Connect OAuth URL for ONG to link their Stripe account
   * GET /api/stripe-connect/auth-url?ongId=xxx&redirectUrl=xxx
   */
  @Get('auth-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  generateAuthUrl(
    @Query('ongId') ongId: string,
    @Query('redirectUrl') redirectUrl: string,
  ): { url: string } {
    const url = this.stripeConnectService.generateConnectLink(ongId, redirectUrl);
    return { url };
  }

  /**
   * Complete OAuth callback
   * POST /api/stripe-connect/callback
   * Body: { code: "ac_xxxxx", ongId: "xxx" }
   */
  @Post('callback')
  async handleCallback(
    @Body('code') code: string,
    @Body('ongId') ongId: string,
  ): Promise<{ stripeAccountId: string }> {
    const result = await this.stripeConnectService.completeOAuthFlow(code);

    // TODO: Save stripeAccountId to ONG's database record
    // await this.ongsService.updateStripeAccount(ongId, result.stripeAccountId);

    return { stripeAccountId: result.stripeAccountId };
  }

  /**
   * Get connected account details
   * GET /api/stripe-connect/account/:accountId
   */
  @Get('account/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong', 'admin')
  async getAccountDetails(@Query('accountId') accountId: string) {
    return this.stripeConnectService.getAccountDetails(accountId);
  }

  /**
   * Disconnect Stripe account
   * POST /api/stripe-connect/disconnect
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ong')
  async disconnect(@Body('accountId') accountId: string): Promise<{ success: boolean }> {
    await this.stripeConnectService.disconnectAccount(accountId);
    return { success: true };
  }
}
```

### 6. Update ONG Entity

Add `stripeAccountId` to the ONG/User entity:

```typescript
@Entity('ongs')
export class Ong {
  // ... existing fields

  @Column({ nullable: true })
  stripeAccountId?: string; // Connected Stripe account ID

  @Column({ default: false })
  stripeAccountConnected: boolean;
}
```

### 7. Update Donations Service

Modify to use connected accounts:

```typescript
async createDonation(donationData: CreateDonationDto): Promise<DonationResponse> {
  // ... validation code

  // Get ONG's Stripe account ID
  const ong = await this.ongRepository.findOne({ where: { id: donationData.ongId } });

  if (!ong.stripeAccountId) {
    throw new BadRequestException('This ONG has not connected their Stripe account yet');
  }

  // Create payment with destination charge
  const paymentIntent = await this.stripeConnectService.createConnectedPayment({
    amount: donationData.amount,
    currency: donationData.currency,
    connectedAccountId: ong.stripeAccountId,
    donationId: savedDonation.id,
    donorEmail: donationData.donorEmail,
    paymentMethod: donationData.paymentMethod,
  });

  // ... rest of code
}
```

---

## Frontend Integration

### 1. Add Connect Button in ONG Dashboard

**File: `frontend/src/app/features/ong/dashboard/ong-dashboard.component.html`**

```html
<div class="stripe-connect-section">
  @if (!isStripeConnected()) {
    <div class="connect-prompt">
      <h3>💳 Conectar Conta Stripe</h3>
      <p>Conecte sua conta Stripe para receber doações diretamente.</p>
      <button (click)="connectStripe()" class="btn-stripe-connect">
        <span class="stripe-logo">
          <svg><!-- Stripe logo SVG --></svg>
        </span>
        Conectar com Stripe
      </button>
    </div>
  } @else {
    <div class="connected-status">
      <span class="icon">✅</span>
      <span>Conta Stripe Conectada</span>
      <button (click)="viewStripeDetails()" class="btn-link">Ver Detalhes</button>
    </div>
  }
</div>
```

### 2. Implement Connect Logic

**File: `frontend/src/app/features/ong/dashboard/ong-dashboard.component.ts`**

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export class OngDashboardComponent {
  private apiUrl = environment.apiUrl;
  isStripeConnected = signal(false);

  constructor(private http: HttpClient) {
    this.checkStripeConnection();
  }

  checkStripeConnection(): void {
    // Check if ONG has stripeAccountId
    this.http.get<{ connected: boolean }>(`${this.apiUrl}/ongs/me`)
      .subscribe(ong => {
        this.isStripeConnected.set(!!ong.stripeAccountId);
      });
  }

  connectStripe(): void {
    const ongId = 'current-ong-id'; // Get from auth service
    const redirectUrl = `${window.location.origin}/ong/connect/callback`;

    // Get OAuth URL from backend
    this.http.get<{ url: string }>(
      `${this.apiUrl}/stripe-connect/auth-url`,
      { params: { ongId, redirectUrl } }
    ).subscribe(response => {
      // Redirect to Stripe OAuth
      window.location.href = response.url;
    });
  }
}
```

### 3. Create Callback Component

**File: `frontend/src/app/features/ong/connect-callback/connect-callback.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  template: `
    <div class="callback-container">
      <h2>Conectando sua conta Stripe...</h2>
      <div class="spinner"></div>
    </div>
  `
})
export class ConnectCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get authorization code from URL
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const ongId = params['state']; // ONG ID passed in state

      if (code) {
        // Complete OAuth flow
        this.http.post('/api/stripe-connect/callback', { code, ongId })
          .subscribe({
            next: () => {
              this.router.navigate(['/ong/dashboard'], {
                queryParams: { stripeConnected: 'true' }
              });
            },
            error: () => {
              this.router.navigate(['/ong/dashboard'], {
                queryParams: { stripeError: 'true' }
              });
            }
          });
      }
    });
  }
}
```

---

## Testing

### Test Mode Setup

1. Use Stripe test keys: `sk_test_...` and `pk_test_...`
2. Test OAuth flow:
   - Click "Connect Stripe"
   - Use test account credentials
   - Verify callback works

3. Test connected payment:
   ```
   Test Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVV: Any 3 digits
   ```

### Verify Payment Split

1. Make a test donation (€10)
2. Check Platform dashboard: See €0.50 platform fee (if 5%)
3. Check Connected Account: See €9.50 deposit

---

## Going Live

### Checklist

- [ ] Complete Stripe business verification
- [ ] Switch to live API keys (`sk_live_...`)
- [ ] Enable MB WAY in production (requires verification)
- [ ] Test with real bank account
- [ ] Set platform fee percentage
- [ ] Update redirect URLs to production domain
- [ ] Test full donation flow
- [ ] Monitor webhook delivery

---

## Summary

### For Portuguese ONGs:
1. **You register once** with Stripe Connect
2. **Each ONG** connects their own Stripe account (5 minutes)
3. **Donations go directly** to ONG's account
4. **You optionally charge** 0-10% platform fee
5. **Payment methods:** MB WAY, Multibanco, Cards

### For Brazilian ONGs:
1. **Use EBANX instead** (Stripe PIX limited)
2. **Similar split payment** model available
3. **Payment methods:** PIX, Boleto, Cards

**Key Benefit:** You NEVER hold funds, each ONG manages their own money!

---

**Questions?** Check [Stripe Connect Docs](https://stripe.com/docs/connect)

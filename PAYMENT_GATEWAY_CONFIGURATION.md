# Payment Gateway Configuration Guide

This guide provides step-by-step instructions for configuring payment gateways for the Aubrigo multi-country donation system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Stripe Configuration (Portugal)](#stripe-configuration-portugal)
3. [Brazilian Gateway Configuration](#brazilian-gateway-configuration)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Testing Credentials](#testing-credentials)
6. [Webhook Configuration](#webhook-configuration)
7. [Going Live Checklist](#going-live-checklist)

---

## Prerequisites

Before configuring payment gateways, ensure you have:

- ✅ Completed database migration (`npm run typeorm migration:run -- -d src/data-source.ts`)
- ✅ Created accounts with payment providers
- ✅ Access to API keys and webhook secrets
- ✅ Public domain or ngrok URL for webhook testing

---

## Stripe Configuration (Portugal)

### 1. Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Select **Portugal** as your business country
3. Complete business verification (KYC)
4. Wait for account approval (usually 1-3 days)

### 2. Enable Payment Methods

1. Navigate to **Dashboard → Settings → Payment Methods**
2. Enable the following payment methods:
   - ✅ **MB WAY** (Portuguese mobile payments)
   - ✅ **Multibanco** (Portuguese ATM payments)
   - ✅ **Cards** (Visa, Mastercard, Amex)

**Important for MB WAY:**
- Requires business verification in Portugal
- Must have Portuguese business registration
- May take additional 1-2 weeks for approval

**Important for Multibanco:**
- Available by default for Portuguese accounts
- Generates entity + reference for ATM payment
- Payment typically confirmed within 1 hour

### 3. Get API Keys

1. Navigate to **Dashboard → Developers → API Keys**
2. Copy your keys:

**Test Mode Keys:**
```
Publishable key: pk_test_xxxxxxxxxxxxx
Secret key: sk_test_xxxxxxxxxxxxx
```

**Live Mode Keys:**
```
Publishable key: pk_live_xxxxxxxxxxxxx
Secret key: sk_live_xxxxxxxxxxxxx
```

### 4. Get Webhook Secret

1. Navigate to **Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/donations/webhook/stripe`
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `payment_intent.processing`
5. Copy the **Signing secret**: `whsec_xxxxxxxxxxxxx`

### 5. Test MB WAY Integration

Use Stripe's test phone numbers:
```
+351919191919 - Successful payment
+351929292929 - Failed payment
+351939393939 - Payment requires authentication
```

---

## Brazilian Gateway Configuration

You have three options for Brazilian payments:

### Option 1: EBANX (Recommended)

#### Why EBANX?
- ✅ Supports PIX, Boleto, and cards
- ✅ No restrictions for NGOs
- ✅ Excellent documentation
- ✅ Same-day PIX settlements
- ✅ Competitive fees (3.9% + R$0.49)

#### Setup Steps

1. **Create Account**
   - Go to https://dashboard.ebanx.com/signup
   - Select **Brazil** as target market
   - Complete business registration

2. **Enable Payment Methods**
   - Navigate to **Settings → Payment Methods**
   - Enable: PIX, Boleto, Credit Cards

3. **Get API Credentials**
   ```
   Integration Key (Test): YOUR_TEST_INTEGRATION_KEY
   Integration Key (Live): YOUR_LIVE_INTEGRATION_KEY
   ```

4. **Configure Webhook**
   - URL: `https://yourdomain.com/api/donations/webhook/ebanx`
   - Events: `payment.status.update`, `payment.completed`, `payment.failed`
   - Copy Webhook Token: `YOUR_WEBHOOK_TOKEN`

5. **API Endpoint**
   ```
   Test: https://sandbox.ebanx.com/ws
   Live: https://api.ebanx.com/ws
   ```

### Option 2: PagSeguro

#### Setup Steps

1. **Create Account**
   - Go to https://pagseguro.uol.com.br/registration/
   - Complete business verification

2. **Enable PIX**
   - Navigate to **Settings → Payment Methods**
   - Enable PIX (available by default)

3. **Get API Credentials**
   ```
   Email: your-business-email@example.com
   Token (Sandbox): YOUR_SANDBOX_TOKEN
   Token (Production): YOUR_PRODUCTION_TOKEN
   ```

4. **API Endpoint**
   ```
   Sandbox: https://ws.sandbox.pagseguro.uol.com.br
   Production: https://ws.pagseguro.uol.com.br
   ```

### Option 3: Stripe (Limited)

**⚠️ Warning:** Stripe's PIX support requires:
- Brazilian company registration (CNPJ)
- Bank account in Brazil
- May not work for international NGOs

**Only use Stripe for Brazil if:**
- You have a registered Brazilian entity
- You've confirmed PIX availability with Stripe support

---

## Environment Variables Setup

Create or update your `.env` file in the `backend` directory:

```env
# ==========================================
# STRIPE CONFIGURATION (PORTUGAL)
# ==========================================
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_API_VERSION=2023-10-16

# For production, use live keys:
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# ==========================================
# BRAZILIAN GATEWAY CONFIGURATION
# ==========================================

# Select provider: 'ebanx', 'pagseguro', or 'stripe'
BRAZIL_GATEWAY_PROVIDER=ebanx

# EBANX Configuration (if using EBANX)
BRAZIL_GATEWAY_API_KEY=YOUR_EBANX_INTEGRATION_KEY
BRAZIL_GATEWAY_API_URL=https://sandbox.ebanx.com/ws
BRAZIL_GATEWAY_WEBHOOK_SECRET=YOUR_EBANX_WEBHOOK_TOKEN

# PagSeguro Configuration (if using PagSeguro)
# BRAZIL_GATEWAY_API_KEY=YOUR_PAGSEGURO_TOKEN
# BRAZIL_GATEWAY_API_URL=https://ws.sandbox.pagseguro.uol.com.br
# BRAZIL_GATEWAY_WEBHOOK_SECRET=YOUR_PAGSEGURO_WEBHOOK_SECRET

# Stripe for Brazil (if using Stripe)
# BRAZIL_GATEWAY_API_KEY=sk_test_brazil_xxxxx
# BRAZIL_GATEWAY_API_URL=https://api.stripe.com
# BRAZIL_GATEWAY_WEBHOOK_SECRET=whsec_brazil_xxxxx

# ==========================================
# CORS & WEBHOOK CONFIGURATION
# ==========================================
FRONTEND_URL=http://localhost:4200
WEBHOOK_BASE_URL=https://yourdomain.com
```

### Frontend Environment Variables

Update `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  stripePublishableKey: 'pk_test_xxxxxxxxxxxxx',

  // Payment configuration
  paymentConfig: {
    portugal: {
      currency: 'EUR',
      methods: ['mbway', 'multibanco', 'card']
    },
    brazil: {
      currency: 'BRL',
      methods: ['pix', 'boleto', 'card']
    }
  },

  // Polling intervals (milliseconds)
  paymentPolling: {
    pix: 5000,        // 5 seconds
    boleto: 30000,    // 30 seconds
    multibanco: 10000, // 10 seconds
    mbway: 3000       // 3 seconds
  }
};
```

---

## Testing Credentials

### Stripe Test Cards

```
Visa (Success): 4242 4242 4242 4242
Visa (Declined): 4000 0000 0000 0002
Visa (3D Secure): 4000 0027 6000 3184

Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

### Stripe Test Phone Numbers (MB WAY)

```
+351919191919 - Payment succeeds
+351929292929 - Payment fails
+351939393939 - Requires authentication
```

### EBANX Test PIX

When testing PIX with EBANX sandbox:
1. Create payment request
2. QR code is generated automatically
3. Use EBANX dashboard to manually approve test payments
4. Webhook is triggered automatically

### EBANX Test Cards

```
Visa (Approved): 4111 1111 1111 1111
Mastercard (Approved): 5555 5555 5555 4444
Card (Declined): 4242 4242 4242 4241

CPF: 123.456.789-10 (use any valid CPF generator)
```

---

## Webhook Configuration

### Local Development with ngrok

For local testing, use ngrok to expose your backend:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend
npm run start:dev

# In another terminal, expose port 3000
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

Update webhook URLs in payment provider dashboards:
- **Stripe**: `https://abc123.ngrok.io/api/donations/webhook/stripe`
- **EBANX**: `https://abc123.ngrok.io/api/donations/webhook/ebanx`

### Production Webhook URLs

When deploying to production, use your domain:
- **Stripe**: `https://yourdomain.com/api/donations/webhook/stripe`
- **EBANX**: `https://yourdomain.com/api/donations/webhook/ebanx`

### Testing Webhooks

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:3000/api/donations/webhook/stripe

# In another terminal, trigger test webhook
stripe trigger payment_intent.succeeded
```

---

## Going Live Checklist

### Pre-Launch (Test Mode)

- [ ] All payment methods tested in sandbox
- [ ] Webhook endpoints tested and verified
- [ ] Error handling tested (failed payments, expired payments)
- [ ] Email notifications working
- [ ] Donation records saved correctly in database
- [ ] Currency formatting correct (€10,00 vs R$ 10,00)
- [ ] Country detection working properly
- [ ] Mobile responsive design tested

### Stripe Activation

- [ ] Business verification completed
- [ ] MB WAY enabled and approved
- [ ] Multibanco enabled
- [ ] Live API keys obtained
- [ ] Live webhook configured
- [ ] Payout schedule configured
- [ ] Tax settings configured

### Brazilian Gateway Activation

- [ ] Business verification completed
- [ ] PIX enabled
- [ ] Boleto enabled
- [ ] Live API keys obtained
- [ ] Live webhook configured
- [ ] Settlement account configured
- [ ] Tax compliance documents submitted

### Production Deployment

- [ ] Environment variables updated with live keys
- [ ] HTTPS enabled on production domain
- [ ] Webhook URLs updated to production domain
- [ ] Database migration run on production
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented

### Post-Launch Monitoring

- [ ] Monitor webhook delivery success rates
- [ ] Track payment success/failure rates
- [ ] Monitor API error logs
- [ ] Set up alerts for failed payments
- [ ] Review transaction reports daily
- [ ] Verify settlements are occurring

---

## Security Best Practices

### API Keys
- ✅ **NEVER** commit API keys to git
- ✅ Use environment variables only
- ✅ Rotate keys every 90 days
- ✅ Use separate keys for test/production
- ✅ Restrict API key permissions (read/write only what's needed)

### Webhooks
- ✅ **ALWAYS** verify webhook signatures
- ✅ Use HTTPS only for webhook endpoints
- ✅ Implement idempotency (handle duplicate webhooks)
- ✅ Log all webhook events for debugging
- ✅ Return 200 status quickly, process async

### Payment Data
- ✅ **NEVER** store full card numbers
- ✅ Only store last 4 digits of card
- ✅ Don't log sensitive payment data
- ✅ Use PCI-compliant payment forms (Stripe Elements)
- ✅ Encrypt sensitive data at rest

---

## Troubleshooting

### Stripe MB WAY Issues

**Problem:** MB WAY payment method not showing
**Solution:**
- Verify account is registered in Portugal
- Check business verification is complete
- Contact Stripe support to enable MB WAY

**Problem:** MB WAY push notification not received
**Solution:**
- Verify phone number format: +351XXXXXXXXX
- Check phone number is registered with MB WAY
- User must have MB WAY app installed

### EBANX PIX Issues

**Problem:** PIX QR code not generating
**Solution:**
- Verify integration key is correct
- Check API endpoint is correct (sandbox vs production)
- Verify amount is within limits (min: R$0.01, max: varies)

**Problem:** Payment not confirming
**Solution:**
- Check webhook is configured correctly
- Verify webhook secret matches
- Check webhook delivery in EBANX dashboard

### General Issues

**Problem:** Database migration fails
**Solution:**
```bash
# Check database is running
psql -h localhost -U postgres -d aubrigo

# If not running, start PostgreSQL service
# Windows: net start postgresql-x64-14
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Run migration again
npm run typeorm migration:run -- -d src/data-source.ts
```

**Problem:** CORS errors in browser
**Solution:**
Update `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
});
```

---

## Support Contacts

### Stripe Support
- **Dashboard:** https://dashboard.stripe.com/support
- **Phone:** +1 (888) 926-2289
- **Email:** support@stripe.com
- **Docs:** https://stripe.com/docs

### EBANX Support
- **Dashboard:** https://dashboard.ebanx.com/support
- **Email:** integration@ebanx.com
- **Docs:** https://developers.ebanx.com

### PagSeguro Support
- **Phone:** 0800 000 0000
- **Email:** atendimento@pagseguro.com.br
- **Docs:** https://dev.pagseguro.uol.com.br

---

## Next Steps

After configuration is complete:

1. ✅ Run database migration (if not already done)
2. ✅ Test all payment flows with test credentials
3. ✅ Verify webhook delivery
4. ✅ Review comprehensive testing guide
5. ✅ Deploy to staging environment
6. ✅ Complete business verification with payment providers
7. ✅ Switch to live credentials
8. ✅ Deploy to production

---

**Document Version:** 1.0
**Last Updated:** January 15, 2025
**Maintained By:** Aubrigo Development Team

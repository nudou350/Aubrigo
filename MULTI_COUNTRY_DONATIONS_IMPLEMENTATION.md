# Multi-Country Donation System Implementation

## Overview
This document describes the implementation of the multi-country donation system that supports Portugal (with MBWay, Multibanco, Cards) and Brazil (with PIX, Boleto, Cards).

---

## ✅ Backend Implementation (COMPLETED)

### 1. Payment Gateway Abstraction Layer
**Location:** `backend/src/donations/gateways/`

#### Files Created:
- `payment-gateway.interface.ts` - Interface defining payment gateway contracts
- `payment-gateway.factory.ts` - Factory to select appropriate gateway based on country/method
- `stripe.gateway.ts` - Stripe integration for Portugal (MBWay, Multibanco, Cards)
- `brazilian.gateway.ts` - Brazilian gateway integration for PIX, Boleto, Cards (EBANX/PagSeguro)

#### Key Features:
- **Gateway-agnostic architecture** - Easy to add new payment providers
- **Automatic gateway selection** - Based on country and payment method
- **Full webhook support** - Handles payment status updates from all gateways
- **Refund support** - Unified refund interface across gateways

### 2. Database Schema Updates
**Location:** `backend/src/donations/entities/donation.entity.ts`

#### New Fields Added:
```typescript
- country: string          // PT or BR
- currency: string         // EUR or BRL
- gatewayProvider: string  // stripe, ebanx, pagseguro
- paymentIntentId: string  // Generic payment ID
- phoneNumber: string      // For MBWay
- pixQrCode: string        // PIX QR code data
- pixPaymentString: string // PIX payment string
- boletoUrl: string        // Boleto PDF URL
- boletoBarcode: string    // Boleto barcode
- multibancoEntity: string // Multibanco entity
- multibancoReference: string // Multibanco reference
- iofAmount: number        // Brazilian IOF tax
- expiresAt: Date          // For time-limited payments
```

#### Migration File Created:
`backend/src/database/migrations/1736948400000-AddMultiCountryDonationFields.ts`

**To run migration:**
```bash
cd backend
npm run typeorm migration:run
```

### 3. Refactored Donations Service
**Location:** `backend/src/donations/donations.service.ts`

#### Changes Made:
- ✅ Removed custom MBWay service (replaced with Stripe native integration)
- ✅ Implemented gateway abstraction usage
- ✅ Added multi-currency support
- ✅ Added webhook handling
- ✅ Improved error handling
- ✅ Added payment status checking

#### New Methods:
- `createDonation()` - Creates donation with appropriate gateway
- `checkPaymentStatus()` - Checks payment status via gateway
- `handleWebhook()` - Processes webhook events from all gateways
- `getSupportedPaymentMethods()` - Returns methods for a country

### 4. Updated Controller
**Location:** `backend/src/donations/donations.controller.ts`

#### New Endpoints:
```
POST /api/donations/webhook/:gateway
- Webhook endpoint for payment status updates
- Supports: stripe, ebanx, pagseguro
- Verifies signature for security
```

### 5. Environment Variables
**Location:** `backend/.env.example`

#### Added Variables:
```env
# Stripe (Portugal)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brazilian Gateway
BRAZIL_GATEWAY_PROVIDER=ebanx  # or 'pagseguro' or 'stripe'
BRAZIL_GATEWAY_API_KEY=your-api-key
BRAZIL_GATEWAY_API_URL=https://api.ebanx.com
BRAZIL_GATEWAY_WEBHOOK_SECRET=your-webhook-secret
```

**Action Required:** Copy these to your `.env` file and fill in actual values

### 6. Module Updates
**Location:** `backend/src/donations/donations.module.ts`

- ✅ Added PaymentGatewayFactory provider
- ✅ Added StripeGateway provider
- ✅ Added BrazilianGateway provider
- ✅ Removed old MBWayService

---

## 🔄 Frontend Implementation (PENDING)

### 1. Location Service (Angular)
**To Create:** `frontend/src/app/core/services/location.service.ts`

#### Features Needed:
- IP-based geolocation (using ipapi.co or similar)
- Browser locale detection (pt-PT vs pt-BR)
- Manual country override
- Session storage caching

#### Example Implementation:
```typescript
@Injectable({ providedIn: 'root' })
export class LocationService {
  detectCountry(): Observable<{country: string, currency: string}> {
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map(data => ({
        country: data.country_code === 'BR' ? 'BR' : 'PT',
        currency: data.country_code === 'BR' ? 'BRL' : 'EUR'
      })),
      catchError(() => {
        // Fallback to browser locale
        const locale = navigator.language; // 'pt-BR' or 'pt-PT'
        return of({
          country: locale.includes('BR') ? 'BR' : 'PT',
          currency: locale.includes('BR') ? 'BRL' : 'EUR'
        });
      })
    );
  }

  getPaymentMethods(country: string): PaymentMethod[] {
    if (country === 'PT') {
      return [
        { id: 'mbway', name: 'MB WAY', icon: 'assets/icons/mbway.svg' },
        { id: 'multibanco', name: 'Multibanco', icon: 'assets/icons/multibanco.svg' },
        { id: 'card', name: 'Cartão', icon: 'assets/icons/card.svg' }
      ];
    } else if (country === 'BR') {
      return [
        { id: 'pix', name: 'PIX', icon: 'assets/icons/pix.svg' },
        { id: 'boleto', name: 'Boleto', icon: 'assets/icons/boleto.svg' },
        { id: 'card', name: 'Cartão', icon: 'assets/icons/card.svg' }
      ];
    }
    return [];
  }
}
```

### 2. Currency Formatting Pipe
**To Create:** `frontend/src/app/shared/pipes/currency-format.pipe.ts`

```typescript
@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number, currency: string, locale?: string): string {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value); // R$ 10,00
    } else {
      return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
      }).format(value); // €10,00
    }
  }
}
```

### 3. Update Donation Form Component
**Location:** `frontend/src/app/features/donations/donation.component.ts`

#### Changes Needed:
```typescript
export class DonationComponent implements OnInit {
  donationForm!: FormGroup;
  country$ = this.locationService.detectCountry();
  paymentMethods$ = this.country$.pipe(
    map(info => this.locationService.getPaymentMethods(info.country))
  );

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private donationsService: DonationsService
  ) {}

  ngOnInit() {
    this.country$.subscribe(info => {
      this.donationForm = this.fb.group({
        ongId: ['', Validators.required],
        donorName: ['', Validators.required],
        donorEmail: ['', [Validators.required, Validators.email]],
        amount: [10, [Validators.required, Validators.min(0.5)]],
        donationType: ['one_time', Validators.required],
        country: [info.country, Validators.required],
        currency: [info.currency, Validators.required],
        paymentMethod: ['', Validators.required],
        phoneNumber: [''] // For MBWay
      });
    });
  }

  onCountryChange(country: string) {
    this.donationForm.patchValue({
      country,
      currency: country === 'BR' ? 'BRL' : 'EUR',
      paymentMethod: '' // Reset payment method
    });
  }

  onSubmit() {
    if (this.donationForm.valid) {
      this.donationsService.createDonation(this.donationForm.value)
        .subscribe(response => {
          // Handle different payment methods
          if (response.payment.pixQrCode) {
            this.showPixQRCode(response.payment);
          } else if (response.payment.boletoUrl) {
            this.showBoletoInfo(response.payment);
          } else if (response.payment.entity) {
            this.showMultibancoInfo(response.payment);
          } else if (response.payment.requiresAction) {
            this.showMBWayInstructions(response.payment);
          } else if (response.payment.clientSecret) {
            this.showStripeCardForm(response.payment.clientSecret);
          }
        });
    }
  }
}
```

### 4. Payment Method Components

#### A. PIX Component
**To Create:** `frontend/src/app/features/donations/components/pix-payment.component.ts`

Features:
- Display QR code image
- Show PIX payment string (copyable)
- Countdown timer until expiration
- Poll payment status every 5 seconds
- Show success message when paid

#### B. Boleto Component
**To Create:** `frontend/src/app/features/donations/components/boleto-payment.component.ts`

Features:
- Display boleto barcode
- Download boleto PDF button
- Copy barcode button
- Show expiration date
- Instructions for payment

#### C. Multibanco Component
**To Create:** `frontend/src/app/features/donations/components/multibanco-payment.component.ts`

Features:
- Display entity and reference
- Show amount
- Instructions for ATM payment
- Poll payment status

#### D. MBWay Component
**To Create:** `frontend/src/app/features/donations/components/mbway-payment.component.ts`

Features:
- Phone number input with +351 prefix
- Show instructions
- Wait for push notification confirmation
- Poll payment status

### 5. Payment Status Polling Service
**To Create:** `frontend/src/app/features/donations/services/payment-polling.service.ts`

```typescript
@Injectable()
export class PaymentPollingService {
  pollPaymentStatus(donationId: string, intervalMs: number = 5000): Observable<PaymentStatus> {
    return interval(intervalMs).pipe(
      switchMap(() => this.http.get<any>(`/api/donations/${donationId}/status`)),
      map(response => response.paymentStatus),
      takeWhile(status => status === 'pending' || status === 'processing', true),
      distinctUntilChanged()
    );
  }
}
```

---

## 🎯 Testing Checklist

### Backend Testing

#### Portugal Flow:
- [ ] Create donation with MBWay (requires valid PT phone number)
- [ ] Create donation with Multibanco
- [ ] Create donation with Card
- [ ] Check payment status endpoint
- [ ] Test webhook for completed payments
- [ ] Test refund functionality

#### Brazil Flow:
- [ ] Create donation with PIX
- [ ] Create donation with Boleto
- [ ] Create donation with Card
- [ ] Verify IOF tax calculation
- [ ] Test webhook for completed payments
- [ ] Test refund functionality

#### Multi-Currency:
- [ ] Verify EUR donations are stored correctly
- [ ] Verify BRL donations are stored correctly
- [ ] Test donation statistics by currency
- [ ] Verify currency validation

### Frontend Testing (Once Implemented):

- [ ] Country detection works automatically
- [ ] Manual country override works
- [ ] Payment methods show correctly for each country
- [ ] Currency formatting displays correctly (€10,00 vs R$ 10,00)
- [ ] PIX QR code displays and is scannable
- [ ] Boleto PDF downloads correctly
- [ ] Multibanco reference is correct
- [ ] MBWay phone validation works
- [ ] Payment polling updates status in real-time
- [ ] Success/failure messages display correctly

---

## 📝 Next Steps

### Immediate Actions:

1. **Configure Environment Variables**
   - Add Stripe keys to `.env`
   - Choose Brazilian gateway provider (EBANX recommended)
   - Add Brazilian gateway credentials

2. **Run Database Migration**
   ```bash
   cd backend
   npm run typeorm migration:run
   ```

3. **Test Backend Endpoints**
   - Use Postman/Insomnia to test donation creation
   - Test with different countries and payment methods
   - Verify webhook endpoints work

4. **Implement Frontend Components**
   - Start with LocationService
   - Add currency pipe
   - Update donation form
   - Create payment method components

5. **Stripe Configuration**
   - Enable MBWay in Stripe Dashboard
   - Enable Multibanco in Stripe Dashboard
   - Configure webhook endpoints in Stripe
   - Get test credentials

6. **Brazilian Gateway Setup**
   - Create EBANX or PagSeguro account
   - Get API credentials
   - Configure webhook URLs
   - Test PIX and Boleto in sandbox

### Future Enhancements:

- [ ] Add support for recurring PIX payments (when available)
- [ ] Implement saved payment methods
- [ ] Add donation receipts via email
- [ ] Create admin dashboard for multi-currency stats
- [ ] Add currency conversion display (optional)
- [ ] Implement donation campaigns with country targeting

---

## 🔒 Security Notes

### Important Security Measures Implemented:

1. **Webhook Signature Verification** - All webhooks verify signatures
2. **Payment Intent Validation** - Server-side validation before processing
3. **XSS Protection** - All user input is sanitized
4. **SQL Injection Prevention** - Using TypeORM parameterized queries
5. **Rate Limiting** - Already configured in your app
6. **HTTPS Only** - Required for production (already in your config)

### Additional Security Recommendations:

- Never expose API keys in frontend code
- Always use HTTPS for webhook endpoints
- Rotate API keys periodically
- Monitor for unusual payment patterns
- Implement fraud detection (Stripe Radar)

---

## 📚 Documentation Links

### Stripe:
- [MBWay Documentation](https://stripe.com/docs/payments/mb-way)
- [Multibanco Documentation](https://stripe.com/docs/payments/multibanco)
- [PIX Documentation](https://stripe.com/docs/payments/pix)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### EBANX:
- [API Documentation](https://developers.ebanx.com/api-reference/)
- [PIX Integration](https://developers.ebanx.com/pix/)
- [Boleto Integration](https://developers.ebanx.com/boleto/)

### PagSeguro:
- [API Documentation](https://dev.pagseguro.uol.com.br/reference/api-checkout)
- [PIX Integration](https://dev.pagseguro.uol.com.br/reference/pix)

---

## ✨ Summary of Implementation

### What Was Built:

✅ **Payment Gateway Abstraction** - Clean, extensible architecture
✅ **Multi-Country Support** - PT and BR with proper currency handling
✅ **Stripe Integration** - Native MBWay, Multibanco, and Cards
✅ **Brazilian Gateway** - PIX, Boleto support via EBANX/PagSeguro
✅ **Webhook Handling** - Unified webhook processing
✅ **Database Schema** - Extended with all necessary fields
✅ **Environment Config** - All variables documented

### What's Remaining:

🔄 **Frontend Location Service** - Country detection
🔄 **Frontend Donation Form** - Country selector and dynamic payment methods
🔄 **Payment Method Components** - PIX, Boleto, Multibanco, MBWay, Card UIs
🔄 **Currency Formatting** - EUR and BRL display
🔄 **Payment Polling** - Real-time status updates
🔄 **PWA Version Increment** - For deployment

---

**Document Version:** 1.0
**Last Updated:** January 14, 2025
**Implementation Time:** ~2 hours (backend complete)
**Estimated Remaining:** ~3-4 hours (frontend implementation)

# E2E Testing with Playwright - Aubrigo Payment Flows

## Overview

This directory contains end-to-end (E2E) tests for Aubrigo's critical payment flows using Playwright. The tests ensure that donations work correctly across different countries (Portugal and Brazil) and payment methods (Card, MB WAY, Multibanco, PIX, Boleto).

## Test Coverage

### Payment Flow Tests (`payment-flow.spec.ts`)

**Priority: P1 - HIGH PRIORITY**

Tests cover:
- Portugal payment methods (EUR)
- Brazil payment methods (BRL)
- Currency and country switching
- Form validation
- Mobile responsiveness
- Accessibility (keyboard navigation, ARIA labels)

### Test Scenarios

#### 1. Portugal - Stripe Card Payment
- Successful payment with test card
- Declined card handling
- Form field validation
- 3D Secure authentication (if required)

#### 2. Portugal - MB WAY
- Payment intent creation
- Phone number validation (Portuguese format: +351XXXXXXXXX)
- Payment instructions display
- Pending status handling

#### 3. Portugal - Multibanco
- Reference generation
- Entity and reference format validation (5 and 9 digits)
- Amount display
- Expiration date

#### 4. Brazil - PIX
- PIX key generation
- QR Code display
- Copy to clipboard functionality
- Payment instructions
- Pending confirmation status

#### 5. Brazil - Boleto
- Boleto generation
- Barcode display
- Download link availability
- Expiration date

## Setup

### Prerequisites

```bash
Node.js 18+
npm or yarn
Angular dev server running (localhost:4200)
```

### Installation

Playwright is already installed. If you need to reinstall:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests

### All Tests (Headless)

```bash
npm run test:e2e
```

### Interactive UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Debug Mode

```bash
npm run test:e2e:debug
```

### View Test Report

```bash
npm run test:e2e:report
```

### Run Specific Test File

```bash
npx playwright test payment-flow.spec.ts
```

### Run Specific Test by Name

```bash
npx playwright test -g "should complete successful card payment"
```

### Run on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Data

Test data and fixtures are located in `e2e/fixtures/test-data.ts`:

- Test donors (Portugal and Brazil)
- Test amounts
- Stripe test cards
- Mock payment responses
- Mock ONGs

### Stripe Test Cards

Use these test card numbers from Stripe's testing documentation:

```typescript
// Successful payment
4242424242424242

// Declined payment
4000000000000002

// Requires 3D Secure
4000002500003155
```

Full CVV: 123
Expiry: Any future date (e.g., 12/25)
Postal Code: Any valid format

## Important Implementation Notes

### Data Attributes for Testing

Tests rely on `data-testid` attributes in the HTML. Ensure all interactive elements have these attributes:

**Required data-testid attributes:**

```html
<!-- Form -->
<form data-testid="donation-form">
  <select data-testid="country-select"></select>
  <select data-testid="ong-select"></select>
  <option data-testid="ong-option"></option>
  <input data-testid="donor-name" />
  <input data-testid="donor-email" />
  <input data-testid="donation-amount" />

  <!-- Payment Methods -->
  <button data-testid="payment-method-card"></button>
  <button data-testid="payment-method-mbway"></button>
  <button data-testid="payment-method-multibanco"></button>
  <button data-testid="payment-method-pix"></button>
  <button data-testid="payment-method-boleto"></button>

  <!-- MB WAY Specific -->
  <input data-testid="mbway-phone" />

  <button data-testid="submit-donation"></button>
</form>

<!-- Display Elements -->
<div data-testid="currency-display"></div>
<div data-testid="currency-symbol"></div>

<!-- Payment Confirmation -->
<div data-testid="payment-success"></div>
<div data-testid="success-message"></div>
<div data-testid="payment-error"></div>
<div data-testid="error-message"></div>

<!-- Stripe Payment -->
<button data-testid="confirm-payment"></button>

<!-- MB WAY -->
<div data-testid="mbway-instructions"></div>
<div data-testid="mbway-phone-display"></div>
<div data-testid="payment-status"></div>

<!-- Multibanco -->
<div data-testid="multibanco-details"></div>
<div data-testid="multibanco-entity"></div>
<div data-testid="multibanco-reference"></div>
<div data-testid="multibanco-amount"></div>

<!-- PIX -->
<div data-testid="pix-payment-details"></div>
<div data-testid="pix-key"></div>
<div data-testid="pix-qr-code"></div>
<button data-testid="pix-copy-button"></button>
<div data-testid="pix-instructions"></div>
<div data-testid="copy-success"></div>

<!-- Boleto -->
<div data-testid="boleto-details"></div>
<div data-testid="boleto-barcode"></div>
<a data-testid="boleto-download"></a>
<div data-testid="boleto-expiration"></div>

<!-- Validation Errors -->
<div data-testid="error-ong-required"></div>
<div data-testid="error-name-required"></div>
<div data-testid="error-email-required"></div>
<div data-testid="error-amount-required"></div>
<div data-testid="error-phone-invalid"></div>
```

### Backend API Requirements

Tests expect the following API endpoints to work:

```
POST /api/v1/donations - Create donation
GET /api/v1/ongs - Get list of ONGs (filtered by country)
GET /api/v1/payments/:paymentIntentId/status - Get payment status
```

### Stripe Test Mode

Ensure your backend is configured with Stripe test mode keys:
- Publishable key starts with `pk_test_`
- Secret key starts with `sk_test_`

### Mock vs Real Backend

Currently, tests run against a real backend API running on localhost:4200. For CI/CD:

1. **Option A:** Mock API responses using Playwright's route interception
2. **Option B:** Use a dedicated test backend with seeded data
3. **Option C:** Use Docker Compose to spin up test environment

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Visual Debugging

Use Playwright's UI mode:

```bash
npm run test:e2e:ui
```

### Debug Specific Test

```bash
npm run test:e2e:debug -- -g "PIX payment"
```

### Generate Trace

```bash
npx playwright test --trace on
```

Then view the trace:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (on failure)
- Videos (on failure)
- Traces (on retry)

Located in: `test-results/`

## Best Practices

### DO

- Use `data-testid` attributes for selectors
- Test critical user journeys only
- Keep tests independent (no shared state)
- Use descriptive test names
- Test error cases and validations
- Mock external services when possible
- Run tests in parallel

### DON'T

- Use CSS classes or IDs as selectors (they change)
- Create overly granular tests (test user journeys, not individual functions)
- Share state between tests
- Hard-code URLs or credentials
- Skip accessibility tests
- Ignore flaky tests

## Accessibility Testing

Tests include basic accessibility checks:
- Keyboard navigation
- ARIA labels
- Focus management

For comprehensive accessibility audits, use:

```bash
npx playwright test --project="chromium" --grep accessibility
```

## Performance Testing

Playwright can measure performance metrics:

```typescript
const metrics = await page.metrics();
console.log(metrics);
```

Track:
- Time to Interactive (TTI)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

## Troubleshooting

### Tests Fail with "Timeout"

- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify API endpoints are accessible

### Stripe Elements Not Loading

- Check Stripe publishable key is set
- Verify network connection
- Check browser console for errors

### "Element not found" Errors

- Verify `data-testid` attributes exist
- Check if element is visible (not hidden by CSS)
- Wait for animations to complete

### Clipboard Tests Fail

- Grant clipboard permissions in test
- Use fallback methods for older browsers

## Contributing

When adding new payment methods or features:

1. Add test scenarios to `payment-flow.spec.ts`
2. Update test data in `fixtures/test-data.ts`
3. Add required `data-testid` attributes to components
4. Update this README with new test coverage
5. Run full test suite before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Angular Testing](https://angular.io/guide/testing)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For issues or questions:
- Open an issue in the repository
- Contact the QA team
- Review Playwright logs: `DEBUG=pw:api npm run test:e2e`

---

**Last Updated:** January 2025
**Maintained By:** Aubrigo QA Team

import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Payment Flows
 *
 * Tests critical donation payment flows across:
 * - Portugal: Stripe Card, MB WAY, Multibanco
 * - Brazil: PIX, Boleto
 *
 * Priority: P1 - HIGH PRIORITY
 *
 * These tests use Stripe test mode and mock backend responses where needed.
 */

// Test Data
const TEST_DONOR = {
  name: 'João Silva',
  email: 'joao.silva@test.com',
  cpf: '123.456.789-00',
  phonePortugal: '+351912345678',
  phoneBrazil: '+5511987654321'
};

const TEST_AMOUNTS = {
  EUR: 50,
  BRL: 100
};

// Stripe Test Cards (from Stripe documentation)
const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuthentication: '4000002500003155'
};

/**
 * Helper Functions
 */

/**
 * Navigate to donation page and wait for it to load
 */
async function navigateToDonationPage(page: Page): Promise<void> {
  await page.goto('/donate');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="donation-form"]')).toBeVisible({ timeout: 10000 });
}

/**
 * Fill donor information form
 */
async function fillDonorInfo(page: Page, donor: typeof TEST_DONOR): Promise<void> {
  await page.fill('[data-testid="donor-name"]', donor.name);
  await page.fill('[data-testid="donor-email"]', donor.email);
}

/**
 * Select ONG from dropdown
 */
async function selectOng(page: Page): Promise<void> {
  const ongSelect = page.locator('[data-testid="ong-select"]');
  await ongSelect.click();
  // Select first ONG in the list
  await page.locator('[data-testid="ong-option"]').first().click();
}

/**
 * Select country and verify currency update
 */
async function selectCountry(page: Page, country: 'PT' | 'BR', expectedCurrency: string): Promise<void> {
  await page.selectOption('[data-testid="country-select"]', country);
  await expect(page.locator('[data-testid="currency-display"]')).toContainText(expectedCurrency);
}

/**
 * Fill donation amount
 */
async function fillDonationAmount(page: Page, amount: number): Promise<void> {
  await page.fill('[data-testid="donation-amount"]', amount.toString());
}

/**
 * Select payment method
 */
async function selectPaymentMethod(page: Page, method: string): Promise<void> {
  await page.click(`[data-testid="payment-method-${method}"]`);
}

/**
 * Submit donation form
 */
async function submitDonationForm(page: Page): Promise<void> {
  await page.click('[data-testid="submit-donation"]');
}

/**
 * PORTUGAL - STRIPE CARD PAYMENT
 */
test.describe('Portugal - Stripe Card Payment', () => {
  test('should complete successful card payment', async ({ page }) => {
    // Navigate to donation page
    await navigateToDonationPage(page);

    // Select Portugal
    await selectCountry(page, 'PT', 'EUR');

    // Select ONG
    await selectOng(page);

    // Fill donation amount
    await fillDonationAmount(page, TEST_AMOUNTS.EUR);

    // Fill donor info
    await fillDonorInfo(page, TEST_DONOR);

    // Select Card payment method
    await selectPaymentMethod(page, 'card');

    // Submit form
    await submitDonationForm(page);

    // Wait for Stripe Elements to load
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 });

    // Switch to Stripe iframe
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();

    // Fill card details (Stripe test card)
    await stripeFrame.locator('[name="cardnumber"]').fill(STRIPE_TEST_CARDS.success);
    await stripeFrame.locator('[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('[name="cvc"]').fill('123');
    await stripeFrame.locator('[name="postal"]').fill('1000-001');

    // Submit payment
    await page.click('[data-testid="confirm-payment"]');

    // Verify success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Pagamento confirmado');
  });

  test('should handle declined card', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'PT', 'EUR');
    await selectOng(page);
    await fillDonationAmount(page, TEST_AMOUNTS.EUR);
    await fillDonorInfo(page, TEST_DONOR);
    await selectPaymentMethod(page, 'card');
    await submitDonationForm(page);

    // Wait for Stripe Elements
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 10000 });
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();

    // Fill with declined test card
    await stripeFrame.locator('[name="cardnumber"]').fill(STRIPE_TEST_CARDS.declined);
    await stripeFrame.locator('[name="exp-date"]').fill('12/25');
    await stripeFrame.locator('[name="cvc"]').fill('123');
    await stripeFrame.locator('[name="postal"]').fill('1000-001');

    // Submit payment
    await page.click('[data-testid="confirm-payment"]');

    // Verify error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('falhou');
  });

  test('should validate required fields', async ({ page }) => {
    await navigateToDonationPage(page);

    // Try to submit without filling fields
    await submitDonationForm(page);

    // Verify validation errors
    await expect(page.locator('[data-testid="error-ong-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-name-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-amount-required"]')).toBeVisible();
  });
});

/**
 * PORTUGAL - MB WAY PAYMENT
 */
test.describe('Portugal - MB WAY Payment', () => {
  test('should create MB WAY payment intent', async ({ page }) => {
    await navigateToDonationPage(page);

    // Select Portugal
    await selectCountry(page, 'PT', 'EUR');

    // Select ONG
    await selectOng(page);

    // Fill amount
    await fillDonationAmount(page, 25);

    // Fill donor info
    await fillDonorInfo(page, TEST_DONOR);

    // Select MB WAY
    await selectPaymentMethod(page, 'mbway');

    // Phone number field should appear
    await expect(page.locator('[data-testid="mbway-phone"]')).toBeVisible();

    // Fill Portuguese phone number
    await page.fill('[data-testid="mbway-phone"]', TEST_DONOR.phonePortugal);

    // Submit
    await submitDonationForm(page);

    // Wait for payment processing
    await page.waitForSelector('[data-testid="mbway-instructions"]', { timeout: 10000 });

    // Verify MB WAY instructions are shown
    await expect(page.locator('[data-testid="mbway-instructions"]')).toBeVisible();
    await expect(page.locator('[data-testid="mbway-phone-display"]')).toContainText(TEST_DONOR.phonePortugal);
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Aguardando confirmação');
  });

  test('should validate Portuguese phone format', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'PT', 'EUR');
    await selectOng(page);
    await fillDonorInfo(page, TEST_DONOR);
    await selectPaymentMethod(page, 'mbway');

    // Try invalid phone format
    await page.fill('[data-testid="mbway-phone"]', '123456789');
    await submitDonationForm(page);

    // Verify validation error
    await expect(page.locator('[data-testid="error-phone-invalid"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-phone-invalid"]')).toContainText('formato inválido');
  });
});

/**
 * PORTUGAL - MULTIBANCO PAYMENT
 */
test.describe('Portugal - Multibanco Payment', () => {
  test('should generate Multibanco reference', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'PT', 'EUR');
    await selectOng(page);
    await fillDonationAmount(page, TEST_AMOUNTS.EUR);
    await fillDonorInfo(page, TEST_DONOR);

    // Select Multibanco
    await selectPaymentMethod(page, 'multibanco');
    await submitDonationForm(page);

    // Wait for Multibanco details
    await page.waitForSelector('[data-testid="multibanco-details"]', { timeout: 10000 });

    // Verify Multibanco entity and reference are displayed
    await expect(page.locator('[data-testid="multibanco-entity"]')).toBeVisible();
    await expect(page.locator('[data-testid="multibanco-reference"]')).toBeVisible();
    await expect(page.locator('[data-testid="multibanco-amount"]')).toContainText('50');

    // Verify entity format (5 digits)
    const entity = await page.locator('[data-testid="multibanco-entity"]').textContent();
    expect(entity).toMatch(/^\d{5}$/);

    // Verify reference format (9 digits)
    const reference = await page.locator('[data-testid="multibanco-reference"]').textContent();
    expect(reference).toMatch(/^\d{9}$/);
  });
});

/**
 * BRAZIL - PIX PAYMENT
 */
test.describe('Brazil - PIX Payment', () => {
  test('should display PIX key and QR code', async ({ page }) => {
    await navigateToDonationPage(page);

    // Select Brazil
    await selectCountry(page, 'BR', 'BRL');

    // Select ONG
    await selectOng(page);

    // Fill amount in BRL
    await fillDonationAmount(page, TEST_AMOUNTS.BRL);

    // Fill donor info
    await fillDonorInfo(page, TEST_DONOR);

    // Select PIX
    await selectPaymentMethod(page, 'pix');

    // Submit
    await submitDonationForm(page);

    // Wait for PIX details to load
    await page.waitForSelector('[data-testid="pix-payment-details"]', { timeout: 10000 });

    // Verify PIX key is displayed
    await expect(page.locator('[data-testid="pix-key"]')).toBeVisible();

    // Verify QR code is displayed
    await expect(page.locator('[data-testid="pix-qr-code"]')).toBeVisible();

    // Verify copy button exists
    await expect(page.locator('[data-testid="pix-copy-button"]')).toBeVisible();

    // Verify payment instructions
    await expect(page.locator('[data-testid="pix-instructions"]')).toBeVisible();
  });

  test('should copy PIX key to clipboard', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'BR', 'BRL');
    await selectOng(page);
    await fillDonationAmount(page, TEST_AMOUNTS.BRL);
    await fillDonorInfo(page, TEST_DONOR);
    await selectPaymentMethod(page, 'pix');
    await submitDonationForm(page);

    // Wait for PIX details
    await page.waitForSelector('[data-testid="pix-copy-button"]', { timeout: 10000 });

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button
    await page.click('[data-testid="pix-copy-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="copy-success"]')).toContainText('copiada');

    // Verify clipboard has content (PIX key)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(10);
  });

  test('should show payment pending status', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'BR', 'BRL');
    await selectOng(page);
    await fillDonationAmount(page, TEST_AMOUNTS.BRL);
    await fillDonorInfo(page, TEST_DONOR);
    await selectPaymentMethod(page, 'pix');
    await submitDonationForm(page);

    // Wait for PIX payment screen
    await page.waitForSelector('[data-testid="payment-status"]', { timeout: 10000 });

    // Verify status shows pending
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('Aguardando');
  });
});

/**
 * BRAZIL - BOLETO PAYMENT
 */
test.describe('Brazil - Boleto Payment', () => {
  test('should generate Boleto with barcode and download link', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'BR', 'BRL');
    await selectOng(page);
    await fillDonationAmount(page, TEST_AMOUNTS.BRL);
    await fillDonorInfo(page, TEST_DONOR);

    // Select Boleto
    await selectPaymentMethod(page, 'boleto');
    await submitDonationForm(page);

    // Wait for Boleto details
    await page.waitForSelector('[data-testid="boleto-details"]', { timeout: 10000 });

    // Verify barcode is displayed
    await expect(page.locator('[data-testid="boleto-barcode"]')).toBeVisible();

    // Verify download link exists
    const downloadButton = page.locator('[data-testid="boleto-download"]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toHaveAttribute('href', /.+/);

    // Verify expiration date
    await expect(page.locator('[data-testid="boleto-expiration"]')).toBeVisible();
  });
});

/**
 * CURRENCY VALIDATION
 */
test.describe('Currency and Country Switching', () => {
  test('should update currency when changing country', async ({ page }) => {
    await navigateToDonationPage(page);

    // Start with Portugal
    await selectCountry(page, 'PT', 'EUR');
    await expect(page.locator('[data-testid="currency-symbol"]')).toContainText('€');

    // Switch to Brazil
    await selectCountry(page, 'BR', 'BRL');
    await expect(page.locator('[data-testid="currency-symbol"]')).toContainText('R$');

    // Switch back to Portugal
    await selectCountry(page, 'PT', 'EUR');
    await expect(page.locator('[data-testid="currency-symbol"]')).toContainText('€');
  });

  test('should show correct payment methods for each country', async ({ page }) => {
    await navigateToDonationPage(page);

    // Portugal should show: card, mbway, multibanco
    await selectCountry(page, 'PT', 'EUR');
    await expect(page.locator('[data-testid="payment-method-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-mbway"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-multibanco"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-pix"]')).not.toBeVisible();

    // Brazil should show: card, pix, boleto
    await selectCountry(page, 'BR', 'BRL');
    await expect(page.locator('[data-testid="payment-method-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-pix"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-boleto"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-method-mbway"]')).not.toBeVisible();
  });
});

/**
 * MOBILE RESPONSIVE TESTS
 */
test.describe('Mobile Payment Flow', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should complete payment flow on mobile', async ({ page }) => {
    await navigateToDonationPage(page);
    await selectCountry(page, 'PT', 'EUR');
    await selectOng(page);
    await fillDonationAmount(page, 25);
    await fillDonorInfo(page, TEST_DONOR);
    await selectPaymentMethod(page, 'mbway');
    await page.fill('[data-testid="mbway-phone"]', TEST_DONOR.phonePortugal);
    await submitDonationForm(page);

    // Verify mobile layout
    await expect(page.locator('[data-testid="mbway-instructions"]')).toBeVisible();
  });
});

/**
 * ACCESSIBILITY TESTS
 */
test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await navigateToDonationPage(page);

    // Tab through form fields
    await page.keyboard.press('Tab'); // ONG select
    await page.keyboard.press('Tab'); // Name
    await page.keyboard.press('Tab'); // Email
    await page.keyboard.press('Tab'); // Amount
    await page.keyboard.press('Tab'); // Country

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await navigateToDonationPage(page);

    // Check form has label
    await expect(page.locator('[data-testid="donation-form"]')).toHaveAttribute('aria-label');

    // Check inputs have labels
    await expect(page.locator('[data-testid="donor-name"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="donor-email"]')).toHaveAttribute('aria-label');
  });
});

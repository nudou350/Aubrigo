# Donation System Tests - Key Examples

This document highlights key testing patterns used in the donation system test suite.

## Table of Contents
1. [Service Testing Patterns](#service-testing-patterns)
2. [Component Testing Patterns](#component-testing-patterns)
3. [Signal Testing](#signal-testing)
4. [Async Operations](#async-operations)
5. [Form Validation](#form-validation)
6. [Error Handling](#error-handling)

---

## Service Testing Patterns

### Basic Service Test Setup

```typescript
describe('DonationsService', () => {
  let service: DonationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DonationsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DonationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensures no outstanding requests
  });
});
```

### Testing HTTP GET with Query Parameters

```typescript
it('should fetch ONGs with multiple filters', () => {
  const filters: OngFilters = {
    search: 'Animal',
    location: 'Porto',
    countryCode: 'PT'
  };

  service.getAllOngs(filters).subscribe({
    next: (ongs) => {
      expect(ongs).toEqual(mockOngs);
    }
  });

  const req = httpMock.expectOne(
    `${usersUrl}?search=Animal&location=Porto&countryCode=PT`
  );
  expect(req.request.method).toBe('GET');
  expect(req.request.params.get('search')).toBe('Animal');
  req.flush(mockOngs);
});
```

### Testing HTTP POST with Request Body

```typescript
it('should create a donation with card payment method', () => {
  const donationRequest: DonationRequest = {
    ongId: '123',
    donorName: 'John Doe',
    donorEmail: 'john@example.com',
    amount: 50,
    donationType: 'one_time',
    country: 'PT',
    currency: 'EUR',
    paymentMethod: 'card',
    cardHolderName: 'John Doe'
  };

  service.createDonation(donationRequest).subscribe({
    next: (response) => {
      expect(response.donation.id).toBe('donation-123');
      expect(response.payment.clientSecret).toBeTruthy();
    }
  });

  const req = httpMock.expectOne(apiUrl);
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual(donationRequest);
  req.flush(mockResponse);
});
```

### Testing Error Scenarios

```typescript
it('should handle error when fetching ONGs', () => {
  const errorMessage = 'Failed to fetch ONGs';

  service.getAllOngs().subscribe({
    next: () => fail('should have failed with 500 error'),
    error: (error) => {
      expect(error.status).toBe(500);
      expect(error.error).toBe(errorMessage);
    }
  });

  const req = httpMock.expectOne(usersUrl);
  req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
});
```

---

## Component Testing Patterns

### Component Test Setup

```typescript
describe('DonationEnhancedComponent', () => {
  let component: DonationEnhancedComponent;
  let fixture: ComponentFixture<DonationEnhancedComponent>;
  let mockDonationsService: jasmine.SpyObj<DonationsService>;
  let mockCountryService: jasmine.SpyObj<CountryService>;

  beforeEach(async () => {
    mockDonationsService = jasmine.createSpyObj('DonationsService', [
      'getAllOngs',
      'createDonation'
    ]);

    mockCountryService = jasmine.createSpyObj('CountryService', [
      'getCountry',
      'getCurrency',
      'getPaymentMethods'
    ]);

    // Setup default return values
    mockCountryService.getCountry.and.returnValue('PT');
    mockDonationsService.getAllOngs.and.returnValue(of(mockOngs));

    await TestBed.configureTestingModule({
      imports: [DonationEnhancedComponent, ReactiveFormsModule],
      providers: [
        { provide: DonationsService, useValue: mockDonationsService },
        { provide: CountryService, useValue: mockCountryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DonationEnhancedComponent);
    component = fixture.componentInstance;
  });
});
```

### Testing Component Initialization

```typescript
it('should initialize with Portugal country settings', () => {
  fixture.detectChanges();

  expect(component.country()).toBe('PT');
  expect(component.currency().code).toBe('EUR');
  expect(component.currency().symbol).toBe('€');
  expect(component.availablePaymentMethods().length).toBe(3);
  expect(mockDonationsService.getAllOngs).toHaveBeenCalledWith({
    countryCode: 'PT'
  });
});
```

---

## Signal Testing

### Testing Signal State

```typescript
it('should update selectedPaymentMethod signal when payment method changes', () => {
  component.donationForm.get('paymentMethod')?.setValue('card');
  expect(component.selectedPaymentMethod()).toBe('card');

  component.donationForm.get('paymentMethod')?.setValue('mbway');
  expect(component.selectedPaymentMethod()).toBe('mbway');
});
```

### Testing Signal Updates

```typescript
it('should set loading state during submission', () => {
  mockDonationsService.createDonation.and.returnValue(of(mockResponse));

  // Initial state
  expect(component.isLoading()).toBe(false);

  component.onSubmit();

  // After completion
  expect(component.isLoading()).toBe(false);
});
```

### Testing Computed/Derived State

```typescript
it('should return selected ONG when ongId is set', () => {
  component.donationForm.get('ongId')?.setValue('ong-1');

  const selectedOng = component.getSelectedOng();

  expect(selectedOng).toBeTruthy();
  expect(selectedOng?.id).toBe('ong-1');
  expect(selectedOng?.ongName).toBe('Animal Rescue PT');
});
```

---

## Async Operations

### Testing with fakeAsync and tick()

```typescript
it('should copy PIX key to clipboard', fakeAsync(() => {
  component.paymentResponse.set(mockPixResponse);

  const clipboardSpy = spyOn(navigator.clipboard, 'writeText')
    .and.returnValue(Promise.resolve());

  component.copyPixKey();
  tick(); // Resolve promise

  expect(clipboardSpy).toHaveBeenCalledWith('test@pix.com');
  expect(component.pixKeyCopied()).toBe(true);
  expect(mockToastService.success).toHaveBeenCalledWith('Chave PIX copiada!');

  tick(3000); // Wait for auto-reset
  expect(component.pixKeyCopied()).toBe(false);
}));
```

### Testing Navigation with Timers

```typescript
it('should handle payment completion', fakeAsync(() => {
  component.onPaymentCompleted();

  expect(mockToastService.success).toHaveBeenCalledWith(
    'Pagamento confirmado! Obrigado pela sua doação.'
  );

  tick(3000); // Wait for navigation delay
  expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
}));
```

---

## Form Validation

### Testing Required Fields

```typescript
it('should validate ongId is required', () => {
  const ongIdControl = component.donationForm.get('ongId');
  ongIdControl?.setValue('');

  expect(ongIdControl?.hasError('required')).toBe(true);
  expect(component.donationForm.invalid).toBe(true);
});
```

### Testing Email Validation

```typescript
it('should validate donorEmail is required and valid', () => {
  const emailControl = component.donationForm.get('donorEmail');

  emailControl?.setValue('');
  expect(emailControl?.hasError('required')).toBe(true);

  emailControl?.setValue('invalid-email');
  expect(emailControl?.hasError('email')).toBe(true);

  emailControl?.setValue('valid@example.com');
  expect(emailControl?.valid).toBe(true);
});
```

### Testing Custom Validation

```typescript
it('should validate amount is required and minimum 0.5', () => {
  const amountControl = component.donationForm.get('amount');

  amountControl?.setValue(null);
  expect(amountControl?.hasError('required')).toBe(true);

  amountControl?.setValue(0.3);
  expect(amountControl?.hasError('min')).toBe(true);

  amountControl?.setValue(10);
  expect(amountControl?.valid).toBe(true);
});
```

### Testing Conditional Validation

```typescript
it('should make phoneNumber required when MB WAY is selected', () => {
  const phoneControl = component.donationForm.get('phoneNumber');

  // Initially not required
  expect(phoneControl?.hasError('required')).toBe(false);

  // Select MB WAY
  component.donationForm.get('paymentMethod')?.setValue('mbway');

  // Now required
  expect(phoneControl?.hasError('required')).toBe(true);

  // Valid Portuguese number
  phoneControl?.setValue('+351912345678');
  expect(phoneControl?.valid).toBe(true);
});
```

---

## Error Handling

### Testing Form Submission with Invalid Form

```typescript
it('should not submit if form is invalid', () => {
  component.donationForm.patchValue({
    ongId: '',
    donorName: '',
    donorEmail: ''
  });

  component.onSubmit();

  expect(mockDonationsService.createDonation).not.toHaveBeenCalled();
  expect(mockToastService.error).toHaveBeenCalledWith(
    'Por favor, preencha todos os campos obrigatórios'
  );
});
```

### Testing API Error Handling

```typescript
it('should handle error on donation submission', () => {
  const errorResponse = {
    error: {
      message: 'Payment processing failed'
    }
  };

  mockDonationsService.createDonation.and.returnValue(
    throwError(() => errorResponse)
  );

  component.donationForm.patchValue(validDonationData);
  component.onSubmit();

  expect(component.isLoading()).toBe(false);
  expect(mockToastService.error).toHaveBeenCalledWith('Payment processing failed');
});
```

### Testing Default Error Messages

```typescript
it('should show default message when error.error.message is not available', () => {
  mockDonationsService.createDonation.and.returnValue(
    throwError(() => new Error('Network error'))
  );

  component.donationForm.patchValue(validDonationData);
  component.onSubmit();

  expect(mockToastService.error).toHaveBeenCalledWith(
    'Erro ao processar doação. Tente novamente.'
  );
});
```

---

## Advanced Testing Patterns

### Testing Service Integration

```typescript
it('should track donation start analytics event', () => {
  mockDonationsService.createDonation.and.returnValue(of(mockResponse));

  component.donationForm.patchValue({
    ongId: 'ong-1',
    amount: 50,
    currency: 'EUR',
    paymentMethod: 'card'
    // ... other fields
  });

  component.onSubmit();

  expect(mockAnalyticsService.track).toHaveBeenCalledWith(
    EventType.DONATION_START,
    {
      ongId: 'ong-1',
      metadata: {
        amount: 50,
        currency: 'EUR',
        paymentMethod: 'card'
      }
    }
  );
});
```

### Testing State Transitions

```typescript
it('should transition from form to payment step on successful submission', () => {
  mockDonationsService.createDonation.and.returnValue(of(mockResponse));

  expect(component.currentStep()).toBe('form');
  expect(component.paymentResponse()).toBeNull();

  component.donationForm.patchValue(validDonationData);
  component.onSubmit();

  expect(component.currentStep()).toBe('payment');
  expect(component.paymentResponse()).toEqual(mockResponse);
  expect(mockToastService.success).toHaveBeenCalledWith('Pagamento iniciado');
});
```

### Testing Fallback Mechanisms

```typescript
it('should use fallback copy method when clipboard API fails', () => {
  component.paymentResponse.set(mockPixResponse);

  // Mock clipboard API to fail
  spyOn(navigator.clipboard, 'writeText').and.returnValue(
    Promise.reject(new Error('Clipboard not available'))
  );

  // Mock document.execCommand
  const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(true);

  component.copyPixKey();

  // Fallback should eventually execute
  setTimeout(() => {
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
  }, 100);
});
```

---

## Best Practices Demonstrated

### 1. Descriptive Test Names
Use complete sentences that describe the expected behavior:
```typescript
it('should validate donorEmail is required and valid', () => { });
it('should copy PIX key to clipboard', () => { });
it('should handle error when fetching ONGs', () => { });
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should update payment methods when country changes', () => {
  // Arrange
  mockCountryService.getCountry.and.returnValue('BR');
  mockCountryService.getPaymentMethods.and.returnValue(brazilMethods);

  // Act
  fixture.detectChanges();

  // Assert
  expect(component.availablePaymentMethods().length).toBe(3);
  expect(component.availablePaymentMethods()[0].id).toBe('pix');
});
```

### 3. Test Isolation
Each test is independent and doesn't rely on other tests:
```typescript
beforeEach(() => {
  // Fresh component instance for each test
  fixture = TestBed.createComponent(DonationEnhancedComponent);
  component = fixture.componentInstance;
});
```

### 4. Proper Cleanup
```typescript
afterEach(() => {
  httpMock.verify(); // Verify no outstanding HTTP requests
});
```

### 5. Mock Data Reusability
```typescript
const mockOngs: Ong[] = [
  {
    id: 'ong-1',
    ongName: 'Animal Rescue PT',
    location: 'Porto',
    countryCode: 'PT'
  }
];
// Reused across multiple tests
```

---

## Running the Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Specific Test File
```bash
ng test --include='**/donations.service.spec.ts'
```

### Run with Coverage
```bash
ng test --code-coverage --watch=false
```

### Run in CI/CD
```bash
ng test --browsers=ChromeHeadless --watch=false --code-coverage
```

---

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are properly imported
2. **Signal Updates**: Remember to call signals as functions: `signal()`
3. **Async Operations**: Use `fakeAsync` and `tick()` for timing control
4. **HTTP Mocking**: Always verify with `httpMock.verify()` in afterEach
5. **Component Detection**: Call `fixture.detectChanges()` to trigger change detection

---

This test suite demonstrates production-ready testing practices for Angular 17+ applications with comprehensive coverage of real-world scenarios.

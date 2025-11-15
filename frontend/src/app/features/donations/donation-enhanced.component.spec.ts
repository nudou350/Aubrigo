import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { DonationEnhancedComponent } from './donation-enhanced.component';
import { DonationsService, DonationResponse, Ong } from '../../core/services/donations.service';
import { CountryService, PaymentMethod } from '../../core/services/country.service';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService, EventType } from '../../core/services/analytics.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

describe('DonationEnhancedComponent', () => {
  let component: DonationEnhancedComponent;
  let fixture: ComponentFixture<DonationEnhancedComponent>;
  let mockDonationsService: jasmine.SpyObj<DonationsService>;
  let mockCountryService: jasmine.SpyObj<CountryService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAnalyticsService: jasmine.SpyObj<AnalyticsService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockOngs: Ong[] = [
    {
      id: 'ong-1',
      ongName: 'Animal Rescue PT',
      location: 'Porto',
      phone: '+351912345678',
      profileImageUrl: 'https://example.com/ong1.jpg',
      countryCode: 'PT'
    },
    {
      id: 'ong-2',
      ongName: 'Pet Shelter Lisbon',
      location: 'Lisbon',
      countryCode: 'PT'
    }
  ];

  const mockPaymentMethodsPT: PaymentMethod[] = [
    {
      id: 'mbway',
      name: 'MB WAY',
      description: 'Pagamento instantâneo via telemóvel',
      icon: 'phone_iphone',
      requiresPhone: true
    },
    {
      id: 'multibanco',
      name: 'Multibanco',
      description: 'Referência para pagamento em ATM',
      icon: 'account_balance',
      requiresPhone: false
    },
    {
      id: 'card',
      name: 'Cartão',
      description: 'Cartão de crédito ou débito',
      icon: 'credit_card',
      requiresPhone: false
    }
  ];

  const mockPaymentMethodsBR: PaymentMethod[] = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: 'account_balance',
      requiresPhone: false
    },
    {
      id: 'boleto',
      name: 'Boleto',
      description: 'Boleto bancário',
      icon: 'receipt',
      requiresPhone: false
    },
    {
      id: 'card',
      name: 'Cartão',
      description: 'Cartão de crédito ou débito',
      icon: 'credit_card',
      requiresPhone: false
    }
  ];

  beforeEach(async () => {
    // Create spies
    mockDonationsService = jasmine.createSpyObj('DonationsService', [
      'getAllOngs',
      'createDonation',
      'checkPaymentStatus',
      'getDonationsByOng'
    ]);

    mockCountryService = jasmine.createSpyObj('CountryService', [
      'getCountry',
      'getCurrency',
      'getPaymentMethods',
      'setCountry'
    ]);

    mockToastService = jasmine.createSpyObj('ToastService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    mockAnalyticsService = jasmine.createSpyObj('AnalyticsService', [
      'track'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Setup default return values
    mockCountryService.getCountry.and.returnValue('PT');
    mockCountryService.getCurrency.and.returnValue({
      code: 'EUR',
      symbol: '€',
      locale: 'pt-PT'
    });
    mockCountryService.getPaymentMethods.and.returnValue(mockPaymentMethodsPT);
    mockDonationsService.getAllOngs.and.returnValue(of(mockOngs));

    await TestBed.configureTestingModule({
      imports: [
        DonationEnhancedComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: DonationsService, useValue: mockDonationsService },
        { provide: CountryService, useValue: mockCountryService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: Router, useValue: mockRouter },
        CurrencyFormatPipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DonationEnhancedComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with Portugal country settings', () => {
      fixture.detectChanges();

      expect(component.country()).toBe('PT');
      expect(component.currency().code).toBe('EUR');
      expect(component.currency().symbol).toBe('€');
      expect(component.availablePaymentMethods().length).toBe(3);
    });

    it('should initialize with Brazil country settings', () => {
      mockCountryService.getCountry.and.returnValue('BR');
      mockCountryService.getCurrency.and.returnValue({
        code: 'BRL',
        symbol: 'R$',
        locale: 'pt-BR'
      });
      mockCountryService.getPaymentMethods.and.returnValue(mockPaymentMethodsBR);

      fixture.detectChanges();

      expect(component.country()).toBe('BR');
      expect(component.currency().code).toBe('BRL');
      expect(component.currency().symbol).toBe('R$');
      expect(component.availablePaymentMethods().length).toBe(3);
    });

    it('should load ONGs on initialization', () => {
      fixture.detectChanges();

      expect(mockDonationsService.getAllOngs).toHaveBeenCalledWith({
        countryCode: 'PT'
      });
      expect(component.ongs().length).toBe(2);
    });

    it('should initialize form with default values', () => {
      fixture.detectChanges();

      expect(component.donationForm.get('amount')?.value).toBe(10);
      expect(component.donationForm.get('donationType')?.value).toBe('one_time');
      expect(component.donationForm.get('country')?.value).toBe('PT');
      expect(component.donationForm.get('currency')?.value).toBe('EUR');
    });

    it('should set current step to form initially', () => {
      fixture.detectChanges();

      expect(component.currentStep()).toBe('form');
    });

    it('should handle error when loading ONGs fails', () => {
      mockDonationsService.getAllOngs.and.returnValue(
        throwError(() => new Error('Failed to load ONGs'))
      );

      fixture.detectChanges();

      expect(mockToastService.error).toHaveBeenCalledWith('Erro ao carregar ONGs');
      expect(component.ongs().length).toBe(0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as invalid when required fields are empty', () => {
      component.donationForm.patchValue({
        ongId: '',
        donorName: '',
        donorEmail: '',
        paymentMethod: ''
      });

      expect(component.donationForm.invalid).toBe(true);
    });

    it('should validate ongId is required', () => {
      const ongIdControl = component.donationForm.get('ongId');
      ongIdControl?.setValue('');

      expect(ongIdControl?.hasError('required')).toBe(true);
    });

    it('should validate donorName is required', () => {
      const donorNameControl = component.donationForm.get('donorName');
      donorNameControl?.setValue('');

      expect(donorNameControl?.hasError('required')).toBe(true);
    });

    it('should validate donorEmail is required and valid', () => {
      const emailControl = component.donationForm.get('donorEmail');

      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate amount is required and minimum 0.5', () => {
      const amountControl = component.donationForm.get('amount');

      amountControl?.setValue(null);
      expect(amountControl?.hasError('required')).toBe(true);

      amountControl?.setValue(0.3);
      expect(amountControl?.hasError('min')).toBe(true);

      amountControl?.setValue(10);
      expect(amountControl?.valid).toBe(true);
    });

    it('should validate paymentMethod is required', () => {
      const paymentMethodControl = component.donationForm.get('paymentMethod');
      paymentMethodControl?.setValue('');

      expect(paymentMethodControl?.hasError('required')).toBe(true);
    });

    it('should mark form as valid when all required fields are filled', () => {
      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      expect(component.donationForm.valid).toBe(true);
    });
  });

  describe('Payment Method Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update selectedPaymentMethod signal when payment method changes', () => {
      component.donationForm.get('paymentMethod')?.setValue('card');
      expect(component.selectedPaymentMethod()).toBe('card');

      component.donationForm.get('paymentMethod')?.setValue('mbway');
      expect(component.selectedPaymentMethod()).toBe('mbway');
    });

    it('should make phoneNumber required when MB WAY is selected', () => {
      const phoneControl = component.donationForm.get('phoneNumber');

      component.donationForm.get('paymentMethod')?.setValue('mbway');

      expect(phoneControl?.hasError('required')).toBe(true);

      phoneControl?.setValue('+351912345678');
      expect(phoneControl?.valid).toBe(true);
    });

    it('should validate phoneNumber format for MB WAY', () => {
      const phoneControl = component.donationForm.get('phoneNumber');
      component.donationForm.get('paymentMethod')?.setValue('mbway');

      phoneControl?.setValue('912345678');
      expect(phoneControl?.hasError('pattern')).toBe(true);

      phoneControl?.setValue('+351912345678');
      expect(phoneControl?.valid).toBe(true);
    });

    it('should clear phoneNumber validators when switching from MB WAY', () => {
      const phoneControl = component.donationForm.get('phoneNumber');

      component.donationForm.get('paymentMethod')?.setValue('mbway');
      expect(phoneControl?.hasError('required')).toBe(true);

      component.donationForm.get('paymentMethod')?.setValue('card');
      expect(phoneControl?.hasError('required')).toBe(false);
    });
  });

  describe('Country and Currency Selection', () => {
    it('should update payment methods when country changes to Brazil', () => {
      mockCountryService.getCountry.and.returnValue('BR');
      mockCountryService.getCurrency.and.returnValue({
        code: 'BRL',
        symbol: 'R$',
        locale: 'pt-BR'
      });
      mockCountryService.getPaymentMethods.and.returnValue(mockPaymentMethodsBR);

      fixture.detectChanges();

      expect(component.availablePaymentMethods().length).toBe(3);
      expect(component.availablePaymentMethods()[0].id).toBe('pix');
    });

    it('should format currency correctly for Portugal', () => {
      fixture.detectChanges();

      const formatted = component.formatCurrency(50, 'EUR');
      expect(formatted).toContain('50');
      expect(formatted).toContain('€');
    });

    it('should format currency correctly for Brazil', () => {
      fixture.detectChanges();

      const formatted = component.formatCurrency(100, 'BRL');
      expect(formatted).toContain('100');
      expect(formatted).toContain('R$');
    });

    it('should return empty string for invalid currency format', () => {
      fixture.detectChanges();

      const formatted = component.formatCurrency(null as any, 'EUR');
      expect(formatted).toBe('');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

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

    it('should submit valid donation with card payment', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_123',
          clientSecret: 'secret_123'
        }
      };

      mockDonationsService.createDonation.and.returnValue(of(mockResponse));

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(mockDonationsService.createDonation).toHaveBeenCalled();
      expect(component.currentStep()).toBe('payment');
      expect(component.paymentResponse()).toEqual(mockResponse);
      expect(mockToastService.success).toHaveBeenCalledWith('Pagamento iniciado');
    });

    it('should track donation start analytics event', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      };

      mockDonationsService.createDonation.and.returnValue(of(mockResponse));

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
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

    it('should handle error on donation submission', () => {
      const errorResponse = {
        error: {
          message: 'Payment processing failed'
        }
      };

      mockDonationsService.createDonation.and.returnValue(
        throwError(() => errorResponse)
      );

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
      expect(mockToastService.error).toHaveBeenCalledWith('Payment processing failed');
    });

    it('should handle error with default message when error.error.message is not available', () => {
      mockDonationsService.createDonation.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Erro ao processar doação. Tente novamente.'
      );
    });

    it('should set loading state during submission', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      };

      mockDonationsService.createDonation.and.returnValue(of(mockResponse));

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      expect(component.isLoading()).toBe(false);
      component.onSubmit();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('PIX Payment Flow', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display PIX key when payment response contains pixKey', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 100,
          currency: 'BRL',
          country: 'BR',
          paymentMethod: 'pix',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_123',
          pixKey: 'test@pix.com',
          pixKeyType: 'email'
        }
      };

      component.paymentResponse.set(mockResponse);
      component.currentStep.set('payment');

      expect(component.paymentResponse()?.payment?.pixKey).toBe('test@pix.com');
    });

    it('should copy PIX key to clipboard', fakeAsync(() => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 100,
          currency: 'BRL',
          country: 'BR',
          paymentMethod: 'pix',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_123',
          pixKey: 'test@pix.com',
          pixKeyType: 'email'
        }
      };

      component.paymentResponse.set(mockResponse);

      // Mock clipboard API
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(
        Promise.resolve()
      );

      component.copyPixKey();
      tick();

      expect(clipboardSpy).toHaveBeenCalledWith('test@pix.com');
      expect(component.pixKeyCopied()).toBe(true);
      expect(mockToastService.success).toHaveBeenCalledWith('Chave PIX copiada!');

      tick(3000);
      expect(component.pixKeyCopied()).toBe(false);
    }));

    it('should use fallback copy method when clipboard API fails', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 100,
          currency: 'BRL',
          country: 'BR',
          paymentMethod: 'pix',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_123',
          pixKey: 'test@pix.com',
          pixKeyType: 'email'
        }
      };

      component.paymentResponse.set(mockResponse);

      // Mock clipboard API to fail
      spyOn(navigator.clipboard, 'writeText').and.returnValue(
        Promise.reject(new Error('Clipboard not available'))
      );

      // Mock document.execCommand
      const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(true);
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();

      component.copyPixKey();

      // Wait for promise to reject and fallback to execute
      setTimeout(() => {
        expect(createElementSpy).toHaveBeenCalledWith('textarea');
      }, 100);
    });

    it('should not copy if PIX key is not available', () => {
      component.paymentResponse.set(null);

      const clipboardSpy = spyOn(navigator.clipboard, 'writeText');

      component.copyPixKey();

      expect(clipboardSpy).not.toHaveBeenCalled();
    });
  });

  describe('Payment Completion Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.donationForm.patchValue({
        ongId: 'ong-1',
        amount: 50
      });
      component.paymentResponse.set({
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'succeeded'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      });
    });

    it('should handle payment completion', fakeAsync(() => {
      component.onPaymentCompleted();

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        EventType.DONATION_COMPLETE,
        {
          ongId: 'ong-1',
          metadata: {
            amount: 50,
            currency: 'EUR',
            paymentMethod: 'card',
            donationId: 'donation-123'
          }
        }
      );

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Pagamento confirmado! Obrigado pela sua doação.'
      );

      tick(3000);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should handle payment failure', () => {
      component.onPaymentFailed();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Pagamento falhou. Por favor, tente novamente.'
      );
      expect(component.currentStep()).toBe('form');
      expect(component.paymentResponse()).toBeNull();
    });

    it('should handle payment expiration', () => {
      component.onPaymentExpired();

      expect(mockToastService.warning).toHaveBeenCalledWith(
        'Pagamento expirou. Por favor, tente novamente.'
      );
      expect(component.currentStep()).toBe('form');
      expect(component.paymentResponse()).toBeNull();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should go back to form from payment step', () => {
      component.currentStep.set('payment');
      component.paymentResponse.set({
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      });

      component.goBack();

      expect(component.currentStep()).toBe('form');
      expect(component.paymentResponse()).toBeNull();
    });
  });

  describe('ONG Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return selected ONG when ongId is set', () => {
      component.donationForm.get('ongId')?.setValue('ong-1');

      const selectedOng = component.getSelectedOng();

      expect(selectedOng).toBeTruthy();
      expect(selectedOng?.id).toBe('ong-1');
      expect(selectedOng?.ongName).toBe('Animal Rescue PT');
    });

    it('should return null when no ONG is selected', () => {
      component.donationForm.get('ongId')?.setValue('');

      const selectedOng = component.getSelectedOng();

      expect(selectedOng).toBeNull();
    });

    it('should return null when invalid ongId is set', () => {
      component.donationForm.get('ongId')?.setValue('invalid-id');

      const selectedOng = component.getSelectedOng();

      expect(selectedOng).toBeNull();
    });
  });

  describe('Form Reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and payment response', () => {
      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        paymentMethod: 'card'
      });

      component.paymentResponse.set({
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'succeeded'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      });

      component.currentStep.set('payment');

      component.resetForm();

      expect(component.paymentResponse()).toBeNull();
      expect(component.currentStep()).toBe('form');
      expect(component.donationForm.get('ongId')?.value).toBeFalsy();
      expect(component.donationForm.get('donorName')?.value).toBeFalsy();
      expect(component.donationForm.get('country')?.value).toBe('PT');
      expect(component.donationForm.get('currency')?.value).toBe('EUR');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show loading state during donation submission', () => {
      const mockResponse: DonationResponse = {
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'card',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_123'
        }
      };

      mockDonationsService.createDonation.and.returnValue(of(mockResponse));

      component.donationForm.patchValue({
        ongId: 'ong-1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      });

      expect(component.isLoading()).toBe(false);

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have form labels for all inputs', () => {
      const compiled = fixture.nativeElement;
      const labels = compiled.querySelectorAll('label.form-label');

      expect(labels.length).toBeGreaterThan(0);
    });

    it('should show error hints when fields are invalid and touched', () => {
      const donorNameControl = component.donationForm.get('donorName');
      donorNameControl?.setValue('');
      donorNameControl?.markAsTouched();

      fixture.detectChanges();

      expect(donorNameControl?.invalid).toBe(true);
      expect(donorNameControl?.touched).toBe(true);
    });

    it('should disable submit button when form is invalid', () => {
      component.donationForm.patchValue({
        ongId: '',
        donorName: '',
        donorEmail: ''
      });

      fixture.detectChanges();

      expect(component.donationForm.invalid).toBe(true);
    });

    it('should disable submit button when loading', () => {
      component.isLoading.set(true);

      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render form section when currentStep is form', () => {
      component.currentStep.set('form');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const formSection = compiled.querySelector('.form-section');

      expect(formSection).toBeTruthy();
    });

    it('should render payment section when currentStep is payment', () => {
      component.currentStep.set('payment');
      component.paymentResponse.set({
        message: 'Success',
        donation: {
          id: 'donation-123',
          amount: 50,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'multibanco',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_123',
          entity: '12345',
          reference: '123 456 789'
        }
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const paymentSection = compiled.querySelector('.payment-section');

      expect(paymentSection).toBeTruthy();
    });

    it('should render ONG options when ongs are loaded', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const select = compiled.querySelector('select[formControlName="ongId"]');

      expect(select).toBeTruthy();
    });

    it('should render payment method options based on country', () => {
      fixture.detectChanges();

      expect(component.availablePaymentMethods().length).toBe(3);
    });
  });
});

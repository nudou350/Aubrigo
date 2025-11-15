import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DonationsService, DonationRequest, DonationResponse, PaymentStatusResponse, Ong, OngFilters, DonationFilters } from './donations.service';
import { environment } from '../../../environments/environment';
import { PaymentStatus } from '../types';

describe('DonationsService', () => {
  let service: DonationsService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/donations`;
  const usersUrl = `${environment.apiUrl}/users`;

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
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllOngs', () => {
    it('should fetch all ONGs without filters', () => {
      const mockOngs: Ong[] = [
        {
          id: '1',
          ongName: 'Test ONG 1',
          profileImageUrl: 'https://example.com/image1.jpg',
          location: 'Porto',
          phone: '+351912345678',
          pixKey: 'test@pix.com',
          countryCode: 'PT'
        },
        {
          id: '2',
          ongName: 'Test ONG 2',
          location: 'Lisbon',
          countryCode: 'PT'
        }
      ];

      service.getAllOngs().subscribe({
        next: (ongs) => {
          expect(ongs).toEqual(mockOngs);
          expect(ongs.length).toBe(2);
        }
      });

      const req = httpMock.expectOne(usersUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockOngs);
    });

    it('should fetch ONGs with search filter', () => {
      const mockOngs: Ong[] = [
        {
          id: '1',
          ongName: 'Animal Shelter',
          location: 'Porto',
          countryCode: 'PT'
        }
      ];

      const filters: OngFilters = {
        search: 'Animal'
      };

      service.getAllOngs(filters).subscribe({
        next: (ongs) => {
          expect(ongs).toEqual(mockOngs);
          expect(ongs.length).toBe(1);
        }
      });

      const req = httpMock.expectOne(`${usersUrl}?search=Animal`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('Animal');
      req.flush(mockOngs);
    });

    it('should fetch ONGs with location filter', () => {
      const mockOngs: Ong[] = [
        {
          id: '1',
          ongName: 'Porto Shelter',
          location: 'Porto',
          countryCode: 'PT'
        }
      ];

      const filters: OngFilters = {
        location: 'Porto'
      };

      service.getAllOngs(filters).subscribe({
        next: (ongs) => {
          expect(ongs).toEqual(mockOngs);
        }
      });

      const req = httpMock.expectOne(`${usersUrl}?location=Porto`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('location')).toBe('Porto');
      req.flush(mockOngs);
    });

    it('should fetch ONGs with countryCode filter', () => {
      const mockOngs: Ong[] = [
        {
          id: '1',
          ongName: 'Portugal Shelter',
          location: 'Lisbon',
          countryCode: 'PT'
        }
      ];

      const filters: OngFilters = {
        countryCode: 'PT'
      };

      service.getAllOngs(filters).subscribe({
        next: (ongs) => {
          expect(ongs).toEqual(mockOngs);
        }
      });

      const req = httpMock.expectOne(`${usersUrl}?countryCode=PT`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('countryCode')).toBe('PT');
      req.flush(mockOngs);
    });

    it('should fetch ONGs with multiple filters', () => {
      const mockOngs: Ong[] = [
        {
          id: '1',
          ongName: 'Porto Animal Rescue',
          location: 'Porto',
          countryCode: 'PT'
        }
      ];

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
      expect(req.request.params.get('location')).toBe('Porto');
      expect(req.request.params.get('countryCode')).toBe('PT');
      req.flush(mockOngs);
    });

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
  });

  describe('createDonation', () => {
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

      const mockResponse: DonationResponse = {
        message: 'Donation created successfully',
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
          clientSecret: 'pi_123_secret_abc'
        }
      };

      service.createDonation(donationRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.donation.id).toBe('donation-123');
          expect(response.payment.clientSecret).toBe('pi_123_secret_abc');
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(donationRequest);
      req.flush(mockResponse);
    });

    it('should create a donation with MB WAY payment method', () => {
      const donationRequest: DonationRequest = {
        ongId: '123',
        donorName: 'Maria Silva',
        donorEmail: 'maria@example.com',
        amount: 25,
        donationType: 'monthly',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'mbway',
        phoneNumber: '+351912345678'
      };

      const mockResponse: DonationResponse = {
        message: 'Donation created successfully',
        donation: {
          id: 'donation-456',
          amount: 25,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'mbway',
          paymentStatus: 'processing'
        },
        payment: {
          paymentIntentId: 'pi_456',
          requiresAction: true
        }
      };

      service.createDonation(donationRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.donation.paymentMethod).toBe('mbway');
          expect(response.payment.requiresAction).toBe(true);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(donationRequest);
      req.flush(mockResponse);
    });

    it('should create a donation with PIX payment method', () => {
      const donationRequest: DonationRequest = {
        ongId: '789',
        donorName: 'José Santos',
        donorEmail: 'jose@example.com',
        donorCpf: '12345678900',
        amount: 100,
        donationType: 'one_time',
        country: 'BR',
        currency: 'BRL',
        paymentMethod: 'pix'
      };

      const mockResponse: DonationResponse = {
        message: 'Donation created successfully',
        donation: {
          id: 'donation-789',
          amount: 100,
          currency: 'BRL',
          country: 'BR',
          paymentMethod: 'pix',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_789',
          pixKey: 'ong@pix.com',
          pixKeyType: 'email',
          pixQrCode: 'data:image/png;base64,iVBOR...',
          pixPaymentString: '00020126330014BR.GOV...'
        }
      };

      service.createDonation(donationRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.donation.paymentMethod).toBe('pix');
          expect(response.payment.pixKey).toBe('ong@pix.com');
          expect(response.payment.pixQrCode).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(donationRequest);
      req.flush(mockResponse);
    });

    it('should create a donation with Multibanco payment method', () => {
      const donationRequest: DonationRequest = {
        ongId: '321',
        donorName: 'Ana Costa',
        donorEmail: 'ana@example.com',
        amount: 75,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'multibanco'
      };

      const mockResponse: DonationResponse = {
        message: 'Donation created successfully',
        donation: {
          id: 'donation-321',
          amount: 75,
          currency: 'EUR',
          country: 'PT',
          paymentMethod: 'multibanco',
          paymentStatus: 'pending'
        },
        payment: {
          paymentIntentId: 'pi_321',
          entity: '12345',
          reference: '123 456 789',
          expiresAt: '2025-11-15T23:59:59Z'
        }
      };

      service.createDonation(donationRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.payment.entity).toBe('12345');
          expect(response.payment.reference).toBe('123 456 789');
        }
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(donationRequest);
      req.flush(mockResponse);
    });

    it('should handle validation error when creating donation', () => {
      const invalidRequest: DonationRequest = {
        ongId: '',
        donorName: '',
        donorEmail: 'invalid-email',
        amount: -10,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      };

      const errorResponse = {
        message: 'Validation failed',
        errors: ['ONG ID is required', 'Donor name is required', 'Invalid email', 'Amount must be positive']
      };

      service.createDonation(invalidRequest).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Validation failed');
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle server error when creating donation', () => {
      const donationRequest: DonationRequest = {
        ongId: '123',
        donorName: 'Test User',
        donorEmail: 'test@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      };

      service.createDonation(donationRequest).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('checkPaymentStatus', () => {
    it('should check payment status for a donation', () => {
      const donationId = 'donation-123';
      const mockResponse: PaymentStatusResponse = {
        donationId: 'donation-123',
        paymentStatus: 'succeeded',
        paymentMethod: 'card',
        amount: 50,
        currency: 'EUR'
      };

      service.checkPaymentStatus(donationId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.paymentStatus).toBe('succeeded');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${donationId}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should check payment status for pending payment', () => {
      const donationId = 'donation-456';
      const mockResponse: PaymentStatusResponse = {
        donationId: 'donation-456',
        paymentStatus: 'pending',
        paymentMethod: 'multibanco',
        amount: 75,
        currency: 'EUR'
      };

      service.checkPaymentStatus(donationId).subscribe({
        next: (response) => {
          expect(response.paymentStatus).toBe('pending');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${donationId}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should check payment status for failed payment', () => {
      const donationId = 'donation-789';
      const mockResponse: PaymentStatusResponse = {
        donationId: 'donation-789',
        paymentStatus: 'failed',
        paymentMethod: 'card',
        amount: 100,
        currency: 'EUR'
      };

      service.checkPaymentStatus(donationId).subscribe({
        next: (response) => {
          expect(response.paymentStatus).toBe('failed');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${donationId}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when checking payment status', () => {
      const donationId = 'donation-999';

      service.checkPaymentStatus(donationId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${donationId}/status`);
      req.flush('Donation not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDonationsByOng', () => {
    it('should fetch donations for an ONG without date filters', () => {
      const filters: DonationFilters = {
        ongId: 'ong-123'
      };

      const mockDonations: DonationResponse[] = [
        {
          message: 'Donation found',
          donation: {
            id: 'donation-1',
            amount: 50,
            currency: 'EUR',
            country: 'PT',
            paymentMethod: 'card',
            paymentStatus: 'succeeded'
          },
          payment: {
            paymentIntentId: 'pi_1'
          }
        },
        {
          message: 'Donation found',
          donation: {
            id: 'donation-2',
            amount: 100,
            currency: 'EUR',
            country: 'PT',
            paymentMethod: 'mbway',
            paymentStatus: 'succeeded'
          },
          payment: {
            paymentIntentId: 'pi_2'
          }
        }
      ];

      service.getDonationsByOng(filters).subscribe({
        next: (donations) => {
          expect(donations).toEqual(mockDonations);
          expect(donations.length).toBe(2);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/ong/${filters.ongId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockDonations);
    });

    it('should fetch donations with startDate filter', () => {
      const filters: DonationFilters = {
        ongId: 'ong-123',
        startDate: '2025-01-01'
      };

      const mockDonations: DonationResponse[] = [
        {
          message: 'Donation found',
          donation: {
            id: 'donation-1',
            amount: 50,
            currency: 'EUR',
            country: 'PT',
            paymentMethod: 'card',
            paymentStatus: 'succeeded'
          },
          payment: {
            paymentIntentId: 'pi_1'
          }
        }
      ];

      service.getDonationsByOng(filters).subscribe({
        next: (donations) => {
          expect(donations).toEqual(mockDonations);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/ong/${filters.ongId}?startDate=2025-01-01`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('startDate')).toBe('2025-01-01');
      req.flush(mockDonations);
    });

    it('should fetch donations with endDate filter', () => {
      const filters: DonationFilters = {
        ongId: 'ong-123',
        endDate: '2025-12-31'
      };

      const mockDonations: DonationResponse[] = [];

      service.getDonationsByOng(filters).subscribe({
        next: (donations) => {
          expect(donations).toEqual(mockDonations);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/ong/${filters.ongId}?endDate=2025-12-31`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('endDate')).toBe('2025-12-31');
      req.flush(mockDonations);
    });

    it('should fetch donations with paymentStatus filter', () => {
      const filters: DonationFilters = {
        ongId: 'ong-123',
        paymentStatus: 'succeeded' as PaymentStatus
      };

      const mockDonations: DonationResponse[] = [
        {
          message: 'Donation found',
          donation: {
            id: 'donation-1',
            amount: 50,
            currency: 'EUR',
            country: 'PT',
            paymentMethod: 'card',
            paymentStatus: 'succeeded'
          },
          payment: {
            paymentIntentId: 'pi_1'
          }
        }
      ];

      service.getDonationsByOng(filters).subscribe({
        next: (donations) => {
          expect(donations).toEqual(mockDonations);
          expect(donations[0].donation.paymentStatus).toBe('succeeded');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/ong/${filters.ongId}?paymentStatus=succeeded`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('paymentStatus')).toBe('succeeded');
      req.flush(mockDonations);
    });

    it('should fetch donations with all filters', () => {
      const filters: DonationFilters = {
        ongId: 'ong-123',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        paymentStatus: 'succeeded' as PaymentStatus
      };

      const mockDonations: DonationResponse[] = [
        {
          message: 'Donation found',
          donation: {
            id: 'donation-1',
            amount: 50,
            currency: 'EUR',
            country: 'PT',
            paymentMethod: 'card',
            paymentStatus: 'succeeded'
          },
          payment: {
            paymentIntentId: 'pi_1'
          }
        }
      ];

      service.getDonationsByOng(filters).subscribe({
        next: (donations) => {
          expect(donations).toEqual(mockDonations);
        }
      });

      const req = httpMock.expectOne(
        `${apiUrl}/ong/${filters.ongId}?startDate=2025-01-01&endDate=2025-12-31&paymentStatus=succeeded`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('startDate')).toBe('2025-01-01');
      expect(req.request.params.get('endDate')).toBe('2025-12-31');
      expect(req.request.params.get('paymentStatus')).toBe('succeeded');
      req.flush(mockDonations);
    });

    it('should handle error when fetching donations', () => {
      const filters: DonationFilters = {
        ongId: 'invalid-ong'
      };

      service.getDonationsByOng(filters).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/ong/${filters.ongId}`);
      req.flush('ONG not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('HTTP request construction', () => {
    it('should set correct Content-Type header for POST request', () => {
      const donationRequest: DonationRequest = {
        ongId: '123',
        donorName: 'Test User',
        donorEmail: 'test@example.com',
        amount: 50,
        donationType: 'one_time',
        country: 'PT',
        currency: 'EUR',
        paymentMethod: 'card'
      };

      service.createDonation(donationRequest).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.headers.has('Content-Type')).toBe(false); // Angular sets this automatically
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should construct correct URL with query parameters', () => {
      const filters: OngFilters = {
        search: 'test',
        location: 'Porto',
        countryCode: 'PT'
      };

      service.getAllOngs(filters).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url === usersUrl &&
               request.params.get('search') === 'test' &&
               request.params.get('location') === 'Porto' &&
               request.params.get('countryCode') === 'PT';
      });
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});

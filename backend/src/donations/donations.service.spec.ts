import { Test, TestingModule } from "@nestjs/testing";
import { DonationsService } from "./donations.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Donation } from "./entities/donation.entity";
import { Ong } from "../ongs/entities/ong.entity";
import { PaymentGatewayFactory } from "./gateways/payment-gateway.factory";
import { StripeGateway } from "./gateways/stripe.gateway";
import { BrazilianGateway } from "./gateways/brazilian.gateway";
import { ManualPixGateway } from "./gateways/manual-pix.gateway";
import { StripeConnectService } from "../stripe-connect/stripe-connect.service";
import { NotFoundException } from "@nestjs/common";
describe("DonationsService", () => {
  let service: DonationsService;
  const mockDonationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const mockOngRepository = {
    findOne: jest.fn(),
  };
  const mockPaymentGatewayFactory = {
    registerGateway: jest.fn(),
    selectGateway: jest.fn(),
    getSupportedMethodsForCountry: jest.fn().mockReturnValue(["card", "pix"]),
  };
  const mockStripeGateway = {
    getName: jest.fn().mockReturnValue("stripe"),
    getCountry: jest.fn().mockReturnValue("PT"),
    getSupportedMethods: jest.fn().mockReturnValue(["card"]),
    createPayment: jest.fn(),
  };
  const mockBrazilianGateway = {
    getName: jest.fn().mockReturnValue("brazilian"),
    getCountry: jest.fn().mockReturnValue("BR"),
    getSupportedMethods: jest.fn().mockReturnValue(["pix"]),
    createPayment: jest.fn(),
  };
  const mockManualPixGateway = {
    getName: jest.fn().mockReturnValue("manual-pix"),
    getCountry: jest.fn().mockReturnValue("PT"),
    getSupportedMethods: jest.fn().mockReturnValue(["pix"]),
    createPayment: jest.fn(),
  };
  const mockStripeConnectService = {
    createConnectedAccount: jest.fn(),
    retrieveAccount: jest.fn(),
    createConnectedPayment: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        {
          provide: getRepositoryToken(Donation),
          useValue: mockDonationRepository,
        },
        {
          provide: getRepositoryToken(Ong),
          useValue: mockOngRepository,
        },
        { provide: PaymentGatewayFactory, useValue: mockPaymentGatewayFactory },
        { provide: StripeGateway, useValue: mockStripeGateway },
        { provide: BrazilianGateway, useValue: mockBrazilianGateway },
        { provide: ManualPixGateway, useValue: mockManualPixGateway },
        { provide: StripeConnectService, useValue: mockStripeConnectService },
      ],
    }).compile();
    service = module.get<DonationsService>(DonationsService);
    jest.clearAllMocks();
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createDonation", () => {
    it("should create Stripe Connect donation for Portugal with card", async () => {
      const createdDonation = {
        id: "don-1",
        amount: 50,
        paymentStatus: "pending",
        paymentMethod: "card",
        ongId: "ong-1",
      };

      mockOngRepository.findOne.mockResolvedValue({
        id: "ong-1",
        ongName: "Test ONG",
        stripeAccountId: "acct_123",
        stripeChargesEnabled: true,
      });

      mockDonationRepository.create.mockReturnValue(createdDonation);
      mockDonationRepository.save.mockResolvedValue(createdDonation);

      mockStripeConnectService.createConnectedPayment.mockResolvedValue({
        id: "pi_123",
        client_secret: "pi_123_secret_456",
        amount: 5000,
        currency: "eur",
      });

      const result = await service.createDonation({
        ongId: "ong-1",
        donorName: "John Doe",
        donorEmail: "john@test.com",
        amount: 50,
        donationType: "one_time",
        paymentMethod: "card",
        country: "PT",
        currency: "EUR",
      });

      expect(result).toBeDefined();
      expect(
        mockStripeConnectService.createConnectedPayment,
      ).toHaveBeenCalled();
    });

    it("should create Manual PIX donation for Portugal", async () => {
      const createdDonation = {
        id: "don-1",
        amount: 50,
        paymentStatus: "pending",
        paymentMethod: "pix",
        ongId: "ong-1",
      };

      mockOngRepository.findOne.mockResolvedValue({
        id: "ong-1",
        ongName: "Test ONG",
        pixKey: "test@example.com",
      });

      mockDonationRepository.create.mockReturnValue(createdDonation);
      mockDonationRepository.save.mockResolvedValue(createdDonation);

      mockPaymentGatewayFactory.selectGateway.mockReturnValue(
        mockManualPixGateway,
      );
      mockManualPixGateway.createPayment.mockResolvedValue({
        pixKey: "test@example.com",
        pixQRCode: "00020126580014br.gov.bcb.pix...",
        amount: 50,
      });

      const result = await service.createDonation({
        ongId: "ong-1",
        donorName: "John Doe",
        donorEmail: "john@test.com",
        amount: 50,
        donationType: "one_time",
        paymentMethod: "pix",
        country: "PT",
        currency: "EUR",
      });

      expect(result).toBeDefined();
      expect(mockManualPixGateway.createPayment).toHaveBeenCalled();
    });
  });

  describe("getDonationsByOng", () => {
    it("should return ONG donations with statistics", async () => {
      mockDonationRepository.find.mockResolvedValue([
        {
          id: "1",
          amount: 50,
          donationType: "one_time",
          paymentStatus: "completed",
        },
        {
          id: "2",
          amount: 100,
          donationType: "monthly",
          paymentStatus: "completed",
        },
      ]);
      const result = await service.getDonationsByOng("ong-1");
      expect(result.donations).toHaveLength(2);
      expect(result.statistics.totalDonations).toBe(2);
    });
  });
});

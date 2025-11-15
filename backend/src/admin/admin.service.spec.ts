import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, OngStatus } from "../users/entities/user.entity";
import { Pet } from "../pets/entities/pet.entity";
import { PetImage } from "../pets/entities/pet-image.entity";
import { Donation } from "../donations/entities/donation.entity";
import { EmailService } from "../email/email.service";
import { UploadService } from "../upload/upload.service";
describe("AdminService", () => {
  let service: AdminService;
  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const mockPetRepository = {
    count: jest.fn(),
  };
  const mockPetImageRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockDonationRepository = {
    find: jest.fn(),
  };
  const mockEmailService = {
    sendOngApprovalEmail: jest.fn(),
    sendOngRejectionEmail: jest.fn(),
  };
  const mockUploadService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        {
          provide: getRepositoryToken(PetImage),
          useValue: mockPetImageRepository,
        },
        {
          provide: getRepositoryToken(Donation),
          useValue: mockDonationRepository,
        },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });
  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  describe("getAllUsers", () => {
    it("should return all users", async () => {
      mockUserRepository.find.mockResolvedValue([{ id: "1" }, { id: "2" }]);
      const result = await service.getAllUsers();
      expect(result).toHaveLength(2);
    });
  });
  describe("approveOng", () => {
    it("should approve ONG", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: "ong-1",
        ongStatus: OngStatus.PENDING,
        ongName: "Test ONG",
        email: "ong@test.com",
      });
      mockUserRepository.save.mockResolvedValue({
        id: "ong-1",
        ongStatus: OngStatus.APPROVED,
        ongName: "Test ONG",
        email: "ong@test.com",
      });
      mockEmailService.sendOngApprovalEmail.mockResolvedValue(true);
      const result = await service.approveOng("ong-1");
      expect(result.ong.status).toBe(OngStatus.APPROVED);
    });
  });
  describe("getDashboardStats", () => {
    it("should return dashboard statistics", async () => {
      mockUserRepository.count
        .mockResolvedValueOnce(10) // totalUsers
        .mockResolvedValueOnce(5) // totalOngs
        .mockResolvedValueOnce(2); // pendingOngs
      mockPetRepository.count
        .mockResolvedValueOnce(50) // totalPets
        .mockResolvedValueOnce(30); // availablePets
      mockDonationRepository.find.mockResolvedValue([
        { amount: 100 },
        { amount: 200 },
      ]);
      const result = await service.getDashboardStats();
      expect(result.totalUsers).toBe(10);
      expect(result.totalOngs).toBe(5);
      expect(result.pendingOngs).toBe(2);
      expect(result.totalPets).toBe(50);
      expect(result.totalDonations).toBe(300);
    });
  });
});

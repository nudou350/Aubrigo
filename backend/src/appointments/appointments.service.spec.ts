import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockAppointmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPetRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEmailService = {
    sendAppointmentConfirmation: jest.fn(),
    sendAppointmentStatusUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create appointment successfully', async () => {
      mockPetRepository.findOne.mockResolvedValue({ id: 'pet-1', ongId: 'ong-1' });
      mockAppointmentRepository.create.mockReturnValue({});
      mockAppointmentRepository.save.mockResolvedValue({ id: 'apt-1' });
      mockEmailService.sendAppointmentConfirmation.mockResolvedValue(true);

      const result = await service.create({
        petId: 'pet-1',
        visitorName: 'John Doe',
        visitorEmail: 'john@test.com',
        preferredDate: new Date(),
        preferredTime: '10:00',
      });

      expect(result).toBeDefined();
      expect(mockEmailService.sendAppointmentConfirmation).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPetRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          petId: 'invalid',
          visitorName: 'John',
          visitorEmail: 'john@test.com',
          preferredDate: new Date(),
          preferredTime: '10:00',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'apt-1',
        status: AppointmentStatus.PENDING,
      });
      mockAppointmentRepository.save.mockResolvedValue({
        id: 'apt-1',
        status: AppointmentStatus.CONFIRMED,
      });

      const result = await service.updateStatus('apt-1', AppointmentStatus.CONFIRMED, 'ong-1');

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { AvailableSlotsService } from '../ongs/services/available-slots.service';
import { AppointmentSettingsService } from '../ongs/services/appointment-settings.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const mockAppointmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockPetRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEmailService = {
    sendAppointmentConfirmationToVisitor: jest.fn(),
    sendAppointmentNotificationToOng: jest.fn(),
    sendAppointmentAutoConfirmedToVisitor: jest.fn(),
    sendAppointmentAutoConfirmedToOng: jest.fn(),
    sendAppointmentCancellationToVisitor: jest.fn(),
    sendAppointmentCancellationToOng: jest.fn(),
  };

  const mockAvailableSlotsService = {
    getAvailableSlots: jest.fn(),
  };

  const mockAppointmentSettingsService = {
    findByOng: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(Pet), useValue: mockPetRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AvailableSlotsService, useValue: mockAvailableSlotsService },
        { provide: AppointmentSettingsService, useValue: mockAppointmentSettingsService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create appointment successfully (legacy system)', async () => {
      mockPetRepository.findOne.mockResolvedValue({
        id: 'pet-1',
        ongId: 'ong-1',
        status: 'available',
        ong: { id: 'ong-1', email: 'ong@test.com', ongName: 'Shelter' },
      });
      mockAppointmentRepository.create.mockReturnValue({});
      mockAppointmentRepository.save.mockResolvedValue({ id: 'apt-1' });
      mockEmailService.sendAppointmentConfirmationToVisitor.mockResolvedValue(true);
      mockEmailService.sendAppointmentNotificationToOng.mockResolvedValue(true);

      const result = await service.create({
        petId: 'pet-1',
        visitorName: 'John Doe',
        visitorEmail: 'john@test.com',
        preferredDate: '2024-12-25',
        preferredTime: '10:00',
      });

      expect(result).toBeDefined();
      expect(mockEmailService.sendAppointmentConfirmationToVisitor).toHaveBeenCalled();
      expect(mockEmailService.sendAppointmentNotificationToOng).toHaveBeenCalled();
    });

    it('should create appointment with scheduled time (new system)', async () => {
      mockPetRepository.findOne.mockResolvedValue({
        id: 'pet-1',
        ongId: 'ong-1',
        status: 'available',
        ong: { id: 'ong-1', email: 'ong@test.com', ongName: 'Shelter' },
      });
      mockAppointmentSettingsService.findByOng.mockResolvedValue({
        visitDurationMinutes: 30,
        maxConcurrentVisits: 2,
      });
      mockAvailableSlotsService.getAvailableSlots.mockResolvedValue({
        slots: [
          {
            startTime: new Date('2024-12-25T10:00:00Z'),
            available: true,
          },
        ],
      });
      mockAppointmentRepository.count.mockResolvedValue(0);
      mockAppointmentRepository.create.mockReturnValue({});
      mockAppointmentRepository.save.mockResolvedValue({ id: 'apt-1', status: 'confirmed' });
      mockEmailService.sendAppointmentAutoConfirmedToVisitor.mockResolvedValue(true);
      mockEmailService.sendAppointmentAutoConfirmedToOng.mockResolvedValue(true);

      const result = await service.create({
        petId: 'pet-1',
        visitorName: 'John Doe',
        visitorEmail: 'john@test.com',
        scheduledStartTime: '2024-12-25T10:00:00Z',
      });

      expect(result).toBeDefined();
      expect(mockEmailService.sendAppointmentAutoConfirmedToVisitor).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPetRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          petId: 'invalid',
          visitorName: 'John',
          visitorEmail: 'john@test.com',
          preferredDate: '2024-12-25',
          preferredTime: '10:00',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if pet not available', async () => {
      mockPetRepository.findOne.mockResolvedValue({
        id: 'pet-1',
        status: 'adopted',
        ong: { id: 'ong-1' },
      });

      await expect(
        service.create({
          petId: 'pet-1',
          visitorName: 'John',
          visitorEmail: 'john@test.com',
          preferredDate: '2024-12-25',
          preferredTime: '10:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'apt-1',
        status: 'pending',
        ong: { id: 'ong-1' },
      });
      mockAppointmentRepository.save.mockResolvedValue({
        id: 'apt-1',
        status: 'confirmed',
      });

      const result = await service.updateStatus('apt-1', { status: 'confirmed' }, 'ong-1');

      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid', { status: 'confirmed' }, 'ong-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not ONG owner', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'apt-1',
        ong: { id: 'ong-1' },
      });

      await expect(
        service.updateStatus('apt-1', { status: 'confirmed' }, 'different-ong'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel appointment', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue({
        id: 'apt-1',
        status: 'confirmed',
        visitorEmail: 'john@test.com',
        visitorName: 'John Doe',
        scheduledStartTime: new Date('2024-12-25T10:00:00Z'),
        ong: { id: 'ong-1', email: 'ong@test.com', ongName: 'Shelter' },
        pet: { name: 'Max' },
      });
      mockAppointmentRepository.save.mockResolvedValue({
        id: 'apt-1',
        status: 'cancelled',
      });
      mockEmailService.sendAppointmentCancellationToVisitor.mockResolvedValue(true);
      mockEmailService.sendAppointmentCancellationToOng.mockResolvedValue(true);

      const result = await service.cancel('apt-1', 'Visitor requested');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('findAllForOng', () => {
    it('should return all appointments for ONG', async () => {
      mockAppointmentRepository.find.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      const result = await service.findAllForOng('ong-1');

      expect(result).toHaveLength(2);
    });
  });
});

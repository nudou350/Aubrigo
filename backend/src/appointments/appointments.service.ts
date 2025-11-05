import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Find the pet and include ONG information
    const pet = await this.petsRepository.findOne({
      where: { id: createAppointmentDto.petId },
      relations: ['ong'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.status !== 'available') {
      throw new BadRequestException('This pet is not available for appointments');
    }

    // Create appointment
    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      pet: pet,
      ong: pet.ong,
      status: 'pending',
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAllForOng(ongId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { ong: { id: ongId } },
      relations: ['pet', 'pet.images'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['pet', 'pet.images', 'ong'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateAppointmentStatusDto,
    ongId: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['ong'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify that the appointment belongs to the ONG
    if (appointment.ong.id !== ongId) {
      throw new BadRequestException('You can only update your own appointments');
    }

    appointment.status = updateStatusDto.status;
    return this.appointmentsRepository.save(appointment);
  }

  async delete(id: string, ongId: string): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['ong'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify that the appointment belongs to the ONG
    if (appointment.ong.id !== ongId) {
      throw new BadRequestException('You can only delete your own appointments');
    }

    await this.appointmentsRepository.remove(appointment);
  }
}

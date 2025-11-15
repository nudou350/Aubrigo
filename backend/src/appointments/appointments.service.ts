import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Appointment } from "./entities/appointment.entity";
import { Pet } from "../pets/entities/pet.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { AvailableSlotsService } from "../ongs/services/available-slots.service";
import { AppointmentSettingsService } from "../ongs/services/appointment-settings.service";
import { EmailService } from "../email/email.service";
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    @Inject(forwardRef(() => AvailableSlotsService))
    private availableSlotsService: AvailableSlotsService,
    @Inject(forwardRef(() => AppointmentSettingsService))
    private settingsService: AppointmentSettingsService,
    private emailService: EmailService,
  ) {}
  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // Find the pet and include ONG information
    const pet = await this.petsRepository.findOne({
      where: { id: createAppointmentDto.petId },
      relations: ["ong"],
    });
    if (!pet) {
      throw new NotFoundException("Pet not found");
    }
    if (pet.status !== "available") {
      throw new BadRequestException(
        "This pet is not available for appointments",
      );
    }
    const ongId = pet.ong.id;
    // If scheduledStartTime is provided (new system), validate it
    if (createAppointmentDto.scheduledStartTime) {
      await this.validateSlotAvailability(
        ongId,
        new Date(createAppointmentDto.scheduledStartTime),
      );
    }
    // Get settings to calculate end time
    const settings = await this.settingsService.findByOng(ongId);
    // Create appointment with new fields
    const scheduledStartTime = createAppointmentDto.scheduledStartTime
      ? new Date(createAppointmentDto.scheduledStartTime)
      : null;
    const scheduledEndTime = scheduledStartTime
      ? new Date(
          scheduledStartTime.getTime() +
            settings.visitDurationMinutes * 60 * 1000,
        )
      : null;
    const appointment = this.appointmentsRepository.create({
      visitorName: createAppointmentDto.visitorName,
      visitorEmail: createAppointmentDto.visitorEmail,
      visitorPhone: createAppointmentDto.visitorPhone,
      preferredDate: createAppointmentDto.preferredDate,
      preferredTime: createAppointmentDto.preferredTime,
      notes: createAppointmentDto.notes,
      pet: pet,
      ong: pet.ong,
      status: scheduledStartTime ? "confirmed" : "pending", // Auto-confirm if using new system
      scheduledStartTime,
      scheduledEndTime,
      timezone: "Europe/Lisbon",
    });
    const savedAppointment =
      await this.appointmentsRepository.save(appointment);
    // Send email notifications
    if (scheduledStartTime) {
      // New system: Auto-confirmed with specific time
      await this.emailService.sendAppointmentAutoConfirmedToVisitor(
        createAppointmentDto.visitorEmail,
        createAppointmentDto.visitorName,
        pet.name,
        pet.ong.ongName || "ONG",
        pet.ong.phone || "",
        pet.ong.location || "",
        scheduledStartTime,
      );
      await this.emailService.sendAppointmentAutoConfirmedToOng(
        pet.ong.email,
        pet.ong.ongName || "ONG",
        createAppointmentDto.visitorName,
        createAppointmentDto.visitorEmail,
        createAppointmentDto.visitorPhone || "",
        pet.name,
        scheduledStartTime,
        createAppointmentDto.notes,
      );
    } else {
      // Legacy system: Pending confirmation
      const preferredDate =
        createAppointmentDto.preferredDate || new Date().toISOString();
      const preferredTime = createAppointmentDto.preferredTime || "00:00";
      await this.emailService.sendAppointmentConfirmationToVisitor(
        createAppointmentDto.visitorEmail,
        createAppointmentDto.visitorName,
        pet.name,
        pet.ong.ongName || "ONG",
        preferredDate,
        preferredTime,
      );
      await this.emailService.sendAppointmentNotificationToOng(
        pet.ong.email,
        pet.ong.ongName || "ONG",
        createAppointmentDto.visitorName,
        createAppointmentDto.visitorEmail,
        createAppointmentDto.visitorPhone || "",
        pet.name,
        preferredDate,
        preferredTime,
        createAppointmentDto.notes,
      );
    }
    return savedAppointment;
  }
  private async validateSlotAvailability(
    ongId: string,
    startTime: Date,
  ): Promise<void> {
    // Get available slots for the date
    const date = new Date(startTime);
    date.setHours(0, 0, 0, 0);
    const slotsResponse = await this.availableSlotsService.getAvailableSlots(
      ongId,
      date,
    );
    // Find the requested slot
    const requestedSlot = slotsResponse.slots.find((slot) => {
      const slotStart = new Date(slot.startTime);
      return slotStart.getTime() === startTime.getTime();
    });
    if (!requestedSlot) {
      throw new BadRequestException("The requested time slot does not exist");
    }
    if (!requestedSlot.available) {
      throw new BadRequestException(
        `The requested time slot is not available. Reason: ${requestedSlot.reason || "Unknown"}`,
      );
    }
    // Double-check for race conditions by counting concurrent appointments
    const settings = await this.settingsService.findByOng(ongId);
    const endTime = new Date(
      startTime.getTime() + settings.visitDurationMinutes * 60 * 1000,
    );
    const concurrentCount = await this.appointmentsRepository.count({
      where: {
        ongId,
        status: "confirmed",
        scheduledStartTime: Between(
          new Date(
            startTime.getTime() - settings.visitDurationMinutes * 60 * 1000,
          ),
          new Date(endTime.getTime()),
        ),
      },
    });
    if (concurrentCount >= settings.maxConcurrentVisits) {
      throw new BadRequestException(
        "This time slot was just booked. Please choose another time.",
      );
    }
  }
  async findAllForOng(ongId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { ong: { id: ongId } },
      relations: ["pet", "pet.images"],
      order: {
        createdAt: "DESC",
      },
    });
  }
  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ["pet", "pet.images", "ong"],
    });
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
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
      relations: ["ong"],
    });
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    // Verify that the appointment belongs to the ONG
    if (appointment.ong.id !== ongId) {
      throw new BadRequestException(
        "You can only update your own appointments",
      );
    }
    appointment.status = updateStatusDto.status;
    return this.appointmentsRepository.save(appointment);
  }
  async cancel(id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ["ong", "pet"],
    });
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    if (appointment.status === "cancelled") {
      throw new BadRequestException("Appointment is already cancelled");
    }
    // Update status to cancelled
    appointment.status = "cancelled";
    const cancelledAppointment =
      await this.appointmentsRepository.save(appointment);
    // Send cancellation emails
    if (appointment.scheduledStartTime) {
      await this.emailService.sendAppointmentCancellationToVisitor(
        appointment.visitorEmail,
        appointment.visitorName,
        appointment.pet.name,
        appointment.ong.ongName || "ONG",
        appointment.scheduledStartTime,
        reason,
      );
      await this.emailService.sendAppointmentCancellationToOng(
        appointment.ong.email,
        appointment.ong.ongName || "ONG",
        appointment.visitorName,
        appointment.pet.name,
        appointment.scheduledStartTime,
      );
    }
    return cancelledAppointment;
  }
  async delete(id: string, ongId: string): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ["ong"],
    });
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    // Verify that the appointment belongs to the ONG
    if (appointment.ong.id !== ongId) {
      throw new BadRequestException(
        "You can only delete your own appointments",
      );
    }
    await this.appointmentsRepository.remove(appointment);
  }
}

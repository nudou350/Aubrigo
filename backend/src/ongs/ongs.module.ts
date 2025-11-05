import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { OngOperatingHours } from './entities/ong-operating-hours.entity';
import { AppointmentSettings } from './entities/appointment-settings.entity';
import { OngAvailabilityException } from './entities/ong-availability-exception.entity';
import { OngsService } from './ongs.service';
import { OperatingHoursService } from './services/operating-hours.service';
import { AppointmentSettingsService } from './services/appointment-settings.service';
import { AvailableSlotsService } from './services/available-slots.service';
import { AvailabilityExceptionsService } from './services/availability-exceptions.service';
import { OngsController } from './ongs.controller';
import { OperatingHoursController } from './controllers/operating-hours.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Pet,
      Donation,
      Appointment,
      OngOperatingHours,
      AppointmentSettings,
      OngAvailabilityException,
    ]),
    UploadModule,
  ],
  controllers: [OngsController, OperatingHoursController],
  providers: [
    OngsService,
    OperatingHoursService,
    AppointmentSettingsService,
    AvailableSlotsService,
    AvailabilityExceptionsService,
  ],
  exports: [
    OngsService,
    OperatingHoursService,
    AppointmentSettingsService,
    AvailableSlotsService,
    AvailabilityExceptionsService,
  ],
})
export class OngsModule {}

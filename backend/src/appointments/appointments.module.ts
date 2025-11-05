import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Pet])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [TypeOrmModule, AppointmentsService],
})
export class AppointmentsModule {}

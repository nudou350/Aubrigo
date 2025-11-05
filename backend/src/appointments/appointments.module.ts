import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { OngsModule } from '../ongs/ongs.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Pet]),
    forwardRef(() => OngsModule),
    EmailModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [TypeOrmModule, AppointmentsService],
})
export class AppointmentsModule {}

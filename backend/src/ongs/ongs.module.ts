import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { OngsService } from './ongs.service';
import { OngsController } from './ongs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Pet, Donation, Appointment]),
  ],
  controllers: [OngsController],
  providers: [OngsService],
  exports: [OngsService],
})
export class OngsModule {}

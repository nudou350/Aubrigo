import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ong } from '../ongs/entities/ong.entity';
import { OngMember } from '../ongs/entities/ong-member.entity';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ong, OngMember, User, Pet, Donation]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

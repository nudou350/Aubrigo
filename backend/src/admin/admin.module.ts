import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Pet } from "../pets/entities/pet.entity";
import { PetImage } from "../pets/entities/pet-image.entity";
import { Donation } from "../donations/entities/donation.entity";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { EmailModule } from "../email/email.module";
import { UploadModule } from "../upload/upload.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Pet, PetImage, Donation]),
    EmailModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

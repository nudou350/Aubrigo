import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, OngStatus } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { PetImage } from '../pets/entities/pet-image.entity';
import { Donation } from '../donations/entities/donation.entity';
import { EmailService } from '../email/email.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(PetImage)
    private petImageRepository: Repository<PetImage>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    private emailService: EmailService,
    private uploadService: UploadService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalOngs,
      pendingOngs,
      totalPets,
      availablePets,
    ] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.USER } }),
      this.userRepository.count({ where: { role: UserRole.ONG } }),
      this.userRepository.count({ where: { role: UserRole.ONG, ongStatus: OngStatus.PENDING } }),
      this.petRepository.count(),
      this.petRepository.count({ where: { status: 'available' } }),
    ]);

    const donations = await this.donationRepository.find({
      where: { paymentStatus: 'completed' },
    });
    const totalDonationAmount = donations.reduce(
      (sum, donation) => sum + Number(donation.amount),
      0,
    );

    return {
      totalUsers,
      totalOngs,
      pendingOngs,
      totalPets,
      totalDonations: totalDonationAmount,
    };
  }

  async getPendingONGs() {
    return this.userRepository.find({
      where: { role: UserRole.ONG, ongStatus: OngStatus.PENDING },
      select: ['id', 'email', 'ongName', 'phone', 'location', 'instagramHandle', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllONGs() {
    return this.userRepository.find({
      where: { role: UserRole.ONG },
      select: ['id', 'email', 'ongName', 'phone', 'location', 'instagramHandle', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveOng(ongId: string) {
    const ong = await this.userRepository.findOne({
      where: { id: ongId, role: UserRole.ONG },
    });

    if (!ong) {
      throw new NotFoundException('ONG not found');
    }

    if (ong.ongStatus === OngStatus.APPROVED) {
      throw new BadRequestException('ONG is already approved');
    }

    // Update status to approved
    ong.ongStatus = OngStatus.APPROVED;
    await this.userRepository.save(ong);

    // Send approval email
    await this.emailService.sendOngApprovalEmail(ong.email, ong.ongName);

    return {
      message: 'ONG approved successfully',
      ong: {
        id: ong.id,
        ongName: ong.ongName,
        email: ong.email,
        status: ong.ongStatus,
      },
    };
  }

  async rejectOng(ongId: string, reason?: string) {
    const ong = await this.userRepository.findOne({
      where: { id: ongId, role: UserRole.ONG },
    });

    if (!ong) {
      throw new NotFoundException('ONG not found');
    }

    if (ong.ongStatus === OngStatus.REJECTED) {
      throw new BadRequestException('ONG is already rejected');
    }

    // Update status to rejected
    ong.ongStatus = OngStatus.REJECTED;
    await this.userRepository.save(ong);

    // Send rejection email
    await this.emailService.sendOngRejectionEmail(ong.email, ong.ongName, reason);

    return {
      message: 'ONG rejected successfully',
      ong: {
        id: ong.id,
        ongName: ong.ongName,
        email: ong.email,
        status: ong.ongStatus,
      },
    };
  }

  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'email', 'role', 'firstName', 'lastName', 'ongName', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    delete user.passwordHash;
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user is an ONG, delete all associated physical files before deletion
    if (user.role === UserRole.ONG) {
      // 1. Find all pets belonging to this ONG
      const pets = await this.petRepository.find({
        where: { ongId: userId },
      });

      // 2. Collect all pet image URLs
      const imageUrlsToDelete: string[] = [];

      for (const pet of pets) {
        const petImages = await this.petImageRepository.find({
          where: { petId: pet.id },
        });

        imageUrlsToDelete.push(...petImages.map(img => img.imageUrl));
      }

      // 3. Add ONG profile image if exists
      if (user.profileImageUrl) {
        imageUrlsToDelete.push(user.profileImageUrl);
      }

      // 4. Delete all physical files
      if (imageUrlsToDelete.length > 0) {
        await this.uploadService.deleteMultipleImages(imageUrlsToDelete);
      }
    } else {
      // For regular users, just delete profile image if exists
      if (user.profileImageUrl) {
        await this.uploadService.deleteImage(user.profileImageUrl);
      }
    }

    // 5. Delete user (CASCADE will handle database records)
    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }

  async getRecentDonations(limit: number = 50) {
    return this.donationRepository.find({
      relations: ['ong'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllPets() {
    return this.petRepository.find({
      relations: ['ong', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  async deletePet(petId: string) {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    await this.petRepository.remove(pet);

    return {
      message: 'Pet deleted successfully',
    };
  }
}

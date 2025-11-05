import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalOngs,
      totalPets,
      availablePets,
    ] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.USER } }),
      this.userRepository.count({ where: { role: UserRole.ONG } }),
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
      pendingOngs: 0, // No approval system currently
      totalPets,
      totalDonations: totalDonationAmount,
    };
  }

  async getPendingONGs() {
    // Currently no approval system, return empty array
    return [];
  }

  async getAllONGs() {
    return this.userRepository.find({
      where: { role: UserRole.ONG },
      select: ['id', 'email', 'ongName', 'phone', 'location', 'instagramHandle', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveOng(ongId: string) {
    // Currently no approval system
    throw new BadRequestException('ONG approval system not yet implemented');
  }

  async rejectOng(ongId: string, reason?: string) {
    // Currently no approval system
    throw new BadRequestException('ONG rejection system not yet implemented');
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

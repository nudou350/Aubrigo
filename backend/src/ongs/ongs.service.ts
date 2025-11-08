import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UpdateOngDto } from './dto/update-ong.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
@Injectable()
export class OngsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}
  async findAll() {
    // Get all approved ONGs (in current schema, all ONG role users are approved)
    return this.userRepository.find({
      where: { role: UserRole.ONG },
      select: ['id', 'email', 'ongName', 'phone', 'location', 'instagramHandle', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
  async findOne(id: string) {
    const ong = await this.userRepository.findOne({
      where: { id, role: UserRole.ONG },
      relations: ['pets', 'donations'],
    });
    if (!ong) {
      throw new NotFoundException(`ONG with ID ${id} not found`);
    }
    // Remove sensitive data
    delete ong.passwordHash;
    return ong;
  }
  async findByUserId(userId: string) {
    // In the current simplified schema, a user IS an ONG (no membership system)
    // So we just return the user's own ONG if they have the ONG role
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!user) {
      return [];
    }
    delete user.passwordHash;
    return [user];
  }
  async getMyOng(userId: string) {
    // Get the current user's ONG details
    const ong = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found for this user');
    }
    delete ong.passwordHash;
    return ong;
  }
  async getOngStats(ongId: string, userId: string) {
    // Verify the user is the ONG owner
    const ong = await this.userRepository.findOne({
      where: { id: ongId, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found');
    }
    // Verify user has permission (must be the same user or admin)
    if (ongId !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to view these statistics');
      }
    }
    // Get statistics
    const [
      totalPets,
      availablePets,
      adoptedPets,
      totalAppointments,
      pendingAppointments,
    ] = await Promise.all([
      this.petRepository.count({ where: { ongId } }),
      this.petRepository.count({ where: { ongId, status: 'available' } }),
      this.petRepository.count({ where: { ongId, status: 'adopted' } }),
      this.appointmentRepository.count({ where: { ongId } }),
      this.appointmentRepository.count({ where: { ongId, status: 'pending' } }),
    ]);
    const donations = await this.donationRepository.find({
      where: { ongId, paymentStatus: 'completed' },
    });
    const totalDonationAmount = donations.reduce(
      (sum, donation) => sum + Number(donation.amount),
      0,
    );
    const monthlyDonations = donations.filter((d) => {
      const donationDate = new Date(d.createdAt);
      const now = new Date();
      return (
        donationDate.getMonth() === now.getMonth() &&
        donationDate.getFullYear() === now.getFullYear()
      );
    });
    const monthlyDonationAmount = monthlyDonations.reduce(
      (sum, donation) => sum + Number(donation.amount),
      0,
    );
    return {
      totalPets,
      availablePets,
      adoptedPets,
      totalAppointments,
      pendingAppointments,
      totalDonations: totalDonationAmount,
      monthlyDonations: monthlyDonationAmount,
      donationCount: donations.length,
    };
  }
  async update(id: string, updateOngDto: UpdateOngDto, userId: string) {
    const ong = await this.userRepository.findOne({
      where: { id, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found');
    }
    // Verify user has permission (must be the same user or admin)
    if (id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to update this ONG');
      }
    }
    Object.assign(ong, updateOngDto);
    const updated = await this.userRepository.save(ong);
    delete updated.passwordHash;
    return updated;
  }
  async remove(id: string, userId: string) {
    const ong = await this.userRepository.findOne({
      where: { id, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found');
    }
    // Only the ONG owner or admin can delete
    if (id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to delete this ONG');
      }
    }
    await this.userRepository.remove(ong);
    return { message: 'ONG deleted successfully' };
  }
  // Note: Member management methods are not applicable in current simplified schema
  // In the current system, there's no separate team member system
  // Each ONG user manages their own account directly
  async getMembers(ongId: string, userId: string) {
    // In current schema, no member system exists
    // Return empty array for now
    return [];
  }
  async inviteMember(ongId: string, inviteDto: any, userId: string) {
    // Member invitation system not implemented in current schema
    throw new ForbiddenException('Member invitation system not yet implemented');
  }
  async acceptInvitation(token: string, userId: string) {
    throw new NotFoundException('Invitation system not yet implemented');
  }
  async rejectInvitation(token: string, userId: string) {
    throw new NotFoundException('Invitation system not yet implemented');
  }
  async removeMember(ongId: string, memberId: string, userId: string) {
    throw new ForbiddenException('Member management not yet implemented');
  }
  async updateMemberRole(
    ongId: string,
    memberId: string,
    role: any,
    permissions: string[],
    userId: string,
  ) {
    throw new ForbiddenException('Member role management not yet implemented');
  }
  async updateMyProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const ong = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found');
    }
    // Update only the provided fields
    Object.assign(ong, updateProfileDto);
    const updated = await this.userRepository.save(ong);
    delete updated.passwordHash;
    return updated;
  }
  async updateProfileImage(userId: string, imageUrl: string) {
    const ong = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException('ONG not found');
    }
    ong.profileImageUrl = imageUrl;
    const updated = await this.userRepository.save(ong);
    delete updated.passwordHash;
    return updated;
  }
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
    // Verify passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }
    // Get user with password
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);
    return { message: 'Password changed successfully' };
  }
}

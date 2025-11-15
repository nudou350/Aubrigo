import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User, UserRole } from "../users/entities/user.entity";
import { Pet } from "../pets/entities/pet.entity";
import { Donation } from "../donations/entities/donation.entity";
import { Appointment } from "../appointments/entities/appointment.entity";
import { UpdateOngDto } from "./dto/update-ong.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdatePaymentConfigDto } from "./dto/update-payment-config.dto";
import { PaymentConfigResponseDto } from "./dto/payment-config-response.dto";

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
      select: [
        "id",
        "email",
        "ongName",
        "phone",
        "location",
        "instagramHandle",
        "createdAt",
      ],
      order: { createdAt: "DESC" },
    });
  }
  async findOne(id: string) {
    const ong = await this.userRepository.findOne({
      where: { id, role: UserRole.ONG },
      relations: ["pets", "donations"],
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
      throw new NotFoundException("ONG not found for this user");
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
      throw new NotFoundException("ONG not found");
    }
    // Verify user has permission (must be the same user or admin)
    if (ongId !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          "You do not have permission to view these statistics",
        );
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
      this.petRepository.count({ where: { ongId, status: "available" } }),
      this.petRepository.count({ where: { ongId, status: "adopted" } }),
      this.appointmentRepository.count({ where: { ongId } }),
      this.appointmentRepository.count({ where: { ongId, status: "pending" } }),
    ]);
    const donations = await this.donationRepository.find({
      where: { ongId, paymentStatus: "completed" },
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
      throw new NotFoundException("ONG not found");
    }
    // Verify user has permission (must be the same user or admin)
    if (id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          "You do not have permission to update this ONG",
        );
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
      throw new NotFoundException("ONG not found");
    }
    // Only the ONG owner or admin can delete
    if (id !== userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          "You do not have permission to delete this ONG",
        );
      }
    }
    await this.userRepository.remove(ong);
    return { message: "ONG deleted successfully" };
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
    throw new ForbiddenException(
      "Member invitation system not yet implemented",
    );
  }
  async acceptInvitation(token: string, userId: string) {
    throw new NotFoundException("Invitation system not yet implemented");
  }
  async rejectInvitation(token: string, userId: string) {
    throw new NotFoundException("Invitation system not yet implemented");
  }
  async removeMember(ongId: string, memberId: string, userId: string) {
    throw new ForbiddenException("Member management not yet implemented");
  }
  async updateMemberRole(
    ongId: string,
    memberId: string,
    role: any,
    permissions: string[],
    userId: string,
  ) {
    throw new ForbiddenException("Member role management not yet implemented");
  }
  async updateMyProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const ong = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!ong) {
      throw new NotFoundException("ONG not found");
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
      throw new NotFoundException("ONG not found");
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
      throw new BadRequestException(
        "New password and confirm password do not match",
      );
    }
    // Get user with password
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);
    return { message: "Password changed successfully" };
  }

  /**
   * Get public payment configuration for an ONG
   * Returns available payment methods without exposing sensitive details
   */
  async getPaymentConfig(ongId: string): Promise<PaymentConfigResponseDto> {
    const ong = await this.userRepository.findOne({
      where: { id: ongId, role: UserRole.ONG },
    });

    if (!ong) {
      throw new NotFoundException("ONG not found");
    }

    const availablePaymentMethods = this.getAvailablePaymentMethods(ong);

    return {
      countryCode: ong.countryCode,
      availablePaymentMethods,
      hasPaymentMethodsConfigured: ong.paymentMethodsConfigured,
      ongName: ong.ongName || "ONG",
    };
  }

  /**
   * Update payment configuration for an ONG
   * Validates that at least one payment method is configured for the ONG's country
   */
  async updatePaymentConfig(
    userId: string,
    updatePaymentConfigDto: UpdatePaymentConfigDto,
  ) {
    const ong = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.ONG },
    });

    if (!ong) {
      throw new NotFoundException("ONG not found");
    }

    // Update payment fields
    if (updatePaymentConfigDto.phone !== undefined) {
      ong.phone = updatePaymentConfigDto.phone;
    }
    if (updatePaymentConfigDto.bankAccountIban !== undefined) {
      ong.bankAccountIban = updatePaymentConfigDto.bankAccountIban;
    }
    if (updatePaymentConfigDto.pixKey !== undefined) {
      ong.pixKey = updatePaymentConfigDto.pixKey;
    }
    if (updatePaymentConfigDto.pixKeyType !== undefined) {
      ong.pixKeyType = updatePaymentConfigDto.pixKeyType;
    }
    if (updatePaymentConfigDto.bankName !== undefined) {
      ong.bankName = updatePaymentConfigDto.bankName;
    }
    if (updatePaymentConfigDto.bankRoutingNumber !== undefined) {
      ong.bankRoutingNumber = updatePaymentConfigDto.bankRoutingNumber;
    }
    if (updatePaymentConfigDto.bankAccountNumber !== undefined) {
      ong.bankAccountNumber = updatePaymentConfigDto.bankAccountNumber;
    }

    // Validate payment configuration
    const validationResult = this.validatePaymentConfig(ong);
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.message);
    }

    // Mark payment methods as configured
    ong.paymentMethodsConfigured = true;

    const updatedOng = await this.userRepository.save(ong);

    const availablePaymentMethods = this.getAvailablePaymentMethods(updatedOng);

    return {
      message: "Payment configuration updated successfully",
      paymentMethodsConfigured: true,
      availablePaymentMethods,
    };
  }

  /**
   * Get available payment methods for an ONG based on configuration
   */
  private getAvailablePaymentMethods(ong: User): string[] {
    const methods: string[] = [];

    if (ong.countryCode === "PT") {
      // Portugal
      if (ong.phone) {
        methods.push("mbway");
      }
      if (ong.bankAccountIban) {
        methods.push("multibanco");
      }
    } else if (ong.countryCode === "BR") {
      // Brazil
      if (ong.pixKey && ong.pixKeyType) {
        methods.push("pix");
      }
      if (ong.bankName && ong.bankRoutingNumber && ong.bankAccountNumber) {
        methods.push("bank_transfer");
      }
    }

    return methods;
  }

  /**
   * Validate payment configuration for an ONG
   * Ensures at least one payment method is properly configured for the country
   */
  private validatePaymentConfig(ong: User): {
    isValid: boolean;
    message?: string;
  } {
    const availableMethods = this.getAvailablePaymentMethods(ong);

    if (availableMethods.length === 0) {
      if (ong.countryCode === "PT") {
        return {
          isValid: false,
          message:
            "At least one payment method must be configured for Portugal: MB WAY (phone) or Multibanco (IBAN)",
        };
      } else if (ong.countryCode === "BR") {
        return {
          isValid: false,
          message:
            "At least one payment method must be configured for Brazil: PIX (pixKey + pixKeyType) or Bank Transfer (bankName + bankRoutingNumber + bankAccountNumber)",
        };
      }
    }

    // Validate PIX key type if PIX key is provided
    if (ong.pixKey && !ong.pixKeyType) {
      return {
        isValid: false,
        message: "PIX key type is required when PIX key is provided",
      };
    }

    // Validate PIX key format based on type
    if (ong.pixKey && ong.pixKeyType) {
      const pixValidation = this.validatePixKey(ong.pixKey, ong.pixKeyType);
      if (!pixValidation.isValid) {
        return pixValidation;
      }
    }

    // Validate bank transfer fields for Brazil
    if (ong.countryCode === "BR") {
      if (ong.bankAccountNumber && (!ong.bankName || !ong.bankRoutingNumber)) {
        return {
          isValid: false,
          message:
            "Bank name and routing number are required for bank transfers",
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate PIX key format based on type
   */
  private validatePixKey(
    pixKey: string,
    pixKeyType: string,
  ): { isValid: boolean; message?: string } {
    switch (pixKeyType) {
      case "CPF":
        if (!/^\d{11}$/.test(pixKey)) {
          return {
            isValid: false,
            message: "CPF PIX key must be 11 digits (numbers only)",
          };
        }
        break;
      case "CNPJ":
        if (!/^\d{14}$/.test(pixKey)) {
          return {
            isValid: false,
            message: "CNPJ PIX key must be 14 digits (numbers only)",
          };
        }
        break;
      case "Email":
        if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(pixKey)) {
          return { isValid: false, message: "Invalid email format for PIX key" };
        }
        break;
      case "Phone":
        if (!/^\+?\d{10,15}$/.test(pixKey)) {
          return {
            isValid: false,
            message: "Phone PIX key must be 10-15 digits (with optional +)",
          };
        }
        break;
      case "Random":
        if (pixKey.length < 32) {
          return {
            isValid: false,
            message: "Random PIX key must be at least 32 characters",
          };
        }
        break;
      default:
        return {
          isValid: false,
          message: "Invalid PIX key type",
        };
    }

    return { isValid: true };
  }
}

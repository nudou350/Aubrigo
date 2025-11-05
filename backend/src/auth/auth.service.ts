import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, confirmPassword, ongName } = registerDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      ongName,
    });

    await this.userRepository.save(user);

    // Generate token
    const accessToken = this.generateToken(user);

    // Remove password from response
    delete user.passwordHash;

    return {
      message: 'Registration successful',
      user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.generateToken(user);

    // Remove password from response
    delete user.passwordHash;

    return {
      user,
      accessToken,
    };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, confirmPassword, firstName, lastName, phone, location } = registerUserDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      location,
      role: UserRole.USER,
    });

    await this.userRepository.save(user);

    // Generate token
    const accessToken = this.generateToken(user);

    // Remove password from response
    delete user.passwordHash;

    return {
      message: 'User registration successful',
      user,
      accessToken,
    };
  }

  async registerOng(registerOngDto: RegisterOngDto) {
    const {
      email,
      password,
      confirmPassword,
      ongName,
      phone,
      instagramHandle,
      city,
      location,
    } = registerOngDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Use city if location is not provided
    const finalLocation = location || city;

    // Create ONG user
    const user = this.userRepository.create({
      email,
      passwordHash,
      role: UserRole.ONG,
      ongName,
      phone,
      instagramHandle,
      location: finalLocation,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate token
    const accessToken = this.generateToken(savedUser);

    // Remove password from response
    delete savedUser.passwordHash;

    return {
      message: 'ONG registration successful.',
      user: savedUser,
      accessToken,
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    delete user.passwordHash;
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If this email exists, a password reset link will be sent.',
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

    // Save token
    const resetToken = this.resetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });
    await this.resetTokenRepository.save(resetToken);

    // Send email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(email, token, resetUrl);

    return {
      message: 'If this email exists, a password reset link will be sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find valid token
    const resetToken = await this.resetTokenRepository.findOne({
      where: {
        token,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    resetToken.user.passwordHash = passwordHash;
    await this.userRepository.save(resetToken.user);

    // Mark token as used
    resetToken.used = true;
    await this.resetTokenRepository.save(resetToken);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }
}

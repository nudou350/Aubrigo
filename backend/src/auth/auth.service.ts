import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Ong } from '../ongs/entities/ong.entity';
import { OngMember, OngMemberRole } from '../ongs/entities/ong-member.entity';
import { RegisterDto } from './dto/register.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ong)
    private ongRepository: Repository<Ong>,
    @InjectRepository(OngMember)
    private ongMemberRepository: Repository<OngMember>,
    private jwtService: JwtService,
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
      location,
      description,
      registrationNumber,
      website,
    } = registerOngDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email already exists (in users or ongs)
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    const existingOng = await this.ongRepository.findOne({
      where: { email },
    });

    if (existingUser || existingOng) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create ONG admin user
    const user = this.userRepository.create({
      email,
      passwordHash,
      role: UserRole.ONG,
      firstName: ongName.split(' ')[0],
      lastName: 'Admin',
      phone,
      location,
    });

    const savedUser = await this.userRepository.save(user);

    // Create ONG record
    const ong = this.ongRepository.create({
      email,
      ongName,
      phone,
      instagramHandle,
      location,
      description,
      registrationNumber,
      website,
      approvalStatus: 'pending', // ONGs need admin approval
    });

    const savedOng = await this.ongRepository.save(ong);

    // Create ONG membership (owner role)
    const membership = this.ongMemberRepository.create({
      ongId: savedOng.id,
      userId: savedUser.id,
      role: OngMemberRole.OWNER,
      invitationStatus: 'accepted',
      acceptedAt: new Date(),
    });

    await this.ongMemberRepository.save(membership);

    // Generate token
    const accessToken = this.generateToken(savedUser);

    // Remove password from response
    delete savedUser.passwordHash;

    return {
      message: 'ONG registration successful. Awaiting admin approval.',
      user: savedUser,
      ong: {
        id: savedOng.id,
        ongName: savedOng.ongName,
        email: savedOng.email,
        approvalStatus: savedOng.approvalStatus,
      },
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
}

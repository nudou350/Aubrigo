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
import { RegisterDto } from './dto/register.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}

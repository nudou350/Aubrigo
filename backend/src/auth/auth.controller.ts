import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterOngDto } from './dto/register-ong.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new NGO account (legacy endpoint)' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/user')
  @ApiOperation({ summary: 'Register a new regular user account' })
  @ApiResponse({ status: 201, description: 'User registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('register/ong')
  @ApiOperation({ summary: 'Register a new ONG account' })
  @ApiResponse({ status: 201, description: 'ONG registration successful. Awaiting admin approval.' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async registerOng(@Body() registerOngDto: RegisterOngDto) {
    return this.authService.registerOng(registerOngDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to existing account' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

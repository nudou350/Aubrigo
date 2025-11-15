import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { RegisterOngDto } from "./dto/register-ong.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("register")
  @ApiOperation({ summary: "Register a new NGO account (legacy endpoint)" })
  @ApiResponse({ status: 201, description: "Registration successful" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  @Post("register/user")
  @ApiOperation({ summary: "Register a new regular user account" })
  @ApiResponse({ status: 201, description: "User registration successful" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Req() req: Request,
  ) {
    return this.authService.registerUser(registerUserDto, req);
  }
  @Post("register/ong")
  @ApiOperation({ summary: "Register a new ONG account" })
  @ApiResponse({
    status: 201,
    description: "ONG registration successful. Awaiting admin approval.",
  })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async registerOng(
    @Body() registerOngDto: RegisterOngDto,
    @Req() req: Request,
  ) {
    return this.authService.registerOng(registerOngDto, req);
  }
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login to existing account" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset email" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent if email exists",
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}

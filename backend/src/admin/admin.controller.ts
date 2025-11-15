import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";
import { AdminService } from "./admin.service";
@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get("dashboard/stats")
  @ApiOperation({ summary: "Get admin dashboard statistics" })
  @ApiResponse({ status: 200, description: "Dashboard statistics" })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
  @Get("ongs/pending")
  @ApiOperation({ summary: "Get all pending ONGs awaiting approval" })
  @ApiResponse({ status: 200, description: "List of pending ONGs" })
  async getPendingONGs(@Query("countryCode") countryCode?: string) {
    return this.adminService.getPendingONGs(countryCode);
  }
  @Get("ongs")
  @ApiOperation({ summary: "Get all ONGs (optionally filtered by country)" })
  @ApiResponse({ status: 200, description: "List of all ONGs" })
  async getAllONGs(@Query("countryCode") countryCode?: string) {
    return this.adminService.getAllONGs(countryCode);
  }
  @Patch("ongs/:id/approve")
  @ApiOperation({ summary: "Approve an ONG" })
  @ApiResponse({ status: 200, description: "ONG approved successfully" })
  @ApiResponse({ status: 404, description: "ONG not found" })
  async approveOng(@Param("id") id: string) {
    return this.adminService.approveOng(id);
  }
  @Patch("ongs/:id/reject")
  @ApiOperation({ summary: "Reject an ONG" })
  @ApiResponse({ status: 200, description: "ONG rejected" })
  @ApiResponse({ status: 404, description: "ONG not found" })
  async rejectOng(@Param("id") id: string, @Body("reason") reason?: string) {
    return this.adminService.rejectOng(id, reason);
  }
  @Get("users")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "List of all users" })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }
  @Get("users/:id")
  @ApiOperation({ summary: "Get user details" })
  @ApiResponse({ status: 200, description: "User details" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserDetails(@Param("id") id: string) {
    return this.adminService.getUserDetails(id);
  }
  @Delete("users/:id")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }
  @Get("pets")
  @ApiOperation({ summary: "Get all pets" })
  @ApiResponse({ status: 200, description: "List of all pets" })
  async getAllPets() {
    return this.adminService.getAllPets();
  }
  @Delete("pets/:id")
  @ApiOperation({ summary: "Delete a pet" })
  @ApiResponse({ status: 200, description: "Pet deleted successfully" })
  @ApiResponse({ status: 404, description: "Pet not found" })
  async deletePet(@Param("id") id: string) {
    return this.adminService.deletePet(id);
  }
  @Get("donations")
  @ApiOperation({ summary: "Get recent donations" })
  @ApiResponse({ status: 200, description: "List of recent donations" })
  async getRecentDonations(@Query("limit") limit: number = 50) {
    return this.adminService.getRecentDonations(limit);
  }
}

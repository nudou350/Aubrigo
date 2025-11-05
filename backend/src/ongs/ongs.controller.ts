import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OngsService } from './ongs.service';
import { UpdateOngDto } from './dto/update-ong.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@ApiTags('ONGs')
@Controller('ongs')
export class OngsController {
  constructor(private readonly ongsService: OngsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all approved ONGs' })
  @ApiResponse({ status: 200, description: 'List of approved ONGs' })
  async findAll() {
    return this.ongsService.findAll();
  }

  @Get('my-ong')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ONG details' })
  @ApiResponse({ status: 200, description: 'Current user ONG details' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async getMyOng(@CurrentUser() user: any) {
    return this.ongsService.getMyOng(user.id);
  }

  @Get('my-ongs')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ONGs the current user belongs to' })
  @ApiResponse({ status: 200, description: 'List of user ONGs' })
  async getMyOngs(@CurrentUser() user: any) {
    return this.ongsService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ONG by ID' })
  @ApiResponse({ status: 200, description: 'ONG details' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async findOne(@Param('id') id: string) {
    return this.ongsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ONG statistics' })
  @ApiResponse({ status: 200, description: 'ONG statistics' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async getOngStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ongsService.getOngStats(id, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ONG information' })
  @ApiResponse({ status: 200, description: 'ONG updated successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOngDto: UpdateOngDto,
    @CurrentUser() user: any,
  ) {
    return this.ongsService.update(id, updateOngDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ONG' })
  @ApiResponse({ status: 200, description: 'ONG deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'ONG not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ongsService.remove(id, user.id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ONG members' })
  @ApiResponse({ status: 200, description: 'List of ONG members' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ongsService.getMembers(id, user.id);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a member to the ONG' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.ongsService.inviteMember(id, inviteMemberDto, user.id);
  }

  @Post('invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept ONG invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(@Param('token') token: string, @CurrentUser() user: any) {
    return this.ongsService.acceptInvitation(token, user.id);
  }

  @Post('invitations/:token/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject ONG invitation' })
  @ApiResponse({ status: 200, description: 'Invitation rejected successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async rejectInvitation(@Param('token') token: string, @CurrentUser() user: any) {
    return this.ongsService.rejectInvitation(token, user.id);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ONG, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from the ONG' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.ongsService.removeMember(id, memberId, user.id);
  }
}

import { IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OngMemberRole, OngPermission } from '../entities/ong-member.entity';

export class InviteMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: OngMemberRole,
    example: OngMemberRole.MEMBER,
    default: OngMemberRole.MEMBER,
  })
  @IsEnum(OngMemberRole)
  role: OngMemberRole;

  @ApiProperty({
    type: [String],
    enum: OngPermission,
    example: [OngPermission.MANAGE_PETS, OngPermission.VIEW_APPOINTMENTS],
    required: false,
  })
  @IsOptional()
  @IsArray()
  permissions?: OngPermission[];
}

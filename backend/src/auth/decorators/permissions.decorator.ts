import { SetMetadata } from '@nestjs/common';
import { OngPermission } from '../../ongs/entities/ong-member.entity';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: OngPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

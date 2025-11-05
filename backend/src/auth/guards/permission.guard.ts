import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OngPermission } from '../../ongs/entities/ong-member.entity';
import { OngMember } from '../../ongs/entities/ong-member.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(OngMember)
    private ongMemberRepository: Repository<OngMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      OngPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin users have all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Get ONG ID from request params or body
    const ongId = request.params.ongId || request.body.ongId;

    if (!ongId) {
      throw new ForbiddenException(
        'ONG ID is required to check permissions',
      );
    }

    // Find user's membership in this ONG
    const membership = await this.ongMemberRepository.findOne({
      where: {
        ongId,
        userId: user.id,
        invitationStatus: 'accepted',
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this ONG');
    }

    // Owners have all permissions
    if (membership.role === 'owner') {
      return true;
    }

    // Check if user has required permissions
    const userPermissions = membership.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the required permissions',
      );
    }

    return true;
  }
}

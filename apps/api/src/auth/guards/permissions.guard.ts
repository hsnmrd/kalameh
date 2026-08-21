import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission, ROLES, hasPermission } from '@workspace/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    const user = request.user;
    if (!user || !user.role) {
      throw new ForbiddenException('دسترسی مجاز نیست');
    }

    // SUPER_ADMIN has platform-wide superuser privileges
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    const userRole = user.role;
    const hasAllRequired = requiredPermissions.every((permission) =>
      hasPermission(userRole, permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException(
        'شما دسترسی لازم برای انجام این عملیات را ندارید',
      );
    }

    return true;
  }
}

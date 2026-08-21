import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES } from '@workspace/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('دسترسی مجاز نیست');
    }

    // SUPER_ADMIN has platform-wide superuser privileges
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    const userRole = user.role;
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException('شما مجوز دسترسی به این بخش را ندارید');
    }

    return true;
  }
}

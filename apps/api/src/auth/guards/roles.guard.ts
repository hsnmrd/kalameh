import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES } from '@workspace/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { I18nService } from '../../i18n/i18n.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role: Role };
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const locale = this.i18n.extractLocale(request);
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(this.i18n.t('common.unauthorized', locale));
    }

    // SUPER_ADMIN has platform-wide superuser privileges
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    const userRole = user.role;
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    return true;
  }
}

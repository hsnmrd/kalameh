import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Role,
  Permission,
  ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from '@workspace/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { I18nService } from '../../i18n/i18n.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role: Role; permissions?: string[] };
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const locale = this.i18n.extractLocale(request);
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException(this.i18n.t('common.unauthorized', locale));
    }

    // SUPER_ADMIN has platform-wide superuser privileges
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    // Use JWT-embedded permissions if available, otherwise fall back to static defaults
    const userPermissions: readonly string[] =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : DEFAULT_ROLE_PERMISSIONS[user.role] || [];

    const hasAllRequired = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    return true;
  }
}

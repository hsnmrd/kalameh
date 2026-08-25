import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule, ROLES, Role } from '@workspace/types';
import { MODULES_KEY } from '../decorators/modules.decorator';
import { I18nService } from '../../i18n/i18n.service';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<AppModule[]>(
      MODULES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: {
        role: Role;
        enabledModules?: string[];
      };
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const locale = this.i18n.extractLocale(request);
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException(this.i18n.t('common.unauthorized', locale));
    }

    // SUPER_ADMIN has platform-wide superuser privileges (all modules available)
    if (user.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    const enabledModules = user.enabledModules || [];
    const hasAllRequired = requiredModules.every((mod) =>
      enabledModules.includes(mod),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException(
        this.i18n.t('institutes.moduleNotActive', locale),
      );
    }

    return true;
  }
}

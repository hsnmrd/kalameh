/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModulesGuard } from './modules.guard';
import { APP_MODULES, ROLES } from '@workspace/types';
import { I18nService } from '../../i18n/i18n.service';

describe('ModulesGuard', () => {
  let guard: ModulesGuard;
  let reflector: Reflector;
  let i18nService: I18nService;

  beforeEach(() => {
    reflector = new Reflector();
    i18nService = {
      extractLocale: jest.fn().mockReturnValue('fa'),
      t: jest.fn((key: string) => key),
    } as any;
    guard = new ModulesGuard(reflector, i18nService);
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers: {},
        }),
      }),
    } as any;
  };

  it('should allow access when no modules are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if institute has required module enabled', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([APP_MODULES.CLASSES_COURSES]);
    const context = createMockExecutionContext({
      role: ROLES.ADMIN,
      enabledModules: [APP_MODULES.USERS_STAFF, APP_MODULES.CLASSES_COURSES],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN bypass regardless of institute modules', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([APP_MODULES.FINANCE]);
    const context = createMockExecutionContext({
      role: ROLES.SUPER_ADMIN,
      enabledModules: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if institute lacks required module', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([APP_MODULES.FINANCE]);
    const context = createMockExecutionContext({
      role: ROLES.ADMIN,
      enabledModules: [APP_MODULES.USERS_STAFF],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no user', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([APP_MODULES.STUDENTS]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

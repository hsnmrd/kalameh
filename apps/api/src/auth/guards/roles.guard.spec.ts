/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES } from '@workspace/types';
import { I18nService } from '../../i18n/i18n.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let i18nService: I18nService;

  beforeEach(() => {
    reflector = new Reflector();
    i18nService = {
      extractLocale: jest.fn().mockReturnValue('fa'),
      t: jest.fn((key: string) => key),
    } as any;
    guard = new RolesGuard(reflector, i18nService);
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

  it('should allow access when no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([ROLES.ADMIN, ROLES.CLERK]);
    const context = createMockExecutionContext({
      role: ROLES.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN bypass even if SUPER_ADMIN is not in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROLES.STUDENT]);
    const context = createMockExecutionContext({
      role: ROLES.SUPER_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROLES.ADMIN]);
    const context = createMockExecutionContext({
      role: ROLES.STUDENT,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ROLES.ADMIN]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

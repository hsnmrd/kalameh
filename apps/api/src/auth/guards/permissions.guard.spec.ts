/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS, ROLES } from '@workspace/types';
import { I18nService } from '../../i18n/i18n.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let i18nService: I18nService;

  beforeEach(() => {
    reflector = new Reflector();
    i18nService = {
      extractLocale: jest.fn().mockReturnValue('fa'),
      t: jest.fn((key: string) => key),
    } as any;
    guard = new PermissionsGuard(reflector, i18nService);
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

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user role has required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.MANAGE_USERS]);
    const context = createMockExecutionContext({
      role: ROLES.INSTITUTE_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN bypass regardless of permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.MANAGE_INSTITUTES]);
    const context = createMockExecutionContext({
      role: ROLES.SUPER_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.MANAGE_INSTITUTES]);
    const context = createMockExecutionContext({
      role: ROLES.INSTITUTE_ADMIN, // INSTITUTE_ADMIN cannot manage institutes
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no user', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.VIEW_USERS]);
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

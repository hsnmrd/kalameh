/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '@workspace/types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: any;

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      rolePermission: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    strategy = new JwtStrategy(prismaService);
  });

  it('should validate and return user payload when user and institute are active', async () => {
    const mockUser = {
      id: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
      isActive: true,
      institute: {
        id: 'inst-1',
        isActive: true,
      },
    };

    prismaService.user.findUnique.mockResolvedValue(mockUser);

    const payload: JwtPayload = {
      sub: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      sub: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
      permissions: expect.any(Array),
    });
  });

  it('should throw UnauthorizedException if sub or instituteId is missing', async () => {
    const payload = {
      phone: '09123456789',
      role: 'STUDENT',
    } as any;

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user is deactivated', async () => {
    const mockUser = {
      id: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
      isActive: false,
      institute: {
        id: 'inst-1',
        isActive: true,
      },
    };

    prismaService.user.findUnique.mockResolvedValue(mockUser);

    const payload: JwtPayload = {
      sub: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if institute is deactivated', async () => {
    const mockUser = {
      id: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
      isActive: true,
      institute: {
        id: 'inst-1',
        isActive: false,
      },
    };

    prismaService.user.findUnique.mockResolvedValue(mockUser);

    const payload: JwtPayload = {
      sub: 'user-1',
      phone: '09123456789',
      role: 'STUDENT',
      instituteId: 'inst-1',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

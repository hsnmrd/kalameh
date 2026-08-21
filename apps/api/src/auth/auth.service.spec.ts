/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      institute: {
        findFirst: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const mockInstitute = {
        id: 'inst-1',
        subdomain: 'tehran',
        isActive: true,
      };
      const mockUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        phone: '09123456789',
        password: hashedPassword,
        role: 'STUDENT',
        firstName: 'Ali',
        lastName: 'Rezaei',
        isActive: true,
        institute: mockInstitute,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.institute.findFirst.mockResolvedValue(mockInstitute);
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.login({
        phone: '09123456789',
        password: '123456',
        subdomain: 'tehran',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.role).toBe('STUDENT');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        phone: '09123456789',
        role: 'STUDENT',
        instituteId: 'inst-1',
      });
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct-pwd', 10);
      const mockUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        phone: '09123456789',
        password: hashedPassword,
        isActive: true,
        institute: { id: 'inst-1', isActive: true },
      };

      prismaService.user.findMany.mockResolvedValue([mockUser]);

      await expect(
        service.login({
          phone: '09123456789',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if specified institute does not exist', async () => {
      prismaService.institute.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          phone: '09123456789',
          password: 'password',
          subdomain: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

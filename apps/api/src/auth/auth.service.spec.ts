/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
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
        I18nService,
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

      prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
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

    it('should throw localized UnauthorizedException (fa) on invalid password', async () => {
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
        service.login(
          {
            phone: '09123456789',
            password: 'wrong-password',
          },
          undefined,
          'fa',
        ),
      ).rejects.toThrow(
        new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است'),
      );
    });

    it('should throw localized UnauthorizedException (en) on invalid password', async () => {
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
        service.login(
          {
            phone: '09123456789',
            password: 'wrong-password',
          },
          undefined,
          'en',
        ),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid phone number or password'),
      );
    });

    it('should bubble up error when institute does not exist via findFirstOrThrow', async () => {
      prismaService.institute.findFirstOrThrow.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(
        service.login(
          {
            phone: '09123456789',
            password: 'password',
            subdomain: 'non-existent',
          },
          undefined,
          'en',
        ),
      ).rejects.toThrow('Record not found');
    });
  });
});

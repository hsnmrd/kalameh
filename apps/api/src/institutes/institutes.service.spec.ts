/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { InstitutesService } from './institutes.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import type { JwtPayload } from '@workspace/types';

describe('InstitutesService', () => {
  let service: InstitutesService;
  let prismaService: any;

  const mockSuperAdmin: JwtPayload = {
    sub: 'user-super-admin',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-system',
    phone: '09120000001',
  };

  const mockInstituteAdmin: JwtPayload = {
    sub: 'user-inst-admin',
    role: 'INSTITUTE_ADMIN',
    instituteId: 'inst-tehran',
    phone: '09120000002',
  };

  beforeEach(async () => {
    prismaService = {
      institute: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutesService,
        I18nService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<InstitutesService>(InstitutesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-system institutes with counts for SUPER_ADMIN', async () => {
      prismaService.institute.findMany.mockResolvedValue([
        {
          id: 'inst-1',
          name: 'Tehran Institute',
          subdomain: 'tehran',
          isActive: true,
          bankCardNumber: null,
          bankAccountName: null,
          bankShaba: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 5, users: 20 },
        },
      ]);

      const result = await service.findAll(mockSuperAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].classesCount).toBe(5);
      expect(result[0].usersCount).toBe(20);
      expect(prismaService.institute.findMany).toHaveBeenCalledWith({
        where: { subdomain: { not: 'system' } },
        include: { _count: { select: { classes: true, users: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return only own institute for INSTITUTE_ADMIN', async () => {
      prismaService.institute.findUniqueOrThrow.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute',
        subdomain: 'tehran',
        isActive: true,
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 5, users: 20 },
      });

      const result = await service.findAll(mockInstituteAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inst-tehran');
    });
  });

  describe('findOne', () => {
    it('should return institute details for SUPER_ADMIN', async () => {
      prismaService.institute.findUniqueOrThrow.mockResolvedValue({
        id: 'inst-1',
        name: 'Tehran Institute',
        subdomain: 'tehran',
        isActive: true,
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 5, users: 20, courses: 3, terms: 2 },
      });

      const result = await service.findOne('inst-1', mockSuperAdmin, 'en');
      expect(result.id).toBe('inst-1');
      expect(result.coursesCount).toBe(3);
    });

    it('should bubble up error when institute is not found via findUniqueOrThrow', async () => {
      prismaService.institute.findUniqueOrThrow.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(
        service.findOne('inst-none', mockSuperAdmin, 'en'),
      ).rejects.toThrow('Record not found');
    });
  });

  describe('create', () => {
    it('should allow SUPER_ADMIN to create an institute', async () => {
      prismaService.institute.findUnique.mockResolvedValue(null);
      prismaService.institute.create.mockResolvedValue({
        id: 'inst-new',
        name: 'Shiraz Institute',
        subdomain: 'shiraz',
        isActive: true,
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(
        { name: 'Shiraz Institute', subdomain: 'shiraz', isActive: true },
        undefined,
        mockSuperAdmin,
        'en',
      );

      expect(result.id).toBe('inst-new');
      expect(result.subdomain).toBe('shiraz');
    });

    it('should throw ConflictException if subdomain already exists', async () => {
      prismaService.institute.findUnique.mockResolvedValue({
        id: 'inst-existing',
      });

      await expect(
        service.create(
          { name: 'Tehran Institute', subdomain: 'tehran', isActive: true },
          undefined,
          mockSuperAdmin,
          'en',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if non-SUPER_ADMIN tries to create institute', async () => {
      await expect(
        service.create(
          { name: 'Tehran Institute', subdomain: 'tehran', isActive: true },
          undefined,
          mockInstituteAdmin,
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
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
    role: 'ADMIN',
    instituteId: 'inst-tehran',
    phone: '09120000002',
  };

  beforeEach(async () => {
    prismaService = {
      institute: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      branch: {
        create: jest.fn(),
      },
      instituteCustomOffDay: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
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
        where: { subdomain: { not: 'system' }, deletedAt: null },
        include: { _count: { select: { classes: true, users: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return only own institute for ADMIN', async () => {
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
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
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
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

    it('should bubble up error when institute is not found via findFirstOrThrow', async () => {
      prismaService.institute.findFirstOrThrow.mockRejectedValue(
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

    it('should save logoUrl with uploaded file filename when creating institute', async () => {
      prismaService.institute.findUnique.mockResolvedValue(null);
      prismaService.institute.create.mockResolvedValue({
        id: 'inst-new',
        name: 'Shiraz Institute',
        subdomain: 'shiraz',
        logoUrl: '/uploads/institutes/logo-123.png',
        isActive: true,
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockFile = {
        filename: 'logo-123.png',
        originalname: 'logo.png',
        mimetype: 'image/png',
        size: 1024,
      } as any;

      const result = await service.create(
        { name: 'Shiraz Institute', subdomain: 'shiraz', isActive: true },
        mockFile,
        mockSuperAdmin,
        'en',
      );

      expect(result.id).toBe('inst-new');
      expect(prismaService.institute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            logoUrl: '/uploads/institutes/logo-123.png',
          }),
        }),
      );
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

  describe('update', () => {
    it('should update institute with new uploaded logo file', async () => {
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute',
        subdomain: 'tehran',
      });
      prismaService.institute.update.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute Updated',
        subdomain: 'tehran',
        logoUrl: '/uploads/institutes/updated-logo.png',
        _count: { classes: 5, users: 20 },
      });

      const mockFile = {
        filename: 'updated-logo.png',
        originalname: 'logo.png',
        mimetype: 'image/png',
        size: 2048,
      } as any;

      const result = await service.update(
        'inst-tehran',
        { name: 'Tehran Institute Updated' },
        mockFile,
        mockInstituteAdmin,
        'en',
      );

      expect(result.id).toBe('inst-tehran');
      expect(prismaService.institute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst-tehran' },
          data: expect.objectContaining({
            name: 'Tehran Institute Updated',
            logoUrl: '/uploads/institutes/updated-logo.png',
          }),
        }),
      );
    });

    it('should update institute dismissedHolidays array', async () => {
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute',
      });
      prismaService.institute.update.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute',
        dismissedHolidays: ['2024-08-25'],
        _count: { classes: 0, users: 1 },
      });

      const result = await service.update(
        'inst-tehran',
        { dismissedHolidays: ['2024-08-25'] },
        undefined,
        mockInstituteAdmin,
        'en',
      );

      expect(result.dismissedHolidays).toEqual(['2024-08-25']);
      expect(prismaService.institute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst-tehran' },
          data: expect.objectContaining({
            dismissedHolidays: ['2024-08-25'],
          }),
        }),
      );
    });

    it('should throw ForbiddenException if institute admin tries to update different institute', async () => {
      await expect(
        service.update(
          'inst-other',
          { name: 'Other' },
          undefined,
          mockInstituteAdmin,
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should allow SUPER_ADMIN to soft delete an institute', async () => {
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
        id: 'inst-tehran',
        name: 'Tehran Institute',
        subdomain: 'tehran',
      });
      prismaService.institute.update.mockResolvedValue({
        id: 'inst-tehran',
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.delete('inst-tehran', mockSuperAdmin, 'en');
      expect(result.success).toBe(true);
      expect(prismaService.institute.update).toHaveBeenCalledWith({
        where: { id: 'inst-tehran' },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('should throw ConflictException if trying to delete system institute', async () => {
      prismaService.institute.findFirstOrThrow.mockResolvedValue({
        id: 'inst-system',
        name: 'System Institute',
        subdomain: 'system',
      });

      await expect(
        service.delete('inst-system', mockSuperAdmin, 'en'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if non-SUPER_ADMIN tries to delete institute', async () => {
      await expect(
        service.delete('inst-tehran', mockInstituteAdmin, 'en'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('custom off-days', () => {
    it('should return all custom off-days for an institute', async () => {
      const mockDays = [
        {
          id: 'off-1',
          instituteId: 'inst-tehran',
          date: '2024-10-01',
          title: 'روز پژوهش',
        },
      ];
      prismaService.instituteCustomOffDay.findMany.mockResolvedValue(mockDays);

      const result = await service.findCustomOffDays(
        'inst-tehran',
        mockInstituteAdmin,
      );
      expect(result).toEqual(mockDays);
      expect(prismaService.instituteCustomOffDay.findMany).toHaveBeenCalledWith(
        {
          where: { instituteId: 'inst-tehran' },
          orderBy: { date: 'asc' },
        },
      );
    });

    it('should allow creating a custom off-day', async () => {
      prismaService.instituteCustomOffDay.findUnique.mockResolvedValue(null);
      prismaService.instituteCustomOffDay.create.mockResolvedValue({
        id: 'off-1',
        instituteId: 'inst-tehran',
        date: '2024-10-01',
        title: 'روز پژوهش',
      });

      const result = await service.createCustomOffDay(
        'inst-tehran',
        { date: '2024-10-01', title: 'روز پژوهش' },
        mockInstituteAdmin,
      );

      expect((result as any).id).toBe('off-1');
      expect(prismaService.instituteCustomOffDay.create).toHaveBeenCalledWith({
        data: {
          instituteId: 'inst-tehran',
          date: '2024-10-01',
          title: 'روز پژوهش',
        },
      });
    });

    it('should throw ConflictException on duplicate date for custom off-day', async () => {
      prismaService.instituteCustomOffDay.findUnique.mockResolvedValue({
        id: 'off-1',
        date: '2024-10-01',
      });

      await expect(
        service.createCustomOffDay(
          'inst-tehran',
          { date: '2024-10-01', title: 'تکراری' },
          mockInstituteAdmin,
          'fa',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create multiple custom off-days for a date range', async () => {
      const mockRecords = [
        {
          id: 'off-1',
          instituteId: 'inst-tehran',
          date: '2024-10-01',
          title: 'تعطیلات',
        },
        {
          id: 'off-2',
          instituteId: 'inst-tehran',
          date: '2024-10-02',
          title: 'تعطیلات',
        },
      ];
      prismaService.$transaction.mockResolvedValue(mockRecords);

      const result = await service.createCustomOffDay(
        'inst-tehran',
        { startDate: '2024-10-01', endDate: '2024-10-02', title: 'تعطیلات' },
        mockInstituteAdmin,
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBe(2);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should allow deleting a custom off-day', async () => {
      prismaService.instituteCustomOffDay.findFirstOrThrow.mockResolvedValue({
        id: 'off-1',
        instituteId: 'inst-tehran',
      });
      prismaService.instituteCustomOffDay.delete.mockResolvedValue({
        id: 'off-1',
      });

      const result = await service.deleteCustomOffDay(
        'inst-tehran',
        'off-1',
        mockInstituteAdmin,
      );

      expect(result.id).toBe('off-1');
      expect(prismaService.instituteCustomOffDay.delete).toHaveBeenCalledWith({
        where: { id: 'off-1' },
      });
    });
  });
});

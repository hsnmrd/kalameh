/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtPayload } from '@workspace/types';

describe('TermsService', () => {
  let service: TermsService;
  let prismaService: any;
  let i18nService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prismaService = {
      term: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      instituteOperatingPhase: {
        findFirstOrThrow: jest.fn(),
      },
      $transaction: jest.fn((cb: any) =>
        typeof cb === 'function' ? cb(prismaService) : Promise.all(cb),
      ),
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
  });

  describe('findAll', () => {
    it('should return terms scoped to institute', async () => {
      const mockTerms = [
        {
          id: 'term-1',
          instituteId: 'inst-1',
          title: 'پاییز ۱۴۰۵',
          startDate: new Date('2026-09-23'),
          endDate: new Date('2026-12-21'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 5 },
        },
      ];

      prismaService.term.findMany.mockResolvedValue(mockTerms);

      const result = await service.findAll(mockAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].classesCount).toBe(5);
      expect(prismaService.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { instituteId: 'inst-1' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if startDate >= endDate', async () => {
      const dto = {
        title: 'ترم نامعتبر',
        startDate: '2026-12-21',
        endDate: '2026-09-23',
        isActive: true,
      };

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if term with same title exists in institute', async () => {
      const dto = {
        title: 'پاییز ۱۴۰۵',
        startDate: '2026-09-23',
        endDate: '2026-12-21',
        isActive: true,
      };

      prismaService.term.findFirst.mockResolvedValue({ id: 'existing-term' });

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create new term when valid', async () => {
      const dto = {
        title: 'پاییز ۱۴۰۵',
        startDate: '2026-09-23',
        endDate: '2026-12-21',
        isActive: true,
      };

      prismaService.term.findFirst.mockResolvedValue(null);
      prismaService.term.create.mockResolvedValue({
        id: 'new-term-id',
        instituteId: 'inst-1',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const result = await service.create(dto, mockAdmin);
      expect(result.id).toBe('new-term-id');
      expect(result.title).toBe('پاییز ۱۴۰۵');
    });

    it('should create new term for target institute when currentUser is SUPER_ADMIN', async () => {
      const superAdmin: JwtPayload = {
        sub: 'super-admin-id',
        phone: '09120000001',
        role: 'SUPER_ADMIN',
        instituteId: 'platform-inst-id',
      };
      const dto = {
        title: 'زمستان ۱۴۰۵',
        startDate: '2026-12-22',
        endDate: '2027-03-20',
        isActive: true,
        instituteId: 'target-inst-id',
      };

      prismaService.term.findFirst.mockResolvedValue(null);
      prismaService.term.create.mockResolvedValue({
        id: 'new-term-id-2',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const result = await service.create(dto, superAdmin);
      expect(result.id).toBe('new-term-id-2');
      expect(prismaService.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            instituteId: 'target-inst-id',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if term not found', async () => {
      prismaService.term.findFirstOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.update('invalid-id', { title: 'نام جدید' }, mockAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('previewSchedule', () => {
    it('calculates end date and returns completed sessions and holidays', () => {
      const result = service.previewSchedule({
        startDate: '1403/07/01',
        targetSessions: 18,
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
        skipHolidays: true,
      });

      expect(result.completedSessions).toBe(18);
      expect(result.sessionDates).toHaveLength(18);
      expect(result.startDateJalali).toBe('1403/07/01');
    });
  });

  describe('previewPhaseTerms', () => {
    it('generates term proposals for given operating phase', async () => {
      prismaService.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue({
        id: 'phase-1',
        title: 'نیمسال اول',
        months: [7, 8, 9, 10],
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
      });

      const proposals = await service.previewPhaseTerms(
        mockAdmin,
        'phase-1',
        1403,
        18,
      );

      expect(proposals.length).toBeGreaterThan(0);
      expect(proposals[0].title).toBeDefined();
    });

    it('should throw ConflictException when terms already exist for this operating phase and academic year', async () => {
      prismaService.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue({
        id: 'phase-1',
        title: 'فاز پاییز',
        months: [7, 8, 9],
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
      });
      prismaService.term.findMany.mockResolvedValue([
        {
          id: 'term-existing',
          title: 'مهر ۱۴۰۵',
          startDate: new Date('2026-09-23'), // Jalali year 1405
        },
      ]);

      await expect(
        service.previewPhaseTerms(mockAdmin, 'phase-1', 1405, 45),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('batchCreatePhaseTerms', () => {
    it('creates multiple terms in transaction', async () => {
      prismaService.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue({
        id: 'phase-1',
        title: 'نیمسال اول',
        instituteId: 'inst-1',
      });
      prismaService.term.findMany.mockResolvedValue([]);
      prismaService.term.create.mockImplementation((args: any) =>
        Promise.resolve({
          id: 'term-id',
          ...args.data,
          _count: { classes: 0 },
        }),
      );

      const result = await service.batchCreatePhaseTerms(
        {
          operatingPhaseId: 'phase-1',
          jalaliYear: 1403,
          sessionsPerTerm: 18,
          gapDaysBetweenTerms: 2,
          terms: [
            {
              title: 'ترم ۱',
              startDate: '2026-09-23',
              endDate: '2026-11-10',
              isActive: true,
            },
            {
              title: 'ترم ۲',
              startDate: '2026-11-12',
              endDate: '2027-01-15',
              isActive: true,
            },
          ],
        },
        mockAdmin,
      );

      expect(result).toHaveLength(2);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully delete an upcoming term without classes', async () => {
      const termData = {
        id: 'term-upcoming',
        title: 'ترم پیش‌رو',
        instituteId: 'inst-1',
        startDate: new Date('2099-01-01'),
        endDate: new Date('2099-02-28'),
        isActive: true,
        _count: { classes: 0 },
      };
      prismaService.term.findFirstOrThrow.mockResolvedValue(termData);
      prismaService.term.findMany.mockResolvedValue([termData]);
      prismaService.term.delete.mockResolvedValue({ id: 'term-upcoming' });

      const result = await service.remove('term-upcoming', mockAdmin);
      expect(result).toEqual({ success: true });
      expect(prismaService.term.delete).toHaveBeenCalledWith({
        where: { id: 'term-upcoming' },
      });
    });

    it('should throw BadRequestException when trying to delete a passed term', async () => {
      const termData = {
        id: 'term-past',
        title: 'ترم گذشته',
        instituteId: 'inst-1',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-02-28'),
        isActive: true,
        _count: { classes: 0 },
      };
      prismaService.term.findFirstOrThrow.mockResolvedValue(termData);
      prismaService.term.findMany.mockResolvedValue([termData]);

      await expect(service.remove('term-past', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when trying to delete an ongoing active term', async () => {
      const now = new Date();
      const pastMonth = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const futureMonth = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const termData = {
        id: 'term-active',
        title: 'ترم فعال جاری',
        instituteId: 'inst-1',
        startDate: pastMonth,
        endDate: futureMonth,
        isActive: true,
        _count: { classes: 0 },
      };
      prismaService.term.findFirstOrThrow.mockResolvedValue(termData);
      prismaService.term.findMany.mockResolvedValue([termData]);

      await expect(service.remove('term-active', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when upcoming term has associated classes', async () => {
      const termData = {
        id: 'term-with-classes',
        title: 'ترم دارای کلاس',
        instituteId: 'inst-1',
        startDate: new Date('2099-01-01'),
        endDate: new Date('2099-02-28'),
        isActive: true,
        _count: { classes: 3 },
      };
      prismaService.term.findFirstOrThrow.mockResolvedValue(termData);
      prismaService.term.findMany.mockResolvedValue([termData]);

      await expect(
        service.remove('term-with-classes', mockAdmin),
      ).rejects.toThrow(ConflictException);
    });
  });
});

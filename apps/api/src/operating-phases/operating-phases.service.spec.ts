import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { OperatingPhasesService } from './operating-phases.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { JwtPayload } from '@workspace/types';

describe('OperatingPhasesService', () => {
  let service: OperatingPhasesService;
  let prisma: {
    instituteOperatingPhase: {
      findMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let auditLogsService: {
    log: jest.Mock;
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
    role: 'ADMIN',
    instituteId: 'inst-1',
    phone: '09120000002',
  };

  beforeEach(async () => {
    prisma = {
      instituteOperatingPhase: {
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatingPhasesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    service = module.get<OperatingPhasesService>(OperatingPhasesService);
  });

  describe('findAll', () => {
    it('returns operating phases with calculated slots', async () => {
      const dbPhases = [
        {
          id: 'phase-1',
          instituteId: 'inst-1',
          title: 'فاز مدارس',
          months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
          startTime: '15:00',
          endTime: '21:00',
          slotDurationMinutes: 90,
          daysOfWeek: ['SATURDAY', 'MONDAY'],
          hasBreak: false,
          breakStartTime: null,
          breakEndTime: null,
          isActive: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.instituteOperatingPhase.findMany.mockResolvedValue(dbPhases);

      const result = await service.findAll(mockUser);

      expect(prisma.instituteOperatingPhase.findMany).toHaveBeenCalledWith({
        where: { instituteId: 'inst-1' },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].calculation.fullSlotsCount).toBe(4);
      expect(result[0].calculation.remainderMinutes).toBe(0);
      expect(result[0].calculation.hasWarning).toBe(false);
    });
  });

  describe('create', () => {
    it('throws ConflictException if selected months overlap with an existing active phase', async () => {
      prisma.instituteOperatingPhase.findMany.mockResolvedValue([
        {
          id: 'phase-1',
          title: 'فاز مدارس',
          months: [7, 8, 9],
        },
      ]);

      await expect(
        service.create(
          {
            title: 'فاز جدید با ماه تکراری',
            months: [9, 10], // month 9 overlaps
            startTime: '14:00',
            endTime: '20:00',
            slotDurationMinutes: 90,
            daysOfWeek: ['SATURDAY'],
            isActive: true,
            order: 0,
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a phase when months do not overlap', async () => {
      prisma.instituteOperatingPhase.findMany.mockResolvedValue([
        {
          id: 'phase-1',
          title: 'فاز مدارس',
          months: [7, 8, 9],
        },
      ]);

      const createdPhase = {
        id: 'phase-2',
        instituteId: 'inst-1',
        title: 'فاز تابستان',
        months: [4, 5, 6],
        startTime: '08:30',
        endTime: '20:30',
        slotDurationMinutes: 90,
        daysOfWeek: ['SATURDAY'],
        hasBreak: true,
        breakStartTime: '13:00',
        breakEndTime: '14:30',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.instituteOperatingPhase.create.mockResolvedValue(createdPhase);

      const result = await service.create(
        {
          title: 'فاز تابستان',
          months: [4, 5, 6],
          startTime: '08:30',
          endTime: '20:30',
          slotDurationMinutes: 90,
          daysOfWeek: ['SATURDAY'],
          hasBreak: true,
          breakStartTime: '13:00',
          breakEndTime: '14:30',
          isActive: true,
          order: 1,
        },
        mockUser,
      );

      expect(result.id).toBe('phase-2');
      expect(result.calculation.fullSlotsCount).toBe(7);
      expect(result.calculation.breakInfo?.hasBreak).toBe(true);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          module: 'OPERATING_PHASES',
        }),
      );
    });
  });

  describe('preview', () => {
    it('calculates slot duration, count, and detects remainder time', () => {
      // 15:00 to 21:15 with 90m slots -> 4 slots + 15 min remainder
      const preview = service.preview({
        startTime: '15:00',
        endTime: '21:15',
        slotDurationMinutes: 90,
      });

      expect(preview.fullSlotsCount).toBe(4);
      expect(preview.remainderMinutes).toBe(15);
      expect(preview.hasWarning).toBe(true);
      expect(preview.slots).toHaveLength(4);
    });

    it('calculates slots with break window in preview', () => {
      const preview = service.preview({
        startTime: '08:30',
        endTime: '20:30',
        slotDurationMinutes: 90,
        hasBreak: true,
        breakStartTime: '13:00',
        breakEndTime: '14:30',
      });

      expect(preview.fullSlotsCount).toBe(7);
      expect(preview.breakInfo?.hasBreak).toBe(true);
      expect(preview.shift1Slots).toHaveLength(3);
      expect(preview.shift2Slots).toHaveLength(4);
    });
  });
});

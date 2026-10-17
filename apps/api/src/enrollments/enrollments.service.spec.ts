import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { ENROLLMENT_STATUSES, ROLES, type JwtPayload } from '@workspace/types';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prisma: any;
  let redis: any;
  let auditLogsService: { log: jest.Mock };

  const student: JwtPayload = {
    sub: 'student-1',
    phone: '09120000004',
    role: ROLES.STUDENT,
    instituteId: 'inst-1',
  };

  const admin: JwtPayload = {
    sub: 'admin-1',
    phone: '09120000002',
    role: ROLES.ADMIN,
    instituteId: 'inst-1',
  };

  const sampleClass = {
    id: 'class-1',
    title: 'Starter 101',
    fee: 1_500_000,
    capacity: 10,
    instituteId: 'inst-1',
    institute: {
      bankCardNumber: '6037991122334455',
      bankAccountName: 'آموزشگاه زبان کلمه',
      bankShaba: 'IR123456789012345678901234',
    },
  };

  beforeEach(async () => {
    prisma = {
      class: {
        findFirstOrThrow: jest.fn().mockResolvedValue(sampleClass),
        findUnique: jest.fn().mockResolvedValue(sampleClass),
      },
      enrollment: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        upsert: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
    };

    redis = {
      hasClassLock: jest.fn().mockResolvedValue(false),
      acquireClassLock: jest.fn().mockResolvedValue(true),
      getClassLockRemainingTtl: jest.fn().mockResolvedValue(1800),
      countClassLocks: jest.fn().mockResolvedValue(0),
      releaseClassLock: jest.fn().mockResolvedValue(undefined),
      getStudentActiveReservation: jest.fn().mockResolvedValue(null),
    };

    auditLogsService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: AuditLogsService, useValue: auditLogsService },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(EnrollmentsService);
  });

  describe('reserve', () => {
    it('successfully acquires 30-minute reservation lock when capacity is available', async () => {
      const result = await service.reserve(
        student,
        { classId: 'class-1' },
        'fa',
      );

      expect(result.classId).toBe('class-1');
      expect(result.tuition).toBe(1_500_000);
      expect(result.remainingSeconds).toBe(1800);
      expect(result.bankInfo.bankCardNumber).toBe('6037991122334455');
      expect(redis.acquireClassLock).toHaveBeenCalledWith(
        'class-1',
        'student-1',
        1800,
      );
    });

    it('rejects reservation if class is full', async () => {
      prisma.enrollment.count.mockResolvedValue(10); // class capacity is 10

      await expect(
        service.reserve(student, { classId: 'class-1' }, 'fa'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects reservation if student already has active reservation lock', async () => {
      prisma.enrollment.findUnique.mockResolvedValueOnce({
        id: 'e-1',
        studentId: student.sub,
        classId: 'class-1',
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      });
      redis.hasClassLock.mockResolvedValueOnce(true);

      await expect(
        service.reserve(student, { classId: 'class-1' }, 'fa'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reservation if student is already enrolled or pending approval', async () => {
      prisma.enrollment.findUnique.mockResolvedValueOnce({
        id: 'e-1',
        studentId: student.sub,
        classId: 'class-1',
        status: ENROLLMENT_STATUSES.ENROLLED,
      });

      await expect(
        service.reserve(student, { classId: 'class-1' }, 'fa'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reservation if user is not a student', async () => {
      await expect(
        service.reserve(admin, { classId: 'class-1' }, 'fa'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelReservation', () => {
    it('releases redis lock and removes draft pending payments', async () => {
      const result = await service.cancelReservation(student, 'class-1');

      expect(result).toEqual({ success: true });
      expect(redis.releaseClassLock).toHaveBeenCalledWith(
        'class-1',
        'student-1',
      );
      expect(prisma.enrollment.deleteMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          classId: 'class-1',
          status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
        },
      });
    });
  });

  describe('joinWaitlist', () => {
    it('creates a waitlisted enrollment entry', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);
      const mockWaitlist = {
        id: 'enrollment-1',
        studentId: 'student-1',
        classId: 'class-1',
        status: ENROLLMENT_STATUSES.WAITLISTED,
      };
      prisma.enrollment.upsert.mockResolvedValue(mockWaitlist);

      const result = await service.joinWaitlist(
        student,
        { classId: 'class-1' },
        'fa',
      );

      expect(result.status).toBe(ENROLLMENT_STATUSES.WAITLISTED);
      expect(auditLogsService.log).toHaveBeenCalled();
    });

    it('rejects waitlist if student is already on waitlist or enrolled', async () => {
      prisma.enrollment.findUnique.mockResolvedValueOnce({
        id: 'e-1',
        studentId: student.sub,
        classId: 'class-1',
        status: ENROLLMENT_STATUSES.WAITLISTED,
      });

      await expect(
        service.joinWaitlist(student, { classId: 'class-1' }, 'fa'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('promoteWaitlist', () => {
    it('promotes waitlisted student to pending payment and acquires lock', async () => {
      const mockWaitlist = {
        id: 'enrollment-1',
        studentId: 'student-1',
        classId: 'class-1',
        status: ENROLLMENT_STATUSES.WAITLISTED,
      };
      prisma.enrollment.findFirstOrThrow.mockResolvedValue(mockWaitlist);
      prisma.enrollment.update.mockResolvedValue({
        ...mockWaitlist,
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      });

      const result = await service.promoteWaitlist(admin, 'enrollment-1', {
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      });

      expect(result.status).toBe(ENROLLMENT_STATUSES.PENDING_PAYMENT);
      expect(redis.acquireClassLock).toHaveBeenCalledWith(
        'class-1',
        'student-1',
        1800,
      );
      expect(auditLogsService.log).toHaveBeenCalled();
    });
  });
});

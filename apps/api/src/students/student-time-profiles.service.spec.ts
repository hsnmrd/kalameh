/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentTimeProfilesService } from './student-time-profiles.service';

describe('StudentTimeProfilesService', () => {
  let service: StudentTimeProfilesService;
  let prisma: {
    user: { findFirstOrThrow: jest.Mock };
    studentProfile: {
      upsert: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    studentTimeConstraint: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditLogs: { log: jest.Mock };

  const instituteId = '00000000-0000-4000-8000-000000000001';
  const studentId = '00000000-0000-4000-8000-000000000002';
  const profileId = '00000000-0000-4000-8000-000000000003';
  const constraintId = '00000000-0000-4000-8000-000000000004';
  const admin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000005',
    phone: '09120000000',
    role: 'ADMIN',
    instituteId,
  };

  beforeEach(async () => {
    prisma = {
      user: { findFirstOrThrow: jest.fn() },
      studentProfile: {
        upsert: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      studentTimeConstraint: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    auditLogs = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentTimeProfilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = module.get(StudentTimeProfilesService);
  });

  it('returns an incomplete empty profile for a legacy student', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: studentId,
      instituteId,
      studentProfile: null,
    });

    await expect(service.findOne(admin, studentId)).resolves.toEqual({
      studentId,
      studentProfileId: null,
      scheduleStatus: 'INCOMPLETE',
      constraints: [],
    });
    expect(prisma.user.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: studentId, role: 'STUDENT', instituteId },
      }),
    );
  });

  it('propagates not-found for a student outside the caller institute', async () => {
    prisma.user.findFirstOrThrow.mockRejectedValue(new NotFoundException());

    await expect(service.findOne(admin, studentId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('atomically replaces constraints and writes a summary audit log', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: studentId,
      instituteId,
      studentProfile: {
        id: profileId,
        scheduleStatus: 'INCOMPLETE',
        timeConstraints: [{ id: constraintId }],
      },
    });
    prisma.studentProfile.upsert.mockResolvedValue({ id: profileId });
    prisma.studentTimeConstraint.deleteMany.mockResolvedValue({ count: 1 });
    prisma.studentTimeConstraint.createMany.mockResolvedValue({ count: 1 });
    prisma.studentProfile.findUniqueOrThrow.mockResolvedValue({
      id: profileId,
      scheduleStatus: 'COMPLETE',
      timeConstraints: [
        {
          id: constraintId,
          instituteId,
          studentProfileId: profileId,
          kind: 'UNAVAILABLE',
          source: 'SCHOOL',
          dayOfWeek: 'SATURDAY',
          startTime: '08:00',
          endTime: '14:00',
          label: 'School',
          effectiveFrom: new Date('2026-09-01'),
          effectiveUntil: new Date('2027-06-30'),
          createdAt: new Date('2026-09-08'),
          updatedAt: new Date('2026-09-08'),
        },
      ],
    });

    const result = await service.replace(admin, studentId, {
      scheduleStatus: 'COMPLETE',
      constraints: [
        {
          id: constraintId,
          kind: 'UNAVAILABLE',
          source: 'SCHOOL',
          dayOfWeek: 'SATURDAY',
          startTime: '08:00',
          endTime: '14:00',
          label: 'School',
          effectiveFrom: '2026-09-01',
          effectiveUntil: '2027-06-30',
        },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.studentTimeConstraint.deleteMany).toHaveBeenCalledWith({
      where: { instituteId, studentProfileId: profileId },
    });
    expect(prisma.studentTimeConstraint.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          instituteId,
          studentProfileId: profileId,
          kind: 'UNAVAILABLE',
          effectiveFrom: new Date('2026-09-01'),
          effectiveUntil: new Date('2027-06-30'),
        }),
      ],
    });
    expect(
      prisma.studentTimeConstraint.createMany.mock.calls[0]?.[0].data[0],
    ).not.toHaveProperty('id');
    expect(auditLogs.log).toHaveBeenCalledWith({
      instituteId,
      userId: admin.sub,
      module: 'STUDENT_TIME_PROFILE',
      entityId: studentId,
      action: 'REPLACE',
      metadata: {
        previousScheduleStatus: 'INCOMPLETE',
        scheduleStatus: 'COMPLETE',
        previousConstraintCount: 1,
        constraintCount: 1,
      },
    });
    expect(result.scheduleStatus).toBe('COMPLETE');
    expect(result.constraints).toHaveLength(1);
  });

  it('supports explicitly clearing every constraint', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: studentId,
      instituteId,
      studentProfile: null,
    });
    prisma.studentProfile.upsert.mockResolvedValue({ id: profileId });
    prisma.studentTimeConstraint.deleteMany.mockResolvedValue({ count: 0 });
    prisma.studentProfile.findUniqueOrThrow.mockResolvedValue({
      id: profileId,
      scheduleStatus: 'COMPLETE',
      timeConstraints: [],
    });

    await expect(
      service.replace(admin, studentId, {
        scheduleStatus: 'COMPLETE',
        constraints: [],
      }),
    ).resolves.toMatchObject({
      scheduleStatus: 'COMPLETE',
      constraints: [],
    });
    expect(prisma.studentTimeConstraint.createMany).not.toHaveBeenCalled();
  });
});

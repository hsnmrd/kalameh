/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanPublicationService } from './scheduling-plan-publication.service';
import { SchedulingPlanValidationService } from './scheduling-plan-validation.service';

describe('MVP-032 SchedulingPlanPublicationService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    user: uuid(2),
    plan: uuid(3),
    run: uuid(4),
    term: uuid(5),
    proposal: uuid(6),
    course: uuid(7),
    teacher: uuid(8),
    createdClass: uuid(9),
  };
  const now = new Date('2026-09-09T17:00:00.000Z');
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  const validValidation = {
    planId: ids.plan,
    isValid: true,
    validatedAt: now,
    violations: [],
    summary: {
      proposalCount: 1,
      violationCount: 0,
      invalidProposalCount: 0,
    },
  };
  let transaction: any;
  let prisma: any;
  let validation: any;
  let auditLogs: any;
  let service: SchedulingPlanPublicationService;

  beforeEach(() => {
    transaction = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.plan,
          runId: ids.run,
          run: { termId: ids.term },
          proposals: [
            {
              id: ids.proposal,
              publishedClassId: null,
              title: 'A2',
              courseId: ids.course,
              branchId: null,
              classroomId: null,
              teacherId: ids.teacher,
              capacity: 12,
              daysOfWeek: ['SUNDAY'],
              startTime: '09:00',
              endTime: '10:30',
              course: { baseFee: 1_500_000 },
              teacher: { firstName: 'Sara', lastName: 'Ahmadi' },
              sessions: [{ sessionDate: new Date('2026-09-13T00:00:00Z') }],
            },
          ],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      class: {
        create: jest.fn().mockResolvedValue({ id: ids.createdClass }),
      },
      schedulingProposal: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma = {
      client: {
        $transaction: jest.fn((callback: any) => callback(transaction)),
      },
    };
    validation = { validate: jest.fn().mockResolvedValue(validValidation) };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SchedulingPlanPublicationService(
      prisma as PrismaService,
      validation as SchedulingPlanValidationService,
      auditLogs as AuditLogsService,
      { t: jest.fn((key: string) => key) } as unknown as I18nService,
    );
  });

  it('validates and publishes every proposal in one serializable transaction', async () => {
    const result = await service.publish(admin, ids.plan, undefined, 'fa', now);

    expect(result).toEqual({
      planId: ids.plan,
      runId: ids.run,
      status: 'PUBLISHED',
      classIds: [ids.createdClass],
      proposalCount: 1,
      publishedAt: now,
    });
    expect(prisma.client.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    expect(validation.validate).toHaveBeenCalledWith(
      admin,
      ids.plan,
      ids.institute,
      'fa',
      now,
      transaction,
      false,
    );
    expect(transaction.class.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instituteId: ids.institute,
        termId: ids.term,
        courseId: ids.course,
        fee: 1_500_000,
        teacherName: 'Sara Ahmadi',
        sessionDates: ['2026-09-13'],
      }),
      select: { id: true },
    });
    expect(transaction.schedulingProposal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { publishedClassId: ids.createdClass },
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_PUBLISHED' }),
    );
  });

  it('blocks publication when live validation fails', async () => {
    validation.validate.mockResolvedValue({
      ...validValidation,
      isValid: false,
      violations: [
        {
          code: 'TEACHER_TIME_CONFLICT',
          scope: 'PROPOSAL',
          proposalId: ids.proposal,
          conflictingEntityIds: [],
          context: {},
        },
      ],
      summary: {
        proposalCount: 1,
        violationCount: 1,
        invalidProposalCount: 1,
      },
    });

    await expect(
      service.publish(admin, ids.plan, undefined, 'fa', now),
    ).rejects.toThrow(ConflictException);
    expect(transaction.class.create).not.toHaveBeenCalled();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_PUBLICATION_BLOCKED' }),
    );
  });

  it('does not emit a success audit when class creation fails', async () => {
    transaction.class.create.mockRejectedValue(new Error('insert failed'));

    await expect(
      service.publish(admin, ids.plan, undefined, 'fa', now),
    ).rejects.toThrow('insert failed');
    expect(auditLogs.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_PUBLISHED' }),
    );
  });

  it('blocks partial republishing when any proposal is already linked', async () => {
    transaction.schedulingPlan.findFirstOrThrow.mockResolvedValue({
      id: ids.plan,
      runId: ids.run,
      run: { termId: ids.term },
      proposals: [
        {
          id: ids.proposal,
          publishedClassId: ids.createdClass,
        },
      ],
    });

    await expect(
      service.publish(admin, ids.plan, undefined, 'fa', now),
    ).rejects.toThrow(ConflictException);
    expect(transaction.class.create).not.toHaveBeenCalled();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_PUBLICATION_BLOCKED' }),
    );
  });

  it('requires super admins to select an institute', async () => {
    await expect(
      service.publish(
        { ...admin, role: ROLES.SUPER_ADMIN },
        ids.plan,
        undefined,
        'en',
        now,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.client.$transaction).not.toHaveBeenCalled();
  });
});

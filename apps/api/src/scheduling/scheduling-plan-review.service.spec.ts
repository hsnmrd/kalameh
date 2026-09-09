/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanReviewService } from './scheduling-plan-review.service';

describe('MVP-030 SchedulingPlanReviewService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    user: uuid(2),
    plan: uuid(3),
    run: uuid(4),
    proposal: uuid(5),
    course: uuid(6),
    teacher: uuid(7),
    qualification: uuid(8),
  };
  const now = new Date('2026-09-09T15:00:00.000Z');
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  const editableProposal = {
    id: ids.proposal,
    courseId: ids.course,
    title: 'A2',
    teacherId: ids.teacher,
    branchId: null,
    classroomId: null,
    capacity: 12,
    deliveryMode: 'ONLINE',
    daysOfWeek: ['SUNDAY'],
    startTime: '09:00',
    endTime: '10:30',
    plan: { firstReviewStartedAt: null, metricsSnapshot: { planKey: 'one' } },
  };
  const proposalResult = {
    id: ids.proposal,
    instituteId: ids.institute,
    planId: ids.plan,
    classRequirementId: null,
    courseId: ids.course,
    branchId: null,
    teacherId: ids.teacher,
    classroomId: null,
    teacherQualificationId: ids.qualification,
    qualificationCheckedAt: now,
    publishedClassId: null,
    title: 'A2 edited',
    capacity: 12,
    deliveryMode: 'ONLINE',
    daysOfWeek: ['TUESDAY'],
    startTime: '10:00',
    endTime: '11:30',
    timeGroup: 'ODD_MORNING',
    score: null,
    scoreBreakdown: {},
    selectionReasons: [
      { code: 'MANUALLY_SELECTED', evidence: { changedFields: ['title'] } },
    ],
    scoredAt: null,
    isLocked: false,
    lockedByUserId: null,
    lockedAt: null,
    isManuallyEdited: true,
    editCount: 1,
    warnings: [
      {
        code: 'MANUAL_EDIT_REQUIRES_VALIDATION',
        severity: 'WARNING',
        scope: 'PROPOSAL',
        context: {},
      },
    ],
    sessions: [],
    createdAt: now,
    updatedAt: now,
  };
  let prisma: any;
  let transaction: any;
  let auditLogs: any;
  let service: SchedulingPlanReviewService;

  beforeEach(() => {
    transaction = {
      schedulingPlan: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      schedulingProposal: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirstOrThrow: jest.fn().mockResolvedValue(proposalResult),
      },
    };
    prisma = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.plan,
          runId: ids.run,
          firstReviewStartedAt: null,
        }),
      },
      schedulingProposal: {
        findFirstOrThrow: jest.fn().mockResolvedValue(editableProposal),
      },
      teacherCourseQualification: {
        findFirstOrThrow: jest
          .fn()
          .mockResolvedValue({ id: ids.qualification }),
      },
      branch: { findFirstOrThrow: jest.fn() },
      classroom: { findFirstOrThrow: jest.fn() },
      $transaction: jest.fn((callback: any) => callback(transaction)),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SchedulingPlanReviewService(
      prisma as PrismaService,
      auditLogs as AuditLogsService,
      { t: jest.fn((key: string) => key) } as unknown as I18nService,
    );
  });

  it('atomically selects one plan and clears the previous selection', async () => {
    const result = await service.selectPlan(
      admin,
      ids.plan,
      undefined,
      'fa',
      now,
    );

    expect(result).toEqual({
      planId: ids.plan,
      runId: ids.run,
      status: 'SELECTED',
      selectedAt: now,
    });
    expect(transaction.schedulingPlan.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          runId: ids.run,
          status: 'SELECTED',
        }),
        data: { status: 'DRAFT', selectedAt: null },
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_SELECTED' }),
    );
  });

  it('locks a proposal with the acting user and review timestamp', async () => {
    const lockedResult = {
      ...proposalResult,
      isLocked: true,
      lockedByUserId: ids.user,
      lockedAt: now,
    };
    transaction.schedulingProposal.findFirstOrThrow.mockResolvedValue(
      lockedResult,
    );

    const result = await service.setProposalLock(
      admin,
      ids.plan,
      ids.proposal,
      { isLocked: true },
      undefined,
      'fa',
      now,
    );

    expect(result.isLocked).toBe(true);
    expect(transaction.schedulingProposal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isLocked: true,
          lockedByUserId: ids.user,
          lockedAt: now,
        },
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROPOSAL_LOCKED' }),
    );
  });

  it('invalidates scores and records a manual proposal edit', async () => {
    const result = await service.updateProposal(
      admin,
      ids.plan,
      ids.proposal,
      {
        title: 'A2 edited',
        daysOfWeek: ['TUESDAY'],
        startTime: '10:00',
        endTime: '11:30',
      },
      undefined,
      'fa',
      now,
    );

    expect(result.isManuallyEdited).toBe(true);
    expect(transaction.schedulingPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          qualityIndex: null,
          manualEditCount: { increment: 1 },
          metricsSnapshot: expect.objectContaining({
            validationStatus: 'STALE_AFTER_MANUAL_EDIT',
          }),
        }),
      }),
    );
    expect(transaction.schedulingProposal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          score: null,
          scoredAt: null,
          isManuallyEdited: true,
          editCount: { increment: 1 },
        }),
      }),
    );
    expect(
      prisma.teacherCourseQualification.findFirstOrThrow,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: ids.institute }),
      }),
    );
  });

  it('requires super admins to select an institute', async () => {
    await expect(
      service.selectPlan(
        { ...admin, role: ROLES.SUPER_ADMIN },
        ids.plan,
        undefined,
        'en',
        now,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.schedulingPlan.findFirstOrThrow).not.toHaveBeenCalled();
  });
});

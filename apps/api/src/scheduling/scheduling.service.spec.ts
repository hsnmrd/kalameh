/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingGenerationDispatcherService } from './scheduling-generation-dispatcher.service';
import { SchedulingService } from './scheduling.service';

describe('MVP-015 SchedulingService', () => {
  let service: SchedulingService;
  let prisma: any;
  let auditLogs: any;
  let preflight: any;
  let dispatcher: any;

  const ids = {
    institute: '00000000-0000-4000-8000-000000000001',
    user: '00000000-0000-4000-8000-000000000002',
    term: '00000000-0000-4000-8000-000000000003',
    branch: '00000000-0000-4000-8000-000000000004',
    requirement: '00000000-0000-4000-8000-000000000005',
    course: '00000000-0000-4000-8000-000000000006',
    run: '00000000-0000-4000-8000-000000000007',
    plan: '00000000-0000-4000-8000-000000000008',
  };
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  const generatedAt = new Date('2026-09-08T10:00:00.000Z');

  beforeEach(async () => {
    prisma = {
      term: { findFirst: jest.fn() },
      branch: { findFirst: jest.fn() },
      classRequirement: { findMany: jest.fn() },
      teacherCourseQualification: { findMany: jest.fn() },
      user: { findMany: jest.fn() },
      class: { findMany: jest.fn() },
      classroom: { findMany: jest.fn() },
      schedulingRun: { findFirst: jest.fn(), create: jest.fn() },
      schedulingProposal: { findMany: jest.fn() },
    };
    auditLogs = { log: jest.fn() };
    preflight = {
      evaluate: jest.fn().mockReturnValue({
        schemaVersion: '1',
        checkedAt: generatedAt,
        passed: true,
        summary: {
          blockingIssueCount: 0,
          warningCount: 0,
          infoCount: 0,
          requirementCount: 1,
          courseCount: 1,
          studentCount: 0,
          completeStudentScheduleCount: 0,
          activeTeacherCount: 0,
          teacherWithoutQualificationCount: 0,
        },
        issues: [],
      }),
    };
    dispatcher = { wake: jest.fn() };

    prisma.term.findFirst.mockResolvedValue({
      id: ids.term,
      title: 'Fall',
      startDate: generatedAt,
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      isActive: true,
    });
    prisma.branch.findFirst.mockResolvedValue({
      id: ids.branch,
      name: 'Main',
      isActive: true,
    });
    prisma.classRequirement.findMany.mockResolvedValue([
      {
        id: ids.requirement,
        termId: ids.term,
        courseId: ids.course,
        branchId: ids.branch,
        requiredClassCount: 2,
        capacity: 12,
        sessionDurationMinutes: 90,
        sessionsPerWeek: 2,
        totalSessions: null,
        deliveryMode: 'IN_PERSON',
        updatedAt: generatedAt,
        course: { title: 'A2' },
      },
    ]);
    prisma.teacherCourseQualification.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.class.findMany.mockResolvedValue([]);
    prisma.classroom.findMany.mockResolvedValue([]);
    prisma.schedulingRun.create.mockImplementation(({ data }: any) => {
      const planData = data.plans?.create;
      return Promise.resolve({
        id: ids.run,
        instituteId: data.instituteId,
        termId: data.termId,
        branchId: data.branchId,
        requestedByUserId: data.requestedByUserId,
        sourceRunId: data.sourceRunId,
        status: data.status,
        inputSnapshot: data.inputSnapshot,
        settingsSnapshot: data.settingsSnapshot,
        preflightReport: null,
        failureCode: null,
        failureMessage: null,
        startedAt: null,
        completedAt: null,
        plans: planData
          ? [
              {
                id: ids.plan,
                instituteId: ids.institute,
                runId: ids.run,
                ...planData,
                generatedAt,
                lastScoredAt: generatedAt,
                manualEditCount: 0,
                firstReviewStartedAt: null,
                selectedAt: null,
                rejectedAt: null,
                publishedAt: null,
                createdAt: generatedAt,
                updatedAt: generatedAt,
              },
            ]
          : [],
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
        { provide: AuditLogsService, useValue: auditLogs },
        { provide: SchedulingPreflightService, useValue: preflight },
        {
          provide: SchedulingGenerationDispatcherService,
          useValue: dispatcher,
        },
      ],
    }).compile();

    service = module.get(SchedulingService);
  });

  it('creates one queued run with one pending draft and no real class', async () => {
    const result = await service.generate(admin, {
      termId: ids.term,
      branchId: ids.branch,
      requirementIds: [ids.requirement],
      alternativePlanCount: 3,
      lockedProposalIds: [],
    });

    expect(result.status).toBe('QUEUED');
    expect(result.plans).toHaveLength(1);
    expect(result.plans[0]).toMatchObject({
      status: 'DRAFT',
      rank: 1,
      metricsSnapshot: { generationStatus: 'PENDING_ENGINE' },
    });
    expect(prisma.schedulingRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'QUEUED',
          plans: {
            create: expect.objectContaining({ status: 'DRAFT', rank: 1 }),
          },
        }),
      }),
    );
    expect(prisma.class.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.class.create).toBeUndefined();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'SCHEDULING',
        action: 'GENERATE_REQUESTED',
        entityId: ids.run,
      }),
    );
    expect(dispatcher.wake).toHaveBeenCalledTimes(1);
  });

  it('captures reproducible tenant-scoped inputs and default settings', async () => {
    await service.generate(admin, {
      termId: ids.term,
      branchId: ids.branch,
      requirementIds: [ids.requirement],
      alternativePlanCount: 2,
      lockedProposalIds: [],
    });

    const data = prisma.schedulingRun.create.mock.calls[0][0].data;
    expect(data.inputSnapshot).toMatchObject({
      schemaVersion: '1',
      request: {
        termId: ids.term,
        branchId: ids.branch,
        requirementIds: [ids.requirement],
        alternativePlanCount: 2,
      },
      requirements: [expect.objectContaining({ id: ids.requirement })],
    });
    expect(data.settingsSnapshot).toMatchObject({
      source: 'MVP_DEFAULTS',
      instituteOverrideApplied: false,
      weights: { studentCoverage: 50, timeDiversity: 25 },
      timeGroups: { eveningStartsAt: '14:00', timeZone: 'Asia/Tehran' },
    });
  });

  it('rejects missing or cross-scope requirements before creating a run', async () => {
    prisma.classRequirement.findMany.mockResolvedValue([]);

    await expect(
      service.generate(admin, {
        termId: ids.term,
        branchId: ids.branch,
        requirementIds: [ids.requirement],
        alternativePlanCount: 1,
        lockedProposalIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.schedulingRun.create).not.toHaveBeenCalled();
  });

  it('requires a source run when locked proposals are requested', async () => {
    await expect(
      service.generate(admin, {
        termId: ids.term,
        branchId: ids.branch,
        requirementIds: [ids.requirement],
        alternativePlanCount: 1,
        lockedProposalIds: [ids.plan],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.schedulingRun.create).not.toHaveBeenCalled();
  });

  it('requires super admin to explicitly select an institute', async () => {
    await expect(
      service.generate(
        { ...admin, role: ROLES.SUPER_ADMIN },
        {
          termId: ids.term,
          branchId: ids.branch,
          requirementIds: [ids.requirement],
          alternativePlanCount: 1,
          lockedProposalIds: [],
        },
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.term.findFirst).not.toHaveBeenCalled();
  });

  it('persists a failed run without a draft when preflight is blocked', async () => {
    preflight.evaluate.mockReturnValue({
      schemaVersion: '1',
      checkedAt: generatedAt,
      passed: false,
      summary: {
        blockingIssueCount: 1,
        warningCount: 0,
        infoCount: 0,
        requirementCount: 1,
        courseCount: 1,
        studentCount: 0,
        completeStudentScheduleCount: 0,
        activeTeacherCount: 0,
        teacherWithoutQualificationCount: 0,
      },
      issues: [
        {
          code: 'COURSE_WITHOUT_QUALIFIED_TEACHER',
          severity: 'BLOCKING',
          scope: 'COURSE',
          entityId: ids.course,
          context: {},
        },
      ],
    });

    const result = await service.generate(admin, {
      termId: ids.term,
      branchId: ids.branch,
      requirementIds: [ids.requirement],
      alternativePlanCount: 1,
      lockedProposalIds: [],
    });

    expect(result.status).toBe('PREFLIGHT_FAILED');
    expect(result.plans).toEqual([]);
    expect(prisma.schedulingRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PREFLIGHT_FAILED',
          failureCode: 'PREFLIGHT_BLOCKED',
          preflightReport: expect.objectContaining({ passed: false }),
        }),
      }),
    );
    expect(
      prisma.schedulingRun.create.mock.calls[0][0].data.plans,
    ).toBeUndefined();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PREFLIGHT_FAILED' }),
    );
    expect(dispatcher.wake).not.toHaveBeenCalled();
  });
});

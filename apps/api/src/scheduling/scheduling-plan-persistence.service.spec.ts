/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import type {
  SchedulingAlternativePlanGeneration,
  SchedulingCandidateCoverage,
  SchedulingCoverageEvaluation,
  SchedulingFeasibleCandidate,
  SchedulingUnresolvedEvaluation,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';
import { SchedulingPlanCompositionService } from './scheduling-plan-composition.service';
import { SchedulingPlanPersistenceService } from './scheduling-plan-persistence.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

describe('MVP-025 SchedulingPlanPersistenceService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    run: uuid(2),
    pendingPlan: uuid(3),
    persistedPlan: uuid(4),
    requester: uuid(5),
    requirement: uuid(6),
    course: uuid(7),
    teacher: uuid(8),
    qualification: uuid(9),
    availability: uuid(10),
    student: uuid(11),
  };
  const completedAt = new Date('2026-09-09T08:00:00.000Z');
  const requirement = {
    id: ids.requirement,
    courseId: ids.course,
    requiredClassCount: 1,
  };
  const feasibleCandidate: SchedulingFeasibleCandidate = {
    key: `${ids.requirement}:${ids.teacher}:SUNDAY:09:00:10:30`,
    assignmentKey: `${ids.requirement}:${ids.teacher}:SUNDAY:09:00:10:30:ONLINE`,
    requirementId: ids.requirement,
    courseId: ids.course,
    branchId: null,
    teacherId: ids.teacher,
    qualificationId: ids.qualification,
    availabilityId: ids.availability,
    classroomId: null,
    deliveryMode: 'ONLINE',
    capacity: 12,
    dayOfWeek: 'SUNDAY',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    timeGroup: 'ODD_MORNING',
  };
  const candidateCoverage: SchedulingCandidateCoverage = {
    candidate: feasibleCandidate,
    status: 'APPLICABLE',
    knownStudentCount: 1,
    unknownStudentCount: 0,
    coveredStudentIds: [ids.student],
    uncoveredStudentIds: [],
    coveragePercent: 100,
  };
  const coverageEvaluation = (
    withCandidate: boolean,
  ): SchedulingCoverageEvaluation => ({
    candidates: withCandidate ? [candidateCoverage] : [],
    courses: [
      {
        courseId: ids.course,
        status: 'APPLICABLE',
        knownStudentCount: 1,
        unknownStudentCount: 0,
        bestCoveredStudentCount: withCandidate ? 1 : 0,
        bestCoveragePercent: withCandidate ? 100 : 0,
        candidateCount: withCandidate ? 1 : 0,
      },
    ],
    summary: {
      candidateCount: withCandidate ? 1 : 0,
      courseCount: 1,
      studentCount: 1,
      knownStudentCount: 1,
      unknownStudentCount: 0,
    },
  });
  const generate = (
    withCandidate = true,
  ): SchedulingAlternativePlanGeneration =>
    new SchedulingAlternativePlanService(
      new SchedulingPlanCompositionService(
        new SchedulingTimeDistributionService(),
      ),
      new SchedulingDeterministicRankingService(),
    ).generate({
      requirements: [requirement],
      feasibleCandidates: withCandidate ? [feasibleCandidate] : [],
      coverageEvaluation: coverageEvaluation(withCandidate),
      alternativePlanCount: 1,
    });
  const unresolved = (
    generation: SchedulingAlternativePlanGeneration,
  ): Record<string, SchedulingUnresolvedEvaluation> => {
    const plan = generation.plans[0];
    const missingClassCount = plan.composition.summary.missingClassCount;
    return {
      [plan.planKey]: {
        items:
          missingClassCount === 0
            ? []
            : [
                {
                  classRequirementId: ids.requirement,
                  reasonCode: 'NO_FEASIBLE_TIME_SLOT',
                  missingClassCount,
                  details: {},
                },
              ],
        summary: {
          requiredClassCount: 1,
          scheduledClassCount: 1 - missingClassCount,
          missingClassCount,
          unresolvedRequirementCount: missingClassCount === 0 ? 0 : 1,
        },
      },
    };
  };
  let service: SchedulingPlanPersistenceService;
  let prisma: any;
  let transaction: any;
  let auditLogs: any;

  beforeEach(() => {
    transaction = {
      schedulingPlan: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: ids.persistedPlan }),
      },
      schedulingRun: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma = {
      schedulingRun: { findFirst: jest.fn() },
      classRequirement: { findMany: jest.fn() },
      teacherCourseQualification: { findMany: jest.fn() },
      classroom: { findMany: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((callback: any) => callback(transaction)),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    prisma.schedulingRun.findFirst.mockResolvedValue({
      id: ids.run,
      requestedByUserId: ids.requester,
      status: 'QUEUED',
      plans: [
        {
          id: ids.pendingPlan,
          status: 'DRAFT',
          manualEditCount: 0,
          weightsSnapshot: { studentCoverage: 50, timeDiversity: 25 },
          timeGroupsSnapshot: { eveningStartsAt: '14:00' },
          dataCompletenessSnapshot: { studentCount: 1 },
          formulaVersion: '1',
          proposals: [],
        },
      ],
    });
    prisma.classRequirement.findMany.mockResolvedValue([
      {
        id: ids.requirement,
        courseId: ids.course,
        branchId: null,
        course: { title: 'A1' },
      },
    ]);
    prisma.teacherCourseQualification.findMany.mockImplementation(
      ({ where }: any) =>
        Promise.resolve(
          where.id.in.length === 0
            ? []
            : [
                {
                  id: ids.qualification,
                  courseId: ids.course,
                  teacherProfile: { userId: ids.teacher },
                },
              ],
        ),
    );
    prisma.classroom.findMany.mockResolvedValue([]);
    service = new SchedulingPlanPersistenceService(
      prisma as PrismaService,
      auditLogs as AuditLogsService,
    );
  });

  it('atomically replaces the placeholder with plans and proposals', async () => {
    const generation = generate();

    const result = await service.persist({
      instituteId: ids.institute,
      runId: ids.run,
      generation,
      unresolvedByPlanKey: unresolved(generation),
      completedAt,
    });

    expect(result).toEqual({
      runId: ids.run,
      status: 'COMPLETED',
      planIds: [ids.persistedPlan],
      proposalCount: 1,
      unresolvedRequirementCount: 0,
      completedAt,
    });
    expect(transaction.schedulingPlan.deleteMany).toHaveBeenCalledWith({
      where: { runId: ids.run, instituteId: ids.institute },
    });
    const planData = transaction.schedulingPlan.create.mock.calls[0][0].data;
    expect(planData).toMatchObject({
      instituteId: ids.institute,
      runId: ids.run,
      rank: 1,
      isRecommended: true,
      coveragePercent: 100,
      proposals: {
        create: [
          expect.objectContaining({
            classRequirementId: ids.requirement,
            courseId: ids.course,
            teacherId: ids.teacher,
            title: 'A1',
            daysOfWeek: ['SUNDAY'],
          }),
        ],
      },
    });
    expect(transaction.schedulingRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ids.run,
          instituteId: ids.institute,
        }),
        data: expect.objectContaining({ status: 'COMPLETED', completedAt }),
      }),
    );
    expect(prisma.class).toBeUndefined();
    expect(prisma.teacherCourseQualification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: ids.institute }),
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: ids.run,
        action: 'GENERATION_COMPLETED',
      }),
    );
  });

  it('persists unresolved requirements for a partial plan', async () => {
    const generation = generate(false);

    const result = await service.persist({
      instituteId: ids.institute,
      runId: ids.run,
      generation,
      unresolvedByPlanKey: unresolved(generation),
      completedAt,
    });

    const planData = transaction.schedulingPlan.create.mock.calls[0][0].data;
    expect(planData.proposals.create).toEqual([]);
    expect(planData.unresolvedRequirements.create).toEqual([
      expect.objectContaining({
        classRequirementId: ids.requirement,
        reasonCode: 'NO_FEASIBLE_TIME_SLOT',
        missingClassCount: 1,
      }),
    ]);
    expect(result).toMatchObject({
      proposalCount: 0,
      unresolvedRequirementCount: 1,
    });
  });

  it('refuses to replace a reviewed or locked draft', async () => {
    prisma.schedulingRun.findFirst.mockResolvedValue({
      ...(await prisma.schedulingRun.findFirst()),
      plans: [
        {
          ...(await prisma.schedulingRun.findFirst()).plans[0],
          proposals: [
            {
              isLocked: true,
              isManuallyEdited: false,
              publishedClassId: null,
            },
          ],
        },
      ],
    });
    const generation = generate();

    await expect(
      service.persist({
        instituteId: ids.institute,
        runId: ids.run,
        generation,
        unresolvedByPlanKey: unresolved(generation),
        completedAt,
      }),
    ).rejects.toThrow('not safe for generated plan replacement');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('validates unresolved totals before touching persistence', async () => {
    const generation = generate();
    const invalidUnresolved = unresolved(generation);
    invalidUnresolved[generation.plans[0].planKey].summary = {
      requiredClassCount: 2,
      scheduledClassCount: 1,
      missingClassCount: 1,
      unresolvedRequirementCount: 0,
    };

    await expect(
      service.persist({
        instituteId: ids.institute,
        runId: ids.run,
        generation,
        unresolvedByPlanKey: invalidUnresolved,
        completedAt,
      }),
    ).rejects.toThrow();
    expect(prisma.schedulingRun.findFirst).not.toHaveBeenCalled();
  });

  it('rejects missing or cross-tenant requirements', async () => {
    prisma.classRequirement.findMany.mockResolvedValue([]);
    const generation = generate();

    await expect(
      service.persist({
        instituteId: ids.institute,
        runId: ids.run,
        generation,
        unresolvedByPlanKey: unresolved(generation),
        completedAt,
      }),
    ).rejects.toThrow('missing or cross-tenant requirements');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects missing or cross-tenant teacher qualifications', async () => {
    prisma.teacherCourseQualification.findMany.mockResolvedValue([]);
    const generation = generate();

    await expect(
      service.persist({
        instituteId: ids.institute,
        runId: ids.run,
        generation,
        unresolvedByPlanKey: unresolved(generation),
        completedAt,
      }),
    ).rejects.toThrow('missing or cross-tenant references');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

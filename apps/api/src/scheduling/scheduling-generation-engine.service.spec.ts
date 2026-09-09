/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { SchedulingPersistenceResult } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingGenerationEngineService } from './scheduling-generation-engine.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingPlanPersistenceService } from './scheduling-plan-persistence.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';

describe('MVP-026 SchedulingGenerationEngineService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    run: uuid(2),
    requester: uuid(3),
    term: uuid(4),
    requirement: uuid(5),
    course: uuid(6),
    teacher: uuid(7),
    qualification: uuid(8),
    availability: uuid(9),
    plan: uuid(10),
  };
  const startedAt = new Date('2026-09-09T09:00:00.000Z');
  const inputSnapshot = {
    schemaVersion: '1',
    request: {
      termId: ids.term,
      branchId: null,
      requirementIds: [ids.requirement],
      alternativePlanCount: 1,
    },
    term: {
      id: ids.term,
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    },
    requirements: [
      {
        id: ids.requirement,
        courseId: ids.course,
        branchId: null,
        requiredClassCount: 1,
        capacity: 12,
        sessionDurationMinutes: 90,
        deliveryMode: 'ONLINE',
      },
    ],
    teachers: [
      {
        id: ids.qualification,
        courseId: ids.course,
        teacherProfile: {
          userId: ids.teacher,
          user: { isActive: true, role: 'TEACHER', branchId: null },
          availabilities: [
            {
              id: ids.availability,
              dayOfWeek: 'SUNDAY',
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
        },
      },
    ],
    students: [],
    existingClasses: [],
    classrooms: [],
  };
  const settingsSnapshot = {
    schemaVersion: '1',
    formulaVersion: '1',
    weights: { studentCoverage: 50, timeDiversity: 25 },
    timeGroups: {
      oddDays: ['SUNDAY', 'TUESDAY'],
      evenDays: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
      neutralDays: ['THURSDAY', 'FRIDAY'],
      eveningStartsAt: '14:00',
      timeZone: 'Asia/Tehran',
    },
    generation: { candidateStepMinutes: 30 },
  };
  const preflightReport = {
    schemaVersion: '1',
    checkedAt: '2026-09-09T08:59:00.000Z',
    passed: true,
    summary: {
      blockingIssueCount: 0,
      warningCount: 0,
      infoCount: 0,
      requirementCount: 1,
      courseCount: 1,
      studentCount: 0,
      completeStudentScheduleCount: 0,
      activeTeacherCount: 1,
      teacherWithoutQualificationCount: 0,
    },
    issues: [],
  };
  const persistenceResult: SchedulingPersistenceResult = {
    runId: ids.run,
    status: 'COMPLETED',
    planIds: [ids.plan],
    proposalCount: 1,
    unresolvedRequirementCount: 0,
    completedAt: startedAt,
  };
  let service: SchedulingGenerationEngineService;
  let prisma: any;
  let candidates: any;
  let hardConstraints: any;
  let coverage: any;
  let alternatives: any;
  let unresolved: any;
  let persistence: any;
  let auditLogs: any;

  beforeEach(() => {
    prisma = {
      schedulingRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: ids.run,
          requestedByUserId: ids.requester,
          status: 'QUEUED',
          inputSnapshot,
          settingsSnapshot,
          preflightReport,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    candidates = { generate: jest.fn().mockReturnValue([{ key: 'slot' }]) };
    hardConstraints = {
      evaluate: jest.fn().mockReturnValue({
        accepted: [{ assignmentKey: 'assignment' }],
        rejected: [],
      }),
    };
    coverage = {
      evaluate: jest.fn().mockReturnValue({ candidates: [], courses: [] }),
    };
    alternatives = {
      generate: jest.fn().mockReturnValue({
        plans: [
          {
            planKey: 'PLAN::assignment',
            composition: {
              assignments: [
                {
                  candidate: {
                    assignmentKey: 'assignment',
                    requirementId: ids.requirement,
                  },
                },
              ],
            },
          },
        ],
      }),
    };
    unresolved = {
      evaluate: jest.fn().mockReturnValue({
        items: [],
        summary: {
          requiredClassCount: 1,
          scheduledClassCount: 1,
          missingClassCount: 0,
          unresolvedRequirementCount: 0,
        },
      }),
    };
    persistence = {
      persist: jest.fn().mockResolvedValue(persistenceResult),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SchedulingGenerationEngineService(
      prisma as PrismaService,
      candidates as SchedulingCandidateSlotService,
      hardConstraints as SchedulingHardConstraintService,
      coverage as SchedulingStudentCoverageService,
      alternatives as SchedulingAlternativePlanService,
      unresolved as SchedulingUnresolvedRequirementService,
      persistence as SchedulingPlanPersistenceService,
      auditLogs as AuditLogsService,
    );
  });

  it('claims and executes the complete generation pipeline', async () => {
    const result = await service.process(ids.institute, ids.run, startedAt);

    expect(result).toEqual(persistenceResult);
    expect(prisma.schedulingRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.run, instituteId: ids.institute },
      }),
    );
    expect(prisma.schedulingRun.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          id: ids.run,
          instituteId: ids.institute,
          status: 'QUEUED',
        },
        data: expect.objectContaining({
          status: 'GENERATING',
          startedAt,
        }),
      }),
    );
    expect(candidates.generate).toHaveBeenCalledWith(
      expect.objectContaining({ stepMinutes: 30 }),
    );
    expect(hardConstraints.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ candidates: [{ key: 'slot' }] }),
    );
    expect(coverage.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ courseIds: [ids.course] }),
    );
    expect(alternatives.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        alternativePlanCount: 1,
        weights: { studentCoverage: 50, timeDiversity: 25 },
      }),
    );
    expect(unresolved.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedAssignments: [
          { assignmentKey: 'assignment', requirementId: ids.requirement },
        ],
      }),
    );
    expect(persistence.persist).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: ids.institute,
        runId: ids.run,
        completedAt: startedAt,
      }),
    );
  });

  it('marks a claimed run as failed when a pipeline stage throws', async () => {
    candidates.generate.mockImplementation(() => {
      throw new Error('candidate generation failed');
    });

    await expect(
      service.process(ids.institute, ids.run, startedAt),
    ).rejects.toThrow('candidate generation failed');
    expect(prisma.schedulingRun.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: ids.run,
        instituteId: ids.institute,
        status: 'GENERATING',
      },
      data: {
        status: 'FAILED',
        failureCode: 'GENERATION_ENGINE_FAILED',
        failureMessage: 'candidate generation failed',
        completedAt: startedAt,
      },
    });
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'GENERATION_FAILED' }),
    );
    expect(persistence.persist).not.toHaveBeenCalled();
  });

  it('does not execute an already-claimed run', async () => {
    prisma.schedulingRun.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.process(ids.institute, ids.run, startedAt),
    ).rejects.toThrow('scheduling run is not queued');
    expect(candidates.generate).not.toHaveBeenCalled();
    expect(auditLogs.log).not.toHaveBeenCalled();
  });

  it('marks invalid persisted snapshots as generation failures', async () => {
    prisma.schedulingRun.findFirst.mockResolvedValue({
      id: ids.run,
      requestedByUserId: ids.requester,
      status: 'QUEUED',
      inputSnapshot: {},
      settingsSnapshot,
      preflightReport,
    });

    await expect(
      service.process(ids.institute, ids.run, startedAt),
    ).rejects.toThrow();
    expect(prisma.schedulingRun.updateMany).toHaveBeenCalledTimes(2);
    expect(candidates.generate).not.toHaveBeenCalled();
  });
});

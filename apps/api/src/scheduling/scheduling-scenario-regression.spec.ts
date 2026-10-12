/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-argument */
import { randomUUID } from 'node:crypto';
import {
  ROLES,
  type JwtPayload,
  type SchedulingFeasibleCandidate,
  type SchedulingUnresolvedEvaluation,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';
import { SchedulingPlanCompositionService } from './scheduling-plan-composition.service';
import { SchedulingPlanPersistenceService } from './scheduling-plan-persistence.service';
import { SchedulingPlanPublicationService } from './scheduling-plan-publication.service';
import { SchedulingPlanValidationService } from './scheduling-plan-validation.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

/**
 * In-memory transactional store mirroring Prisma behavior for scheduling models.
 */
function createMockPrismaStore() {
  const plans = new Map<string, any>();
  const proposals = new Map<string, any>();
  const unresolvedRequirements = new Map<string, any>();
  const proposalSessions = new Map<string, any>();
  const classes = new Map<string, any>();
  const runs = new Map<string, any>();
  const requirements = new Map<string, any>();
  const qualifications = new Map<string, any>();
  const classrooms = new Map<string, any>();
  const courses = new Map<string, any>();
  const teachers = new Map<string, any>();

  const stats = {
    planCreates: 0,
    planCreateManys: 0,
    proposalCreates: 0,
    proposalCreateManys: 0,
    proposalUpdateManys: 0,
    sessionCreateManys: 0,
    unresolvedCreates: 0,
    unresolvedCreateManys: 0,
    classCreates: 0,
    classCreateManys: 0,
  };

  const transactionClient = {
    schedulingPlan: {
      deleteMany: jest.fn(async ({ where }: { where: any }) => {
        let count = 0;
        for (const [id, p] of Array.from(plans.entries())) {
          if (
            (!where.runId || p.runId === where.runId) &&
            (!where.instituteId || p.instituteId === where.instituteId)
          ) {
            plans.delete(id);
            count++;
          }
        }
        return { count };
      }),
      create: jest.fn(async ({ data, select }: { data: any; select?: any }) => {
        stats.planCreates++;
        const planId = data.id || randomUUID();
        const createdPlan = { ...data, id: planId };

        const createdProposals: any[] = [];
        if (data.proposals?.create) {
          for (const propData of data.proposals.create) {
            stats.proposalCreates++;
            const propId = propData.id || randomUUID();
            const prop = {
              publishedClassId: null,
              ...propData,
              id: propId,
              planId,
            };
            proposals.set(propId, prop);
            createdProposals.push(prop);
          }
        }

        const createdUnresolved: any[] = [];
        if (data.unresolvedRequirements?.create) {
          for (const itemData of data.unresolvedRequirements.create) {
            stats.unresolvedCreates++;
            const itemId = itemData.id || randomUUID();
            const item = { ...itemData, id: itemId, planId };
            unresolvedRequirements.set(itemId, item);
            createdUnresolved.push(item);
          }
        }

        plans.set(planId, createdPlan);

        if (select?.proposals) {
          return {
            id: planId,
            proposals: createdProposals.map((p) => ({
              id: p.id,
              daysOfWeek: p.daysOfWeek,
              startTime: p.startTime,
              endTime: p.endTime,
            })),
          };
        }
        return { id: planId, ...createdPlan };
      }),
      createMany: jest.fn(async ({ data }: { data: any[] }) => {
        stats.planCreateManys++;
        for (const item of data) {
          const id = item.id || randomUUID();
          plans.set(id, { ...item, id });
        }
        return { count: data.length };
      }),
      updateMany: jest.fn(
        async ({ where, data }: { where: any; data: any }) => {
          let count = 0;
          for (const [id, p] of Array.from(plans.entries())) {
            const matches =
              (!where.id ||
                (typeof where.id === 'object' && where.id.not
                  ? p.id !== where.id.not
                  : p.id === where.id)) &&
              (!where.instituteId || p.instituteId === where.instituteId) &&
              (!where.runId || p.runId === where.runId) &&
              (!where.status ||
                (typeof where.status === 'object' && where.status.in
                  ? where.status.in.includes(p.status)
                  : p.status === where.status));
            if (matches) {
              Object.assign(p, data);
              plans.set(id, p);
              count++;
            }
          }
          return { count };
        },
      ),
      findFirstOrThrow: jest.fn(async ({ where }: { where: any }) => {
        const found = Array.from(plans.values()).find(
          (p) =>
            p.id === where.id &&
            (!where.instituteId || p.instituteId === where.instituteId),
        );
        if (!found) throw new Error('Scheduling plan not found');
        const planProposals = Array.from(proposals.values()).filter(
          (p) => p.planId === found.id,
        );
        const run = runs.get(found.runId);

        return {
          id: found.id,
          runId: found.runId,
          run: {
            termId: run?.termId,
            term: { startDate: run?.term?.startDate ?? new Date('2026-09-01') },
          },
          proposals: planProposals.map((p) => {
            const course = courses.get(p.courseId);
            const teacher = teachers.get(p.teacherId);
            const pSessions = Array.from(proposalSessions.values()).filter(
              (s) => s.proposalId === p.id,
            );
            return {
              ...p,
              course: { baseFee: course?.baseFee ?? 1_000_000 },
              teacher: teacher
                ? { firstName: teacher.firstName, lastName: teacher.lastName }
                : null,
              sessions: pSessions.map((s) => ({
                sessionDate: new Date(s.sessionDate),
              })),
            };
          }),
        };
      }),
    },
    schedulingProposal: {
      create: jest.fn(async ({ data, select }: { data: any; select?: any }) => {
        stats.proposalCreates++;
        const id = data.id || randomUUID();
        const created = { publishedClassId: null, ...data, id };
        proposals.set(id, created);
        return select?.id ? { id } : created;
      }),
      createMany: jest.fn(async ({ data }: { data: any[] }) => {
        stats.proposalCreateManys++;
        for (const item of data) {
          const id = item.id || randomUUID();
          proposals.set(id, { publishedClassId: null, ...item, id });
        }
        return { count: data.length };
      }),
      updateMany: jest.fn(
        async ({ where, data }: { where: any; data: any }) => {
          stats.proposalUpdateManys++;
          let count = 0;
          for (const [id, prop] of Array.from(proposals.entries())) {
            const matches =
              (!where.id || prop.id === where.id) &&
              (!where.planId || prop.planId === where.planId) &&
              (!where.instituteId || prop.instituteId === where.instituteId) &&
              (!('publishedClassId' in where) ||
                prop.publishedClassId === where.publishedClassId);
            if (matches) {
              Object.assign(prop, data);
              proposals.set(id, prop);
              count++;
            }
          }
          return { count };
        },
      ),
    },
    schedulingProposalSession: {
      createMany: jest.fn(async ({ data }: { data: any[] }) => {
        stats.sessionCreateManys++;
        for (const item of data) {
          const id = item.id || randomUUID();
          proposalSessions.set(id, { ...item, id });
        }
        return { count: data.length };
      }),
    },
    schedulingUnresolvedRequirement: {
      create: jest.fn(async ({ data }: { data: any }) => {
        stats.unresolvedCreates++;
        const id = data.id || randomUUID();
        unresolvedRequirements.set(id, { ...data, id });
        return { id, ...data };
      }),
      createMany: jest.fn(async ({ data }: { data: any[] }) => {
        stats.unresolvedCreateManys++;
        for (const item of data) {
          const id = item.id || randomUUID();
          unresolvedRequirements.set(id, { ...item, id });
        }
        return { count: data.length };
      }),
    },
    class: {
      create: jest.fn(async ({ data, select }: { data: any; select?: any }) => {
        stats.classCreates++;
        const id = data.id || randomUUID();
        const created = { ...data, id };
        classes.set(id, created);
        return select?.id ? { id } : created;
      }),
      createMany: jest.fn(async ({ data }: { data: any[] }) => {
        stats.classCreateManys++;
        for (const item of data) {
          const id = item.id || randomUUID();
          classes.set(id, { ...item, id });
        }
        return { count: data.length };
      }),
    },
    schedulingRun: {
      updateMany: jest.fn(
        async ({ where, data }: { where: any; data: any }) => {
          const run = runs.get(where.id);
          if (
            run &&
            (!where.instituteId || run.instituteId === where.instituteId)
          ) {
            runs.set(where.id, { ...run, ...data });
            return { count: 1 };
          }
          return { count: 0 };
        },
      ),
    },
  };

  const prisma = {
    client: {
      $transaction: jest.fn(
        async (cb: (tx: any) => Promise<any>, _opts?: any) => {
          return cb(transactionClient);
        },
      ),
    },
    $transaction: jest.fn(
      async (cb: (tx: any) => Promise<any>, _opts?: any) => {
        return cb(transactionClient);
      },
    ),
    schedulingRun: {
      findFirst: jest.fn(async ({ where }: { where: any }) => {
        const run = runs.get(where.id);
        if (!run) return null;
        const planList = Array.from(plans.values()).filter(
          (p) => p.runId === run.id,
        );
        return {
          ...run,
          plans: planList.map((p) => ({
            ...p,
            proposals: Array.from(proposals.values()).filter(
              (prop) => prop.planId === p.id,
            ),
          })),
        };
      }),
    },
    classRequirement: {
      findMany: jest.fn(async ({ where }: { where: any }) => {
        const ids = where?.id?.in ?? [];
        return ids.map((id: string) => requirements.get(id)).filter(Boolean);
      }),
    },
    teacherCourseQualification: {
      findMany: jest.fn(async ({ where }: { where: any }) => {
        const ids = where?.id?.in ?? [];
        return ids.map((id: string) => qualifications.get(id)).filter(Boolean);
      }),
    },
    classroom: {
      findMany: jest.fn(async ({ where }: { where: any }) => {
        const ids = where?.id?.in ?? [];
        return ids.map((id: string) => classrooms.get(id)).filter(Boolean);
      }),
    },
  };

  return {
    prisma,
    transactionClient,
    stats,
    tables: {
      plans,
      proposals,
      unresolvedRequirements,
      proposalSessions,
      classes,
      runs,
      requirements,
      qualifications,
      classrooms,
      courses,
      teachers,
    },
  };
}

describe('Auto-Scheduling End-to-End Scenarios & Parity Regression Suite', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;

  const instituteId = uuid(100);
  const termId = uuid(101);
  const runId = uuid(102);
  const userId = uuid(103);
  const studentId = uuid(104);
  const now = new Date('2026-09-01T08:00:00.000Z');

  const admin: JwtPayload = {
    sub: userId,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId,
  };

  let store: ReturnType<typeof createMockPrismaStore>;
  let auditLogs: { log: jest.Mock };
  let i18n: { t: jest.Mock };
  let persistenceService: SchedulingPlanPersistenceService;
  let publicationService: SchedulingPlanPublicationService;
  let validationService: { validate: jest.Mock };
  let alternativePlanService: SchedulingAlternativePlanService;

  beforeEach(() => {
    store = createMockPrismaStore();
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    i18n = { t: jest.fn((key: string) => key) };
    validationService = {
      validate: jest.fn().mockResolvedValue({
        planId: '',
        isValid: true,
        validatedAt: now,
        violations: [],
        summary: {
          proposalCount: 1,
          violationCount: 0,
          invalidProposalCount: 0,
        },
      }),
    };

    persistenceService = new SchedulingPlanPersistenceService(
      store.prisma as unknown as PrismaService,
      auditLogs as unknown as AuditLogsService,
    );

    publicationService = new SchedulingPlanPublicationService(
      store.prisma as unknown as PrismaService,
      validationService as unknown as SchedulingPlanValidationService,
      auditLogs as unknown as AuditLogsService,
      i18n as unknown as I18nService,
    );

    alternativePlanService = new SchedulingAlternativePlanService(
      new SchedulingPlanCompositionService(
        new SchedulingTimeDistributionService(),
      ),
      new SchedulingDeterministicRankingService(),
    );
  });

  const studentCoverageService = new SchedulingStudentCoverageService();

  function seedRun(
    termStartDate = new Date('2026-09-01'),
    termEndDate = new Date('2026-11-30'),
  ) {
    const draftPlanId = uuid(999);
    store.tables.plans.clear();
    store.tables.proposals.clear();
    store.tables.unresolvedRequirements.clear();
    store.tables.proposalSessions.clear();
    store.tables.classes.clear();

    const initialPlan = {
      id: draftPlanId,
      runId,
      instituteId,
      status: 'DRAFT',
      rank: 1,
      isRecommended: true,
      manualEditCount: 0,
      weightsSnapshot: { studentCoverage: 60, timeDiversity: 40 },
      timeGroupsSnapshot: {
        evenDays: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
        oddDays: ['SUNDAY', 'TUESDAY'],
      },
      dataCompletenessSnapshot: { requirementCount: 2 },
      formulaVersion: '1',
      proposals: [],
    };
    store.tables.plans.set(draftPlanId, initialPlan);

    store.tables.runs.set(runId, {
      id: runId,
      instituteId,
      requestedByUserId: userId,
      status: 'QUEUED',
      termId,
      term: {
        startDate: termStartDate,
        endDate: termEndDate,
      },
      plans: [initialPlan],
    });
  }

  // =========================================================================
  // SCENARIO 1: Standard Balanced In-Person & Online Schedule
  // =========================================================================
  describe('Scenario 1: Standard Balanced In-Person & Online Schedule', () => {
    const course1Id = uuid(1);
    const course2Id = uuid(2);
    const req1Id = uuid(10);
    const req2Id = uuid(20);
    const teacher1Id = uuid(30);
    const teacher2Id = uuid(40);
    const qual1Id = uuid(50);
    const qual2Id = uuid(60);
    const roomId = uuid(70);

    beforeEach(() => {
      seedRun();

      store.tables.courses.set(course1Id, {
        id: course1Id,
        title: 'English Level 1',
        baseFee: 1_200_000,
      });
      store.tables.courses.set(course2Id, {
        id: course2Id,
        title: 'English Level 2',
        baseFee: 1_400_000,
      });

      store.tables.teachers.set(teacher1Id, {
        id: teacher1Id,
        firstName: 'Ali',
        lastName: 'Rezaei',
      });
      store.tables.teachers.set(teacher2Id, {
        id: teacher2Id,
        firstName: 'Mina',
        lastName: 'Karimi',
      });

      store.tables.classrooms.set(roomId, {
        id: roomId,
        name: 'Room 101',
        capacity: 20,
      });

      store.tables.requirements.set(req1Id, {
        id: req1Id,
        courseId: course1Id,
        branchId: null,
        sessionsPerWeek: 3,
        totalSessions: null,
        course: { title: 'English Level 1' },
      });
      store.tables.requirements.set(req2Id, {
        id: req2Id,
        courseId: course2Id,
        branchId: null,
        sessionsPerWeek: 2,
        totalSessions: null,
        course: { title: 'English Level 2' },
      });

      store.tables.qualifications.set(qual1Id, {
        id: qual1Id,
        courseId: course1Id,
        teacherProfile: { userId: teacher1Id },
      });
      store.tables.qualifications.set(qual2Id, {
        id: qual2Id,
        courseId: course2Id,
        teacherProfile: { userId: teacher2Id },
      });
    });

    it('generates, persists, and publishes proposals with exact expected parity', async () => {
      const cand1: SchedulingFeasibleCandidate = {
        key: `${req1Id}:${teacher1Id}:SATURDAY:09:00:10:30`,
        assignmentKey: `${req1Id}:${teacher1Id}:SATURDAY:09:00:10:30:IN_PERSON`,
        requirementId: req1Id,
        courseId: course1Id,
        branchId: null,
        teacherId: teacher1Id,
        qualificationId: qual1Id,
        availabilityId: uuid(80),
        classroomId: roomId,
        deliveryMode: 'IN_PERSON',
        capacity: 15,
        dayOfWeek: 'SATURDAY',
        startTime: '09:00',
        endTime: '10:30',
        durationMinutes: 90,
        timeGroup: 'EVEN_MORNING',
      };

      const cand2: SchedulingFeasibleCandidate = {
        key: `${req2Id}:${teacher2Id}:SUNDAY:10:30:12:00`,
        assignmentKey: `${req2Id}:${teacher2Id}:SUNDAY:10:30:12:00:ONLINE`,
        requirementId: req2Id,
        courseId: course2Id,
        branchId: null,
        teacherId: teacher2Id,
        qualificationId: qual2Id,
        availabilityId: uuid(81),
        classroomId: null,
        deliveryMode: 'ONLINE',
        capacity: 12,
        dayOfWeek: 'SUNDAY',
        startTime: '10:30',
        endTime: '12:00',
        durationMinutes: 90,
        timeGroup: 'ODD_MORNING',
      };

      const coverage = studentCoverageService.evaluate({
        candidates: [cand1, cand2],
        courseIds: [course1Id, course2Id],
        students: [
          {
            id: studentId,
            currentAllowedCourseId: course1Id,
            studentProfile: {
              scheduleStatus: 'COMPLETE',
              availabilities: [],
              timeConstraints: [],
            },
          },
        ],
        termStartDate: '2026-09-01',
        termEndDate: '2026-11-30',
      });

      const generation = alternativePlanService.generate({
        requirements: [
          { id: req1Id, courseId: course1Id, requiredClassCount: 1 },
          { id: req2Id, courseId: course2Id, requiredClassCount: 1 },
        ],
        feasibleCandidates: [cand1, cand2],
        coverageEvaluation: coverage,
        alternativePlanCount: 1,
      });

      const planKey = generation.plans[0].planKey;
      const unresolvedByPlanKey: Record<
        string,
        SchedulingUnresolvedEvaluation
      > = {
        [planKey]: {
          items: [],
          summary: {
            requiredClassCount: 2,
            scheduledClassCount: 2,
            missingClassCount: 0,
            unresolvedRequirementCount: 0,
          },
        },
      };

      // 1. Act: Persist
      const persistResult = await persistenceService.persist({
        instituteId,
        runId,
        generation,
        unresolvedByPlanKey,
        completedAt: now,
      });

      // 2. Assert: Persistence
      expect(persistResult).toEqual({
        runId,
        status: 'COMPLETED',
        planIds: expect.arrayContaining([expect.any(String)]),
        proposalCount: 2,
        unresolvedRequirementCount: 0,
        completedAt: now,
      });

      expect(store.tables.proposals.size).toBe(2);
      const persistedProposals = Array.from(store.tables.proposals.values());

      const p1 = persistedProposals.find((p) => p.courseId === course1Id);
      expect(p1).toBeDefined();
      expect(p1.teacherId).toBe(teacher1Id);
      expect(p1.classroomId).toBe(roomId);
      expect(p1.deliveryMode).toBe('IN_PERSON');
      expect(p1.daysOfWeek).toEqual(['SATURDAY', 'MONDAY', 'WEDNESDAY']);
      expect(p1.startTime).toBe('09:00');
      expect(p1.endTime).toBe('10:30');

      const p2 = persistedProposals.find((p) => p.courseId === course2Id);
      expect(p2).toBeDefined();
      expect(p2.teacherId).toBe(teacher2Id);
      expect(p2.classroomId).toBeNull();
      expect(p2.deliveryMode).toBe('ONLINE');
      expect(p2.daysOfWeek).toEqual(['SUNDAY', 'TUESDAY']);
      expect(p2.startTime).toBe('10:30');
      expect(p2.endTime).toBe('12:00');

      expect(store.tables.proposalSessions.size).toBeGreaterThan(0);

      // 3. Act: Publish
      const planId = persistResult.planIds[0];
      validationService.validate.mockResolvedValueOnce({
        planId,
        isValid: true,
        validatedAt: now,
        violations: [],
        summary: {
          proposalCount: 2,
          violationCount: 0,
          invalidProposalCount: 0,
        },
      });

      const storedPlan = store.tables.plans.get(planId);
      storedPlan.status = 'SELECTED';

      const publishResult = await publicationService.publish(
        admin,
        planId,
        undefined,
        'fa',
        now,
      );

      // 4. Assert: Publication
      expect(publishResult.status).toBe('PUBLISHED');
      expect(publishResult.proposalCount).toBe(2);
      expect(publishResult.classIds.length).toBe(2);

      expect(store.tables.classes.size).toBe(2);
      const createdClasses = Array.from(store.tables.classes.values());
      const class1 = createdClasses.find((c) => c.courseId === course1Id);
      expect(class1).toBeDefined();
      expect(class1.teacherId).toBe(teacher1Id);
      expect(class1.teacherName).toBe('Ali Rezaei');
      expect(class1.classroomId).toBe(roomId);
      expect(class1.daysOfWeek).toEqual(['SATURDAY', 'MONDAY', 'WEDNESDAY']);

      const class2 = createdClasses.find((c) => c.courseId === course2Id);
      expect(class2).toBeDefined();
      expect(class2.teacherId).toBe(teacher2Id);
      expect(class2.teacherName).toBe('Mina Karimi');
      expect(class2.classroomId).toBeNull();

      for (const prop of store.tables.proposals.values()) {
        expect(prop.publishedClassId).toBeTruthy();
      }
    });
  });

  // =========================================================================
  // SCENARIO 2: Multiple Alternative Plans & Sibling Rejection
  // =========================================================================
  describe('Scenario 2: Multi-Alternative Plans and Sibling Rejection', () => {
    const courseId = uuid(1);
    const reqId = uuid(10);
    const teacher1Id = uuid(30);
    const teacher2Id = uuid(31);
    const qual1Id = uuid(50);
    const qual2Id = uuid(51);

    beforeEach(() => {
      seedRun();

      store.tables.courses.set(courseId, {
        id: courseId,
        title: 'English Course',
        baseFee: 1_000_000,
      });
      store.tables.teachers.set(teacher1Id, {
        id: teacher1Id,
        firstName: 'Reza',
        lastName: 'Moradi',
      });
      store.tables.teachers.set(teacher2Id, {
        id: teacher2Id,
        firstName: 'Sara',
        lastName: 'Tehrani',
      });

      store.tables.requirements.set(reqId, {
        id: reqId,
        courseId,
        branchId: null,
        sessionsPerWeek: 2,
        totalSessions: null,
        course: { title: 'English Course' },
      });

      store.tables.qualifications.set(qual1Id, {
        id: qual1Id,
        courseId,
        teacherProfile: { userId: teacher1Id },
      });
      store.tables.qualifications.set(qual2Id, {
        id: qual2Id,
        courseId,
        teacherProfile: { userId: teacher2Id },
      });
    });

    it('persists multiple alternative plans and rejects unselected plans on publication', async () => {
      const cand1: SchedulingFeasibleCandidate = {
        key: `${reqId}:${teacher1Id}:SUNDAY:09:00:10:30`,
        assignmentKey: `${reqId}:${teacher1Id}:SUNDAY:09:00:10:30:ONLINE`,
        requirementId: reqId,
        courseId,
        branchId: null,
        teacherId: teacher1Id,
        qualificationId: qual1Id,
        availabilityId: uuid(90),
        classroomId: null,
        deliveryMode: 'ONLINE',
        capacity: 10,
        dayOfWeek: 'SUNDAY',
        startTime: '09:00',
        endTime: '10:30',
        durationMinutes: 90,
        timeGroup: 'ODD_MORNING',
      };

      const cand2: SchedulingFeasibleCandidate = {
        key: `${reqId}:${teacher2Id}:SUNDAY:10:30:12:00`,
        assignmentKey: `${reqId}:${teacher2Id}:SUNDAY:10:30:12:00:ONLINE`,
        requirementId: reqId,
        courseId,
        branchId: null,
        teacherId: teacher2Id,
        qualificationId: qual2Id,
        availabilityId: uuid(91),
        classroomId: null,
        deliveryMode: 'ONLINE',
        capacity: 10,
        dayOfWeek: 'SUNDAY',
        startTime: '10:30',
        endTime: '12:00',
        durationMinutes: 90,
        timeGroup: 'ODD_MORNING',
      };

      const coverage = studentCoverageService.evaluate({
        candidates: [cand1, cand2],
        courseIds: [courseId],
        students: [
          {
            id: studentId,
            currentAllowedCourseId: courseId,
            studentProfile: {
              scheduleStatus: 'COMPLETE',
              availabilities: [],
              timeConstraints: [],
            },
          },
        ],
        termStartDate: '2026-09-01',
        termEndDate: '2026-11-30',
      });

      const generation = alternativePlanService.generate({
        requirements: [{ id: reqId, courseId, requiredClassCount: 1 }],
        feasibleCandidates: [cand1, cand2],
        coverageEvaluation: coverage,
        alternativePlanCount: 2,
      });

      const unresolvedByPlanKey: Record<
        string,
        SchedulingUnresolvedEvaluation
      > = {};
      for (const plan of generation.plans) {
        unresolvedByPlanKey[plan.planKey] = {
          items: [],
          summary: {
            requiredClassCount: 1,
            scheduledClassCount: 1,
            missingClassCount: 0,
            unresolvedRequirementCount: 0,
          },
        };
      }

      const result = await persistenceService.persist({
        instituteId,
        runId,
        generation,
        unresolvedByPlanKey,
        completedAt: now,
      });

      expect(result.planIds.length).toBe(2);
      expect(result.proposalCount).toBe(2);

      const persistedPlans = Array.from(store.tables.plans.values());
      expect(persistedPlans.map((p) => p.rank).sort()).toEqual([1, 2]);

      const selectedPlan = persistedPlans.find((p) => p.rank === 1)!;
      selectedPlan.status = 'SELECTED';

      validationService.validate.mockResolvedValueOnce({
        planId: selectedPlan.id,
        isValid: true,
        validatedAt: now,
        violations: [],
        summary: {
          proposalCount: 1,
          violationCount: 0,
          invalidProposalCount: 0,
        },
      });

      const pubResult = await publicationService.publish(
        admin,
        selectedPlan.id,
        undefined,
        'fa',
        now,
      );

      expect(pubResult.status).toBe('PUBLISHED');
      expect(selectedPlan.status).toBe('PUBLISHED');

      const otherPlans = persistedPlans.filter((p) => p.id !== selectedPlan.id);
      for (const other of otherPlans) {
        expect(other.status).toBe('REJECTED');
      }
    });
  });

  // =========================================================================
  // SCENARIO 3: Partial Plan with Unresolved Requirements
  // =========================================================================
  describe('Scenario 3: Unresolved Requirements Recording', () => {
    const courseId = uuid(1);
    const reqId = uuid(10);

    beforeEach(() => {
      seedRun();

      store.tables.courses.set(courseId, {
        id: courseId,
        title: 'Advanced Persian',
        baseFee: 2_000_000,
      });
      store.tables.requirements.set(reqId, {
        id: reqId,
        courseId,
        branchId: null,
        sessionsPerWeek: 2,
        totalSessions: null,
        course: { title: 'Advanced Persian' },
      });
    });

    it('accurately stores unresolved requirement reason codes and missing counts', async () => {
      const coverage = studentCoverageService.evaluate({
        candidates: [],
        courseIds: [courseId],
        students: [],
        termStartDate: '2026-09-01',
        termEndDate: '2026-11-30',
      });

      const generation = alternativePlanService.generate({
        requirements: [{ id: reqId, courseId, requiredClassCount: 1 }],
        feasibleCandidates: [],
        coverageEvaluation: coverage,
        alternativePlanCount: 1,
      });

      const planKey = generation.plans[0].planKey;
      const unresolvedByPlanKey: Record<
        string,
        SchedulingUnresolvedEvaluation
      > = {
        [planKey]: {
          items: [
            {
              classRequirementId: reqId,
              reasonCode: 'NO_QUALIFIED_TEACHER',
              missingClassCount: 1,
              details: { courseId, qualifiedTeacherCount: 0 },
            },
          ],
          summary: {
            requiredClassCount: 1,
            scheduledClassCount: 0,
            missingClassCount: 1,
            unresolvedRequirementCount: 1,
          },
        },
      };

      const result = await persistenceService.persist({
        instituteId,
        runId,
        generation,
        unresolvedByPlanKey,
        completedAt: now,
      });

      expect(result.proposalCount).toBe(0);
      expect(result.unresolvedRequirementCount).toBe(1);

      expect(store.tables.unresolvedRequirements.size).toBe(1);
      const unresolvedItem = Array.from(
        store.tables.unresolvedRequirements.values(),
      )[0];
      expect(unresolvedItem.classRequirementId).toBe(reqId);
      expect(unresolvedItem.reasonCode).toBe('NO_QUALIFIED_TEACHER');
      expect(unresolvedItem.missingClassCount).toBe(1);
      expect(unresolvedItem.details).toEqual({
        courseId,
        qualifiedTeacherCount: 0,
      });
    });
  });

  // =========================================================================
  // SCENARIO 4: High Volume Batch Scaling
  // =========================================================================
  describe('Scenario 4: High Volume Batch Scaling', () => {
    it('handles multiple proposals and sessions consistently', async () => {
      seedRun();

      const proposalCount = 6;
      const feasibleCandidates: SchedulingFeasibleCandidate[] = [];
      const requirements: any[] = [];

      for (let i = 1; i <= proposalCount; i++) {
        const cId = uuid(100 + i);
        const rId = uuid(200 + i);
        const tId = uuid(300 + i);
        const qId = uuid(400 + i);

        store.tables.courses.set(cId, {
          id: cId,
          title: `Course ${i}`,
          baseFee: 1_000_000,
        });
        store.tables.teachers.set(tId, {
          id: tId,
          firstName: `Teacher`,
          lastName: `${i}`,
        });
        store.tables.requirements.set(rId, {
          id: rId,
          courseId: cId,
          branchId: null,
          sessionsPerWeek: 3,
          totalSessions: null,
          course: { title: `Course ${i}` },
        });
        store.tables.qualifications.set(qId, {
          id: qId,
          courseId: cId,
          teacherProfile: { userId: tId },
        });

        const cand: SchedulingFeasibleCandidate = {
          key: `cand-${i}`,
          assignmentKey: `assign-${i}`,
          requirementId: rId,
          courseId: cId,
          branchId: null,
          teacherId: tId,
          qualificationId: qId,
          availabilityId: uuid(500 + i),
          classroomId: null,
          deliveryMode: 'ONLINE',
          capacity: 12,
          dayOfWeek: 'SATURDAY',
          startTime: '09:00',
          endTime: '10:30',
          durationMinutes: 90,
          timeGroup: 'EVEN_MORNING',
        };

        feasibleCandidates.push(cand);
        requirements.push({ id: rId, courseId: cId, requiredClassCount: 1 });
      }

      const coverage = studentCoverageService.evaluate({
        candidates: feasibleCandidates,
        courseIds: requirements.map((r) => r.courseId),
        students: [
          {
            id: studentId,
            currentAllowedCourseId: requirements[0].courseId,
            studentProfile: {
              scheduleStatus: 'COMPLETE',
              availabilities: [],
              timeConstraints: [],
            },
          },
        ],
        termStartDate: '2026-09-01',
        termEndDate: '2026-11-30',
      });

      const generation = alternativePlanService.generate({
        requirements,
        feasibleCandidates,
        coverageEvaluation: coverage,
        alternativePlanCount: 1,
      });

      const planKey = generation.plans[0].planKey;
      const unresolvedByPlanKey: Record<
        string,
        SchedulingUnresolvedEvaluation
      > = {
        [planKey]: {
          items: [],
          summary: {
            requiredClassCount: proposalCount,
            scheduledClassCount: proposalCount,
            missingClassCount: 0,
            unresolvedRequirementCount: 0,
          },
        },
      };

      const persistResult = await persistenceService.persist({
        instituteId,
        runId,
        generation,
        unresolvedByPlanKey,
        completedAt: now,
      });

      expect(persistResult.proposalCount).toBe(proposalCount);
      expect(store.tables.proposals.size).toBe(proposalCount);

      const planId = persistResult.planIds[0];
      const plan = store.tables.plans.get(planId);
      plan.status = 'SELECTED';

      validationService.validate.mockResolvedValueOnce({
        planId,
        isValid: true,
        validatedAt: now,
        violations: [],
        summary: { proposalCount, violationCount: 0, invalidProposalCount: 0 },
      });

      const pubResult = await publicationService.publish(
        admin,
        planId,
        undefined,
        'fa',
        now,
      );

      expect(pubResult.status).toBe('PUBLISHED');
      expect(pubResult.classIds.length).toBe(proposalCount);
      expect(store.tables.classes.size).toBe(proposalCount);

      for (const p of store.tables.proposals.values()) {
        expect(p.publishedClassId).toBeTruthy();
      }

      // Explicit verification: N+1 queries eliminated in favor of single bulk inserts
      expect(store.stats.proposalCreates).toBe(0);
      expect(store.stats.proposalCreateManys).toBe(1);
      expect(store.stats.classCreates).toBe(0);
      expect(store.stats.classCreateManys).toBe(1);
      expect(store.stats.sessionCreateManys).toBe(1);
    });
  });
});

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';

describe('MVP-029 SchedulingPlanQueryService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    otherInstitute: uuid(2),
    user: uuid(3),
    plan: uuid(4),
    run: uuid(5),
    term: uuid(6),
    proposal: uuid(7),
    requirement: uuid(8),
    course: uuid(9),
    teacher: uuid(10),
    qualification: uuid(11),
    unresolved: uuid(12),
  };
  const now = new Date('2026-09-09T14:00:00.000Z');
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  const requirement = {
    id: ids.requirement,
    courseId: ids.course,
    requiredClassCount: 2,
    capacity: 12,
    deliveryMode: 'ONLINE',
    course: { id: ids.course, title: 'A2' },
  };
  let prisma: any;
  let i18n: any;
  let service: SchedulingPlanQueryService;

  beforeEach(() => {
    prisma = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.plan,
          instituteId: ids.institute,
          runId: ids.run,
          status: 'DRAFT',
          rank: 1,
          isRecommended: true,
          earnedWeightedPoints: 60,
          applicableWeightedPoints: 75,
          qualityIndex: 80,
          coveragePercent: 90,
          minimumCourseCoveragePercent: 90,
          scoreBreakdown: {
            criteria: [],
            earnedWeightedPoints: 60,
            applicableWeightedPoints: 75,
            qualityIndex: 80,
          },
          metricsSnapshot: {},
          weightsSnapshot: {},
          timeGroupsSnapshot: {},
          dataCompletenessSnapshot: {},
          warnings: [],
          formulaVersion: '1',
          generatedAt: now,
          lastScoredAt: now,
          manualEditCount: 0,
          firstReviewStartedAt: null,
          selectedAt: null,
          rejectedAt: null,
          publishedAt: null,
          proposals: [
            {
              id: ids.proposal,
              instituteId: ids.institute,
              planId: ids.plan,
              classRequirementId: ids.requirement,
              courseId: ids.course,
              branchId: null,
              teacherId: ids.teacher,
              classroomId: null,
              teacherQualificationId: ids.qualification,
              qualificationCheckedAt: now,
              publishedClassId: null,
              title: 'A2',
              capacity: 12,
              deliveryMode: 'ONLINE',
              daysOfWeek: ['SUNDAY'],
              startTime: '09:00',
              endTime: '10:30',
              timeGroup: 'ODD_MORNING',
              score: 80,
              scoreBreakdown: {
                criteria: [],
                earnedWeightedPoints: 60,
                applicableWeightedPoints: 75,
                qualityIndex: 80,
              },
              selectionReasons: [],
              scoredAt: now,
              isLocked: false,
              lockedByUserId: null,
              lockedAt: null,
              isManuallyEdited: false,
              editCount: 0,
              warnings: [],
              sessions: [],
              course: requirement.course,
              teacher: {
                id: ids.teacher,
                firstName: 'Sara',
                lastName: 'Ahmadi',
                avatarUrl: null,
              },
              branch: null,
              classroom: null,
              classRequirement: requirement,
              lockedBy: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          unresolvedRequirements: [
            {
              id: ids.unresolved,
              instituteId: ids.institute,
              planId: ids.plan,
              classRequirementId: ids.requirement,
              reasonCode: 'INSUFFICIENT_FEASIBLE_CANDIDATES',
              missingClassCount: 1,
              details: {},
              classRequirement: requirement,
              createdAt: now,
              updatedAt: now,
            },
          ],
          run: {
            id: ids.run,
            status: 'COMPLETED',
            termId: ids.term,
            branchId: null,
            term: {
              id: ids.term,
              title: 'Fall',
              startDate: now,
              endDate: new Date('2026-12-31T00:00:00.000Z'),
            },
            branch: null,
          },
          createdAt: now,
          updatedAt: now,
        }),
      },
    };
    i18n = { t: jest.fn((key: string) => key) };
    service = new SchedulingPlanQueryService(
      prisma as PrismaService,
      i18n as I18nService,
    );
  });

  it('returns an explainable plan with display references', async () => {
    const result = await service.findOne(
      admin,
      ids.plan,
      ids.otherInstitute,
      'en',
    );

    expect(result).toMatchObject({
      id: ids.plan,
      rank: 1,
      run: { id: ids.run, term: { title: 'Fall' } },
      proposals: [
        {
          id: ids.proposal,
          course: { title: 'A2' },
          teacher: { firstName: 'Sara', lastName: 'Ahmadi' },
          selectionReasons: [],
        },
      ],
      unresolvedRequirements: [
        {
          reasonCode: 'INSUFFICIENT_FEASIBLE_CANDIDATES',
          classRequirement: { course: { title: 'A2' } },
        },
      ],
    });
    expect(prisma.schedulingPlan.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ids.plan,
          instituteId: ids.institute,
        }),
      }),
    );
  });

  it('loads nested collections in stable order', async () => {
    await service.findOne(admin, ids.plan);

    const query = prisma.schedulingPlan.findFirstOrThrow.mock.calls[0][0];
    expect(query.where.run).toEqual(
      expect.objectContaining({
        instituteId: ids.institute,
        status: 'COMPLETED',
        term: { instituteId: ids.institute },
      }),
    );
    expect(query.where.proposals.every).toEqual(
      expect.objectContaining({
        instituteId: ids.institute,
        course: { instituteId: ids.institute },
        teacher: { instituteId: ids.institute },
        sessions: { every: { instituteId: ids.institute } },
      }),
    );
    expect(query.include.proposals.orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
    expect(query.include.proposals.include.sessions.orderBy).toEqual([
      { sessionDate: 'asc' },
      { startTime: 'asc' },
      { id: 'asc' },
    ]);
    expect(query.include.unresolvedRequirements.orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('requires an explicit institute for super admins', async () => {
    await expect(
      service.findOne({ ...admin, role: ROLES.SUPER_ADMIN }, ids.plan),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.schedulingPlan.findFirstOrThrow).not.toHaveBeenCalled();
  });

  it('keeps missing and cross-tenant plans indistinguishable', async () => {
    prisma.schedulingPlan.findFirstOrThrow.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(service.findOne(admin, ids.plan)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.schedulingPlan.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ids.plan,
          instituteId: ids.institute,
        }),
      }),
    );
  });
});

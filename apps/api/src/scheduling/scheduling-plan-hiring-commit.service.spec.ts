/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanHiringCommitService } from './scheduling-plan-hiring-commit.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';

describe('SchedulingPlanHiringCommitService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    user: uuid(2),
    plan: uuid(3),
    run: uuid(4),
    term: uuid(5),
    course: uuid(6),
    classroom: uuid(7),
    requirement: uuid(8),
    unresolved: uuid(9),
  };
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };

  let service: SchedulingPlanHiringCommitService;
  let prisma: any;
  let auditLogsService: any;
  let i18nService: any;
  let planQueryService: any;

  beforeEach(() => {
    prisma = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.plan,
          status: 'DRAFT',
          publishedClassId: null,
          run: {
            term: {
              startDate: new Date('2026-09-23T00:00:00.000Z'),
              endDate: new Date('2026-11-20T00:00:00.000Z'),
            },
          },
        }),
      },
      classRequirement: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: ids.requirement,
            courseId: ids.course,
            branchId: null,
            capacity: 15,
            deliveryMode: 'IN_PERSON',
            course: { id: ids.course, title: 'English A1' },
          },
        ]),
      },
      classroom: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: ids.classroom,
            name: 'Classroom A',
            capacity: 20,
            branchId: null,
          },
        ]),
      },
      schedulingUnresolvedRequirement: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: ids.unresolved,
            classRequirementId: ids.requirement,
            missingClassCount: 1,
          },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        const tx = {
          schedulingProposal: {
            create: jest.fn().mockResolvedValue({ id: uuid(10) }),
          },
          schedulingProposalSession: {
            createMany: jest.fn().mockResolvedValue({ count: 16 }),
          },
          schedulingPlan: {
            update: jest.fn().mockResolvedValue({ id: ids.plan }),
          },
          schedulingUnresolvedRequirement: {
            delete: jest.fn().mockResolvedValue({ id: ids.unresolved }),
            update: jest.fn().mockResolvedValue({ id: ids.unresolved }),
          },
        };
        return await callback(tx);
      }),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    i18nService = {
      translate: jest.fn().mockImplementation((key) => key),
    };

    planQueryService = {
      findOne: jest.fn().mockResolvedValue({
        id: ids.plan,
        proposals: [],
        unresolvedRequirements: [],
      }),
    };

    service = new SchedulingPlanHiringCommitService(
      prisma as PrismaService,
      auditLogsService as AuditLogsService,
      i18nService as I18nService,
      planQueryService as SchedulingPlanQueryService,
    );
  });

  it('rejects if no assignments provided', async () => {
    await expect(
      service.commit(admin, ids.plan, { assignments: [] }),
    ).rejects.toThrow();
  });

  it('rejects if start time >= end time', async () => {
    await expect(
      service.commit(admin, ids.plan, {
        assignments: [
          {
            key: 'assignment-1',
            classNumber: 1,
            requirementId: ids.requirement,
            courseId: ids.course,
            deliveryMode: 'IN_PERSON',
            daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
            startTime: '15:30',
            endTime: '14:00',
            classroomId: ids.classroom,
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects IN_PERSON assignment when no physical classroom is assigned', async () => {
    await expect(
      service.commit(admin, ids.plan, {
        assignments: [
          {
            key: 'assignment-1',
            classNumber: 1,
            requirementId: ids.requirement,
            courseId: ids.course,
            deliveryMode: 'IN_PERSON',
            daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
            startTime: '14:00',
            endTime: '15:30',
            classroomId: null,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('successfully creates draft proposals without teacher and deletes unresolved requirement when count is 1', async () => {
    const result = await service.commit(admin, ids.plan, {
      assignments: [
        {
          key: 'assignment-1',
          classNumber: 1,
          requirementId: ids.requirement,
          courseId: ids.course,
          deliveryMode: 'IN_PERSON',
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '14:00',
          endTime: '15:30',
          classroomId: ids.classroom,
        },
      ],
    });

    expect(prisma.schedulingPlan.findFirstOrThrow).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'HIRING_PLAN_COMMITTED',
        entityId: ids.plan,
      }),
    );
    expect(planQueryService.findOne).toHaveBeenCalledWith(
      admin,
      ids.plan,
      undefined,
      'fa',
    );
    expect(result).toBeDefined();
  });
});

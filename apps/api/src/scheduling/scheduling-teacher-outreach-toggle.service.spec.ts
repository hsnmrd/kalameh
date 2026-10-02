/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';
import { SchedulingTeacherOutreachToggleService } from './scheduling-teacher-outreach-toggle.service';

describe('SchedulingTeacherOutreachToggleService', () => {
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
    teacher: uuid(10),
    teacherProfile: uuid(11),
    qualification: uuid(12),
    proposal: uuid(13),
    availability: uuid(14),
  };
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };

  let service: SchedulingTeacherOutreachToggleService;
  let prisma: any;
  let auditLogsService: any;
  let i18nService: any;
  let planQueryService: any;
  let txMocks: any;

  beforeEach(() => {
    txMocks = {
      teacherAvailability: {
        create: jest.fn().mockResolvedValue({ id: ids.availability }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      schedulingProposal: {
        create: jest.fn().mockResolvedValue({ id: ids.proposal }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      schedulingProposalSession: {
        createMany: jest.fn().mockResolvedValue({ count: 12 }),
      },
      schedulingUnresolvedRequirement: {
        update: jest.fn().mockResolvedValue({ id: ids.unresolved }),
      },
      schedulingPlan: {
        update: jest.fn().mockResolvedValue({ id: ids.plan }),
      },
    };

    prisma = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.plan,
          runId: ids.run,
          firstReviewStartedAt: null,
          proposals: [],
          run: {
            termId: ids.term,
            term: {
              startDate: new Date('2026-09-23T00:00:00.000Z'),
              endDate: new Date('2026-11-20T00:00:00.000Z'),
            },
          },
        }),
      },
      schedulingUnresolvedRequirement: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.unresolved,
          classRequirementId: ids.requirement,
          missingClassCount: 1,
          details: {},
          classRequirement: {
            id: ids.requirement,
            courseId: ids.course,
            branchId: null,
            capacity: 15,
            deliveryMode: 'IN_PERSON',
            course: { id: ids.course, title: 'AME 5-3' },
          },
        }),
      },
      user: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.teacher,
          firstName: 'Ali',
          lastName: 'Rezaei',
          teacherProfile: {
            id: ids.teacherProfile,
            availabilities: [],
            teachableCourses: [{ id: ids.qualification }],
          },
        }),
      },
      classroom: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: ids.classroom,
            name: 'Room 101',
            capacity: 20,
            branchId: null,
          },
        ]),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (cb) => await cb(txMocks)),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    i18nService = {
      t: jest.fn((key: string) => key),
    };
    planQueryService = {
      findOne: jest.fn().mockResolvedValue({
        id: ids.plan,
        proposals: [],
        unresolvedRequirements: [],
      }),
    };

    service = new SchedulingTeacherOutreachToggleService(
      prisma as PrismaService,
      auditLogsService as AuditLogsService,
      i18nService as I18nService,
      planQueryService as SchedulingPlanQueryService,
    );
  });

  const validInput = {
    unresolvedRequirementId: ids.unresolved,
    optionKey: `${ids.requirement}:${ids.teacher}:SUNDAY-TUESDAY-THURSDAY:14:00:15:30`,
    teacherId: ids.teacher,
    deliveryMode: 'IN_PERSON' as const,
    daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'] as const,
    startTime: '14:00',
    endTime: '15:30',
    availabilityChangeDays: ['SUNDAY', 'TUESDAY', 'THURSDAY'] as const,
    classroomId: ids.classroom,
  };

  it('accepts teacher outreach: updates teacher availability, creates proposal, decrements missingClassCount, and re-queries plan', async () => {
    await service.toggle(admin, ids.plan, {
      ...validInput,
      daysOfWeek: [...validInput.daysOfWeek],
      availabilityChangeDays: [...validInput.availabilityChangeDays],
    });

    expect(txMocks.teacherAvailability.create).toHaveBeenCalledTimes(3);
    expect(txMocks.schedulingProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planId: ids.plan,
          classRequirementId: ids.requirement,
          courseId: ids.course,
          teacherId: ids.teacher,
          classroomId: ids.classroom,
          title: 'AME 5-3',
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '14:00',
          endTime: '15:30',
        }),
      }),
    );
    expect(txMocks.schedulingUnresolvedRequirement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.unresolved },
        data: expect.objectContaining({
          missingClassCount: 0,
        }),
      }),
    );
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEACHER_OUTREACH_ACCEPTED',
      }),
    );
    expect(planQueryService.findOne).toHaveBeenCalledWith(
      admin,
      ids.plan,
      undefined,
      'fa',
    );
  });

  it('reverts teacher outreach when toggled off: deletes proposal, removes created availability, and increments missingClassCount', async () => {
    prisma.schedulingPlan.findFirstOrThrow.mockResolvedValueOnce({
      id: ids.plan,
      runId: ids.run,
      firstReviewStartedAt: null,
      proposals: [
        {
          id: ids.proposal,
          teacherId: ids.teacher,
          classroomId: ids.classroom,
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '14:00',
          endTime: '15:30',
        },
      ],
      run: {
        termId: ids.term,
        term: {
          startDate: new Date('2026-09-23T00:00:00.000Z'),
          endDate: new Date('2026-11-20T00:00:00.000Z'),
        },
      },
    });
    prisma.schedulingUnresolvedRequirement.findFirstOrThrow.mockResolvedValueOnce(
      {
        id: ids.unresolved,
        classRequirementId: ids.requirement,
        missingClassCount: 0,
        details: {
          acceptedOutreachOptions: [
            {
              optionKey: validInput.optionKey,
              proposalId: ids.proposal,
              teacher: {
                id: ids.teacher,
                firstName: 'Ali',
                lastName: 'Rezaei',
              },
              deliveryMode: 'IN_PERSON',
              daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
              startTime: '14:00',
              endTime: '15:30',
              availabilityChangeDays: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
              availableClassrooms: [
                { id: ids.classroom, name: 'Room 101', capacity: 20 },
              ],
              createdAvailabilityIds: [ids.availability],
            },
          ],
        },
        classRequirement: {
          id: ids.requirement,
          courseId: ids.course,
          branchId: null,
          capacity: 15,
          deliveryMode: 'IN_PERSON',
          course: { id: ids.course, title: 'AME 5-3' },
        },
      },
    );

    await service.toggle(admin, ids.plan, {
      ...validInput,
      daysOfWeek: [...validInput.daysOfWeek],
      availabilityChangeDays: [...validInput.availabilityChangeDays],
    });

    expect(txMocks.schedulingProposal.deleteMany).toHaveBeenCalledWith({
      where: {
        id: ids.proposal,
        planId: ids.plan,
        instituteId: ids.institute,
        publishedClassId: null,
      },
    });
    expect(txMocks.teacherAvailability.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: [ids.availability] },
        teacherProfile: { user: { instituteId: ids.institute } },
      },
    });
    expect(txMocks.schedulingUnresolvedRequirement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.unresolved },
        data: expect.objectContaining({
          missingClassCount: 1,
        }),
      }),
    );
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEACHER_OUTREACH_REVERTED',
      }),
    );
  });

  it('rejects invalid time ranges or unqualified teachers', async () => {
    await expect(
      service.toggle(admin, ids.plan, {
        ...validInput,
        daysOfWeek: [...validInput.daysOfWeek],
        availabilityChangeDays: [...validInput.availabilityChangeDays],
        startTime: '16:00',
        endTime: '15:00',
      }),
    ).rejects.toThrow(ConflictException);

    prisma.user.findFirstOrThrow.mockResolvedValueOnce({
      id: ids.teacher,
      firstName: 'Ali',
      lastName: 'Rezaei',
      teacherProfile: {
        id: ids.teacherProfile,
        availabilities: [],
        teachableCourses: [],
      },
    });

    await expect(
      service.toggle(admin, ids.plan, {
        ...validInput,
        daysOfWeek: [...validInput.daysOfWeek],
        availabilityChangeDays: [...validInput.availabilityChangeDays],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

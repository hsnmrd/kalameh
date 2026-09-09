/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { BadRequestException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanValidationService } from './scheduling-plan-validation.service';

describe('MVP-031 SchedulingPlanValidationService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    user: uuid(2),
    plan: uuid(3),
    term: uuid(4),
    proposal: uuid(5),
    requirement: uuid(6),
    course: uuid(7),
    teacher: uuid(8),
    qualification: uuid(9),
    existingClass: uuid(10),
  };
  const now = new Date('2026-09-09T16:00:00.000Z');
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  let prisma: any;
  let auditLogs: any;
  let plan: any;
  let service: SchedulingPlanValidationService;

  beforeEach(() => {
    plan = {
      id: ids.plan,
      run: {
        termId: ids.term,
        branchId: null,
        term: {
          instituteId: ids.institute,
          startDate: new Date('2026-09-01T00:00:00.000Z'),
          endDate: new Date('2026-12-31T00:00:00.000Z'),
          isActive: true,
        },
      },
      proposals: [
        {
          id: ids.proposal,
          instituteId: ids.institute,
          classRequirementId: ids.requirement,
          courseId: ids.course,
          branchId: null,
          teacherId: ids.teacher,
          classroomId: null,
          capacity: 12,
          deliveryMode: 'ONLINE',
          daysOfWeek: ['SUNDAY'],
          startTime: '09:00',
          endTime: '10:30',
          publishedClassId: null,
          course: { instituteId: ids.institute },
          branch: null,
          classroom: null,
          teacher: {
            instituteId: ids.institute,
            role: 'TEACHER',
            isActive: true,
            branchId: null,
            teacherProfile: {
              availabilities: [
                {
                  dayOfWeek: 'SUNDAY',
                  startTime: '08:00',
                  endTime: '12:00',
                },
              ],
              teachableCourses: [
                {
                  id: ids.qualification,
                  instituteId: ids.institute,
                  courseId: ids.course,
                },
              ],
            },
          },
          classRequirement: {
            instituteId: ids.institute,
            termId: ids.term,
            courseId: ids.course,
            branchId: null,
            requiredClassCount: 1,
            capacity: 12,
            sessionDurationMinutes: 90,
            sessionsPerWeek: 1,
            totalSessions: null,
            deliveryMode: 'ONLINE',
            isActive: true,
          },
          sessions: [],
        },
      ],
    };
    prisma = {
      schedulingPlan: { findFirstOrThrow: jest.fn().mockResolvedValue(plan) },
      class: { findMany: jest.fn().mockResolvedValue([]) },
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SchedulingPlanValidationService(
      prisma as PrismaService,
      auditLogs as AuditLogsService,
      { t: jest.fn((key: string) => key) } as unknown as I18nService,
    );
  });

  it('passes a selected plan against current tenant data', async () => {
    const result = await service.validate(
      admin,
      ids.plan,
      undefined,
      'fa',
      now,
    );

    expect(result).toEqual({
      planId: ids.plan,
      isValid: true,
      validatedAt: now,
      violations: [],
      summary: {
        proposalCount: 1,
        violationCount: 0,
        invalidProposalCount: 0,
      },
    });
    expect(prisma.schedulingPlan.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ids.plan,
          instituteId: ids.institute,
          status: 'SELECTED',
        }),
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_VALIDATION_PASSED' }),
    );
  });

  it('reports live teacher conflicts and availability changes', async () => {
    plan.proposals[0].teacher.teacherProfile.availabilities = [];
    prisma.class.findMany.mockResolvedValue([
      {
        id: ids.existingClass,
        teacherId: ids.teacher,
        classroomId: null,
        daysOfWeek: ['SUNDAY'],
        sessionDates: [],
        startTime: '09:30',
        endTime: '11:00',
      },
    ]);

    const result = await service.validate(
      admin,
      ids.plan,
      undefined,
      'fa',
      now,
    );

    expect(result.isValid).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'OUTSIDE_TEACHER_AVAILABILITY' }),
        expect.objectContaining({
          code: 'TEACHER_TIME_CONFLICT',
          conflictingEntityIds: [ids.existingClass],
        }),
      ]),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_VALIDATION_FAILED' }),
    );
  });

  it('requires super admins to select an institute', async () => {
    await expect(
      service.validate(
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

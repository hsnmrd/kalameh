/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingRunQueryService } from './scheduling-run-query.service';

describe('MVP-028 SchedulingRunQueryService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    otherInstitute: uuid(2),
    user: uuid(3),
    run: uuid(4),
    firstPlan: uuid(5),
    secondPlan: uuid(6),
  };
  const now = new Date('2026-09-09T13:00:00.000Z');
  const admin: JwtPayload = {
    sub: ids.user,
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId: ids.institute,
  };
  let prisma: any;
  let i18n: any;
  let service: SchedulingRunQueryService;

  beforeEach(() => {
    prisma = {
      schedulingRun: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: ids.run,
          status: 'COMPLETED',
          preflightReport: null,
          failureCode: null,
          failureMessage: null,
          startedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
          plans: [
            { id: ids.firstPlan, isRecommended: true },
            { id: ids.secondPlan, isRecommended: false },
          ],
        }),
      },
    };
    i18n = { t: jest.fn((key: string) => key) };
    service = new SchedulingRunQueryService(
      prisma as PrismaService,
      i18n as I18nService,
    );
  });

  it('returns result references for a completed tenant-scoped run', async () => {
    const result = await service.findStatus(
      admin,
      ids.run,
      ids.otherInstitute,
      'en',
    );

    expect(result).toMatchObject({
      runId: ids.run,
      status: 'COMPLETED',
      isTerminal: true,
      result: {
        planIds: [ids.firstPlan, ids.secondPlan],
        recommendedPlanId: ids.firstPlan,
      },
    });
    expect(prisma.schedulingRun.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.run, instituteId: ids.institute },
      }),
    );
  });

  it('does not expose the pending placeholder as a generated result', async () => {
    prisma.schedulingRun.findFirstOrThrow.mockResolvedValue({
      id: ids.run,
      status: 'QUEUED',
      preflightReport: null,
      failureCode: null,
      failureMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      plans: [{ id: ids.firstPlan, isRecommended: true }],
    });

    await expect(service.findStatus(admin, ids.run)).resolves.toMatchObject({
      status: 'QUEUED',
      isTerminal: false,
      result: null,
    });
  });

  it('returns structured preflight failure details', async () => {
    prisma.schedulingRun.findFirstOrThrow.mockResolvedValue({
      id: ids.run,
      status: 'PREFLIGHT_FAILED',
      preflightReport: {
        schemaVersion: '1',
        checkedAt: now,
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
            entityId: ids.firstPlan,
            context: {},
          },
        ],
      },
      failureCode: 'PREFLIGHT_BLOCKED',
      failureMessage: 'Blocked',
      startedAt: null,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
      plans: [],
    });

    await expect(service.findStatus(admin, ids.run)).resolves.toMatchObject({
      status: 'PREFLIGHT_FAILED',
      isTerminal: true,
      failureCode: 'PREFLIGHT_BLOCKED',
      preflightReport: { passed: false },
      result: null,
    });
  });

  it('requires an explicit institute for super admins', async () => {
    await expect(
      service.findStatus({ ...admin, role: ROLES.SUPER_ADMIN }, ids.run),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.schedulingRun.findFirstOrThrow).not.toHaveBeenCalled();
  });

  it('keeps not-found and cross-tenant runs indistinguishable', async () => {
    prisma.schedulingRun.findFirstOrThrow.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(service.findStatus(admin, ids.run)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.schedulingRun.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ids.run, instituteId: ids.institute },
      }),
    );
  });
});

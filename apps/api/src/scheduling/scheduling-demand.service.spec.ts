import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { JwtPayload, TermDemandReportDto } from '@workspace/types';
import { SchedulingDemandApplicationService } from './scheduling-demand-application.service';
import { SchedulingDemandCalculationService } from './scheduling-demand-calculation.service';

describe('Scheduling demand', () => {
  const currentUser: JwtPayload = {
    sub: 'admin-1',
    phone: '09120000000',
    role: 'ADMIN',
    instituteId: 'institute-1',
    permissions: [],
  };

  const course = {
    id: 'course-1',
    title: 'Starter',
    baseFee: 1_000_000,
    prerequisiteId: null,
    prerequisite: null,
  };

  const createCalculationPrisma = () => ({
    term: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'term-1',
        title: 'Fall',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        instituteId: 'institute-1',
      }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    course: { findMany: jest.fn().mockResolvedValue([course]) },
    enrollment: { findMany: jest.fn().mockResolvedValue([]) },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    classRequirement: { findMany: jest.fn().mockResolvedValue([]) },
    classroom: {
      findMany: jest.fn().mockResolvedValue([{ capacity: 20 }]),
    },
  });

  it('balances separate class rows under the supervisor limit', async () => {
    const prisma = createCalculationPrisma();
    prisma.user.findMany.mockResolvedValue(
      Array.from({ length: 29 }, (_, index) => ({
        id: `student-${index}`,
        currentAllowedCourseId: course.id,
        studentProfile: null,
      })),
    );
    const service = new SchedulingDemandCalculationService(prisma as never);

    const result = await service.calculateDemand(currentUser, {
      termId: 'term-1',
      maxStudentsPerClass: 20,
    });

    expect(result.effectiveCapacityLimit).toBe(20);
    expect(result.courses[0]?.suggestedClasses).toEqual([
      { key: 'course-1:1', capacity: 15 },
      { key: 'course-1:2', capacity: 14 },
    ]);
    expect(result.totalPlannedCapacity).toBe(29);
    expect(result.totalUncoveredStudents).toBe(0);
  });

  it('clamps suggestions to the largest active room in branch scope', async () => {
    const prisma = createCalculationPrisma();
    prisma.classroom.findMany.mockResolvedValue([
      { capacity: 8 },
      { capacity: 12 },
    ]);
    prisma.user.findMany.mockResolvedValue(
      Array.from({ length: 25 }, (_, index) => ({
        id: `student-${index}`,
        currentAllowedCourseId: course.id,
        studentProfile: null,
      })),
    );
    const service = new SchedulingDemandCalculationService(prisma as never);

    const result = await service.calculateDemand(currentUser, {
      termId: 'term-1',
      branchId: 'branch-1',
      maxStudentsPerClass: 14,
    });

    expect(result.maxAvailableRoomCapacity).toBe(12);
    expect(result.effectiveCapacityLimit).toBe(12);
    expect(result.warnings).toContain('CLASS_LIMIT_CLAMPED');
    expect(
      result.courses[0]?.suggestedClasses.map((item) => item.capacity),
    ).toEqual([9, 8, 8]);
    expect(prisma.classroom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ branchId: 'branch-1' }, { branchId: null }],
        }),
      }),
    );
  });

  it('keeps calculating when there are no rooms and reports the warning', async () => {
    const prisma = createCalculationPrisma();
    prisma.classroom.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'student-1',
        currentAllowedCourseId: course.id,
        studentProfile: null,
      },
    ]);
    const service = new SchedulingDemandCalculationService(prisma as never);

    const result = await service.calculateDemand(currentUser, {
      termId: 'term-1',
      maxStudentsPerClass: 14,
    });

    expect(result.maxAvailableRoomCapacity).toBeNull();
    expect(result.effectiveCapacityLimit).toBe(14);
    expect(result.warnings).toEqual(['NO_ACTIVE_CLASSROOMS']);
  });

  it.each(['ENROLLED', 'PENDING_PAYMENT', 'PENDING_APPROVAL'] as const)(
    'excludes target-term students with %s status from the same course',
    async (status) => {
      const prisma = createCalculationPrisma();
      prisma.enrollment.findMany.mockResolvedValueOnce([
        { studentId: 'student-1', class: { courseId: course.id }, status },
      ]);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          currentAllowedCourseId: course.id,
          studentProfile: null,
        },
      ]);
      const service = new SchedulingDemandCalculationService(prisma as never);

      const result = await service.calculateDemand(currentUser, {
        termId: 'term-1',
      });

      expect(result.totalEligibleStudents).toBe(0);
      expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: ['ENROLLED', 'PENDING_PAYMENT', 'PENDING_APPROVAL'],
            },
          }),
        }),
      );
    },
  );

  it('rejects cross-tenant term access', async () => {
    const prisma = createCalculationPrisma();
    prisma.term.findUniqueOrThrow.mockResolvedValue({
      id: 'term-2',
      title: 'Other',
      startDate: new Date(),
      instituteId: 'institute-2',
    });
    const service = new SchedulingDemandCalculationService(prisma as never);

    await expect(
      service.calculateDemand(currentUser, { termId: 'term-2' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('application', () => {
    const demand = {
      courses: [
        { courseId: course.id, eligibleStudentsCount: 20 },
        { courseId: 'course-2', eligibleStudentsCount: 0 },
      ],
    } as TermDemandReportDto;

    const createApplicationContext = () => {
      const transactionClassRequirement = {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 'requirement-1' })
          .mockResolvedValueOnce({ id: 'requirement-2' }),
      };
      const prisma = {
        branch: { findMany: jest.fn().mockResolvedValue([{ id: 'branch-1' }]) },
        classRequirement: {
          findMany: jest.fn().mockResolvedValue([
            {
              courseId: course.id,
              sessionsPerWeek: 2,
              totalSessions: null,
            },
          ]),
          count: jest.fn().mockResolvedValue(2),
        },
        $transaction: jest.fn((callback) =>
          callback({ classRequirement: transactionClassRequirement }),
        ),
      };
      const calculation = {
        resolveInstituteForTerm: jest
          .fn()
          .mockResolvedValue({ instituteId: 'institute-1' }),
        calculateDemand: jest.fn().mockResolvedValue(demand),
      };
      const service = new SchedulingDemandApplicationService(
        prisma as never,
        calculation as never,
      );
      return {
        service,
        prisma,
        calculation,
        transactionClassRequirement,
      };
    };

    it('replaces active requirements and creates one historical-safe row per class', async () => {
      const { service, transactionClassRequirement } =
        createApplicationContext();

      const result = await service.applyDemand(currentUser, {
        termId: 'term-1',
        acknowledgeShortfall: false,
        items: [
          {
            courseId: course.id,
            classes: [{ capacity: 10 }, { capacity: 10 }],
            deliveryMode: 'IN_PERSON',
            sessionDurationMinutes: 90,
          },
          {
            courseId: 'course-2',
            classes: [],
            deliveryMode: 'IN_PERSON',
            sessionDurationMinutes: 90,
          },
        ],
      });

      expect(transactionClassRequirement.updateMany).toHaveBeenCalledWith({
        where: {
          instituteId: 'institute-1',
          termId: 'term-1',
          OR: [{ branchId: 'branch-1' }, { branchId: null }],
          isActive: true,
        },
        data: { isActive: false },
      });
      expect(transactionClassRequirement.create).toHaveBeenCalledTimes(2);
      expect(transactionClassRequirement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requiredClassCount: 1,
            capacity: 10,
            sessionsPerWeek: 2,
          }),
        }),
      );
      expect(result).toEqual({
        createdCount: 2,
        deactivatedCount: 2,
        totalRequirements: 2,
        requirementIds: ['requirement-1', 'requirement-2'],
      });
    });

    it('requires explicit acknowledgement when reviewed seats leave a shortfall', async () => {
      const { service, prisma } = createApplicationContext();

      await expect(
        service.applyDemand(currentUser, {
          termId: 'term-1',
          acknowledgeShortfall: false,
          items: [
            {
              courseId: course.id,
              classes: [{ capacity: 14 }],
              deliveryMode: 'IN_PERSON',
              sessionDurationMinutes: 90,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a class capacity above the available classroom ceiling', async () => {
      const { service, prisma, calculation } = createApplicationContext();
      calculation.calculateDemand.mockResolvedValue({
        ...demand,
        maxAvailableRoomCapacity: 12,
      });

      await expect(
        service.applyDemand(currentUser, {
          termId: 'term-1',
          acknowledgeShortfall: true,
          items: [
            {
              courseId: course.id,
              classes: [{ capacity: 14 }],
              deliveryMode: 'IN_PERSON',
              sessionDurationMinutes: 90,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});

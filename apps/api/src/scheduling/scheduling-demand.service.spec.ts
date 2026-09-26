import { Test, TestingModule } from '@nestjs/testing';
import { type JwtPayload } from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingDemandService } from './scheduling-demand.service';

describe('SchedulingDemandService', () => {
  let service: SchedulingDemandService;
  let prisma: {
    term: {
      findUniqueOrThrow: jest.Mock;
      findFirst: jest.Mock;
      findFirstOrThrow?: jest.Mock;
    };
    course: { findMany: jest.Mock };
    enrollment: { findMany: jest.Mock };
    user: { findMany: jest.Mock };
    classRequirement: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    branch: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const mockUser: JwtPayload = {
    sub: 'user-admin-1',
    phone: '09120000002',
    role: 'ADMIN',
    instituteId: 'inst-1',
    permissions: [],
  };

  beforeEach(async () => {
    prisma = {
      term: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'term-fall',
          title: 'ترم پاییز ۱۴۰۳',
          startDate: new Date('2024-09-22T00:00:00.000Z'),
          instituteId: 'inst-1',
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'term-fall',
          title: 'ترم پاییز ۱۴۰۳',
          startDate: new Date('2024-09-22T00:00:00.000Z'),
          instituteId: 'inst-1',
        }),
      },
      course: { findMany: jest.fn() },
      enrollment: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn() },
      classRequirement: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      branch: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingDemandService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SchedulingDemandService>(SchedulingDemandService);
  });

  describe('resolvePrecedingTerm', () => {
    it('returns the immediately preceding term when previous terms exist', async () => {
      const preceding = { id: 'term-summer', title: 'ترم تابستان ۱۴۰۳' };
      prisma.term.findFirst.mockResolvedValue(preceding);

      const targetDate = new Date('2024-09-22T00:00:00.000Z');
      const result = await (service as any).resolvePrecedingTerm(
        'inst-1',
        targetDate,
      );

      expect(prisma.term.findFirst).toHaveBeenCalledWith({
        where: {
          instituteId: 'inst-1',
          startDate: {
            lt: targetDate,
          },
        },
        orderBy: {
          startDate: 'desc',
        },
        select: {
          id: true,
          title: true,
        },
      });
      expect(result).toEqual(preceding);
    });

    it('returns null gracefully when no preceding term exists', async () => {
      prisma.term.findFirst.mockResolvedValue(null);

      const targetDate = new Date('2024-01-01T00:00:00.000Z');
      const result = await (service as any).resolvePrecedingTerm(
        'inst-1',
        targetDate,
      );

      expect(result).toBeNull();
    });
  });

  describe('calculateDemand', () => {
    it('calculates demand correctly with auto-progression and placement tests', async () => {
      prisma.term.findUniqueOrThrow.mockResolvedValue({
        id: 'term-fall',
        title: 'ترم پاییز ۱۴۰۳',
        startDate: new Date('2024-09-22T00:00:00.000Z'),
        instituteId: 'inst-1',
      });
      prisma.term.findFirst.mockResolvedValue({
        id: 'term-summer',
        title: 'ترم تابستان ۱۴۰۳',
      });

      const courseStarter1 = {
        id: 'course-1',
        title: 'Starter 1',
        baseFee: 1000000,
        prerequisiteId: null,
        prerequisite: null,
      };

      const courseStarter2 = {
        id: 'course-2',
        title: 'Starter 2',
        baseFee: 1200000,
        prerequisiteId: 'course-1',
        prerequisite: { id: 'course-1', title: 'Starter 1' },
      };

      prisma.course.findMany.mockResolvedValue([
        courseStarter1,
        courseStarter2,
      ]);

      // student-1 was in course-1 in preceding term (Summer)
      prisma.enrollment.findMany.mockResolvedValue([
        {
          student: {
            id: 'student-1',
            studentProfile: {
              schoolShift: 'MORNING',
              dayPreference: 'EVEN_DAYS',
            },
          },
          class: { courseId: 'course-1' },
        },
      ]);

      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          currentAllowedCourseId: 'course-2',
          studentProfile: {
            schoolShift: 'MORNING',
            dayPreference: 'EVEN_DAYS',
          },
        },
        {
          id: 'student-2',
          currentAllowedCourseId: 'course-2',
          studentProfile: {
            schoolShift: 'AFTERNOON',
            dayPreference: 'ODD_DAYS',
          },
        },
        {
          id: 'student-3',
          currentAllowedCourseId: 'course-1',
          studentProfile: {
            schoolShift: 'FLEXIBLE',
            dayPreference: 'ANY',
          },
        },
      ]);

      prisma.classRequirement.findMany.mockResolvedValue([]);

      const result = await service.calculateDemand(mockUser, {
        termId: 'term-fall',
        defaultCapacity: 14,
      });

      expect(result.termId).toBe('term-fall');
      expect(result.currentTermId).toBe('term-summer');
      expect(result.totalEligibleStudents).toBe(3);
      expect(result.totalContinuingStudents).toBe(1);
      expect(result.totalNewPlacements).toBe(2);
      expect(result.courses).toHaveLength(2);

      const starter2Summary = result.courses.find(
        (c) => c.courseId === 'course-2',
      );
      expect(starter2Summary).toBeDefined();
      expect(starter2Summary?.eligibleStudentsCount).toBe(2);
      expect(starter2Summary?.passedPrerequisiteCount).toBe(1);
      expect(starter2Summary?.continuingStudentsCount).toBe(1);
      expect(starter2Summary?.newPlacementCount).toBe(1);
      expect(starter2Summary?.morningShiftCount).toBe(1);
      expect(starter2Summary?.afternoonShiftCount).toBe(1);
      expect(starter2Summary?.evenDaysPreferenceCount).toBe(1);
      expect(starter2Summary?.oddDaysPreferenceCount).toBe(1);
      expect(starter2Summary?.suggestedClassCount).toBe(1);

      const starter1Summary = result.courses.find(
        (c) => c.courseId === 'course-1',
      );
      expect(starter1Summary).toBeDefined();
      expect(starter1Summary?.eligibleStudentsCount).toBe(1);
      expect(starter1Summary?.continuingStudentsCount).toBe(0);
      expect(starter1Summary?.newPlacementCount).toBe(1);
      expect(starter1Summary?.flexibleShiftCount).toBe(1);
      expect(starter1Summary?.anyDayPreferenceCount).toBe(1);
    });

    it('does not project graduating students into any course when course has no next course', async () => {
      prisma.term.findUniqueOrThrow.mockResolvedValue({
        id: 'term-fall',
        title: 'ترم پاییز ۱۴۰۳',
        startDate: new Date('2024-09-22T00:00:00.000Z'),
        instituteId: 'inst-1',
      });
      prisma.term.findFirst.mockResolvedValue({
        id: 'term-summer',
        title: 'ترم تابستان ۱۴۰۳',
      });

      const courseGraduating = {
        id: 'course-advanced',
        title: 'Advanced 3',
        baseFee: 2000000,
        prerequisiteId: null,
        prerequisite: null,
      };

      prisma.course.findMany.mockResolvedValue([courseGraduating]);

      // student-grad is in course-advanced in Summer (no course has prerequisiteId === 'course-advanced')
      prisma.enrollment.findMany.mockResolvedValue([
        {
          student: {
            id: 'student-grad',
            studentProfile: {
              schoolShift: 'MORNING',
              dayPreference: 'EVEN_DAYS',
            },
          },
          class: { courseId: 'course-advanced' },
        },
      ]);

      // No new placement students
      prisma.user.findMany.mockResolvedValue([]);
      prisma.classRequirement.findMany.mockResolvedValue([]);

      const result = await service.calculateDemand(mockUser, {
        termId: 'term-fall',
        defaultCapacity: 14,
      });

      expect(result.totalContinuingStudents).toBe(0);
      expect(result.totalNewPlacements).toBe(0);
      expect(result.totalEligibleStudents).toBe(0);
      expect(result.courses[0].continuingStudentsCount).toBe(0);
      expect(result.courses[0].newPlacementCount).toBe(0);
      expect(result.courses[0].eligibleStudentsCount).toBe(0);
    });

    it('handles first term with null preceding term by counting only new placements', async () => {
      prisma.term.findUniqueOrThrow.mockResolvedValue({
        id: 'term-first',
        title: 'ترم اول مؤسسه',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        instituteId: 'inst-1',
      });
      prisma.term.findFirst.mockResolvedValue(null);

      const courseStarter = {
        id: 'course-1',
        title: 'Starter 1',
        baseFee: 1000000,
        prerequisiteId: null,
        prerequisite: null,
      };

      prisma.course.findMany.mockResolvedValue([courseStarter]);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-new',
          currentAllowedCourseId: 'course-1',
          studentProfile: {
            schoolShift: 'MORNING',
            dayPreference: 'EVEN_DAYS',
          },
        },
      ]);
      prisma.classRequirement.findMany.mockResolvedValue([]);

      const result = await service.calculateDemand(mockUser, {
        termId: 'term-first',
        defaultCapacity: 14,
      });

      expect(result.currentTermId).toBeNull();
      expect(result.totalContinuingStudents).toBe(0);
      expect(result.totalNewPlacements).toBe(1);
      expect(result.totalEligibleStudents).toBe(1);
      expect(result.courses[0].continuingStudentsCount).toBe(0);
      expect(result.courses[0].newPlacementCount).toBe(1);
    });

    it('guarantees an active student in preceding term is never counted as a new placement (zero double-counting)', async () => {
      prisma.term.findUniqueOrThrow.mockResolvedValue({
        id: 'term-fall',
        title: 'ترم پاییز ۱۴۰۳',
        startDate: new Date('2024-09-22T00:00:00.000Z'),
        instituteId: 'inst-1',
      });
      prisma.term.findFirst.mockResolvedValue({
        id: 'term-summer',
        title: 'ترم تابستان ۱۴۰۳',
      });

      const course1 = {
        id: 'course-1',
        title: 'Level 1',
        baseFee: 1000000,
        prerequisiteId: null,
        prerequisite: null,
      };
      const course2 = {
        id: 'course-2',
        title: 'Level 2',
        baseFee: 1200000,
        prerequisiteId: 'course-1',
        prerequisite: { id: 'course-1', title: 'Level 1' },
      };

      prisma.course.findMany.mockResolvedValue([course1, course2]);

      // student-active is enrolled in Level 1 in Summer
      prisma.enrollment.findMany.mockResolvedValue([
        {
          student: {
            id: 'student-active',
            studentProfile: {
              schoolShift: 'MORNING',
              dayPreference: 'EVEN_DAYS',
            },
          },
          class: { courseId: 'course-1' },
        },
      ]);

      // Both student-active and student-placed have currentAllowedCourseId = course-2
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-active',
          currentAllowedCourseId: 'course-2',
          studentProfile: {
            schoolShift: 'MORNING',
            dayPreference: 'EVEN_DAYS',
          },
        },
        {
          id: 'student-placed',
          currentAllowedCourseId: 'course-2',
          studentProfile: {
            schoolShift: 'AFTERNOON',
            dayPreference: 'ODD_DAYS',
          },
        },
      ]);

      prisma.classRequirement.findMany.mockResolvedValue([]);

      const result = await service.calculateDemand(mockUser, {
        termId: 'term-fall',
        defaultCapacity: 14,
      });

      const level2 = result.courses.find((c) => c.courseId === 'course-2');
      expect(level2).toBeDefined();
      expect(level2?.continuingStudentsCount).toBe(1); // student-active
      expect(level2?.newPlacementCount).toBe(1); // student-placed only
      expect(level2?.eligibleStudentsCount).toBe(2); // strictly 2, not 3
      expect(result.totalEligibleStudents).toBe(2);
      expect(result.totalContinuingStudents).toBe(1);
      expect(result.totalNewPlacements).toBe(1);
    });
  });

  describe('applyDemand', () => {
    it('creates or updates class requirements in a transaction', async () => {
      prisma.$transaction.mockImplementation((callback) => {
        const tx = {
          classRequirement: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'req-new' }),
            update: jest.fn().mockResolvedValue({ id: 'req-updated' }),
          },
        };
        return callback(tx);
      });

      prisma.classRequirement.count.mockResolvedValue(1);

      const result = await service.applyDemand(mockUser, {
        termId: 'term-fall',
        items: [
          {
            courseId: 'course-2',
            requiredClassCount: 2,
            capacity: 14,
            deliveryMode: 'IN_PERSON',
            sessionDurationMinutes: 90,
          },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.createdCount).toBe(1);
      expect(result.totalRequirements).toBe(1);
    });
  });
});

import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  calculateUncoveredStudents,
  suggestBalancedClassCapacities,
  type CalculateTermDemandInput,
  type CourseDemandSummaryDto,
  type JwtPayload,
  type TermDemandReportDto,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  summarizeStudentPreferences,
  type StudentPreferences,
} from './scheduling-demand-calculation.helpers';

const ACTIVE_ENROLLMENT_STATUSES = [
  'ENROLLED',
  'PENDING_PAYMENT',
  'PENDING_APPROVAL',
] as const;

@Injectable()
export class SchedulingDemandCalculationService {
  private readonly logger = new Logger(SchedulingDemandCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveInstituteForTerm(
    currentUser: JwtPayload,
    termId: string,
    targetInstituteId?: string,
  ) {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
      select: { id: true, title: true, startDate: true, instituteId: true },
    });
    const isCrossTenant =
      (currentUser.role !== 'SUPER_ADMIN' &&
        term.instituteId !== currentUser.instituteId) ||
      (targetInstituteId !== undefined &&
        targetInstituteId !== term.instituteId);
    if (isCrossTenant) throw new ForbiddenException();

    return { term, instituteId: term.instituteId };
  }

  resolvePrecedingTerm(instituteId: string, targetTermStartDate: Date) {
    return this.prisma.term.findFirst({
      where: { instituteId, startDate: { lt: targetTermStartDate } },
      orderBy: { startDate: 'desc' },
      select: { id: true, title: true },
    });
  }

  async calculateDemand(
    currentUser: JwtPayload,
    input: CalculateTermDemandInput,
  ): Promise<TermDemandReportDto> {
    const { term, instituteId } = await this.resolveInstituteForTerm(
      currentUser,
      input.termId,
      input.instituteId,
    );
    const precedingTerm = await this.resolvePrecedingTerm(
      instituteId,
      term.startDate,
    );
    const branchScope = input.branchId
      ? { OR: [{ branchId: input.branchId }, { branchId: null }] }
      : {};

    const courses = await this.prisma.course.findMany({
      where: { instituteId },
      include: { prerequisite: { select: { id: true, title: true } } },
      orderBy: { title: 'asc' },
    });
    const courseIds = courses.map((course) => course.id);
    const precedingEnrollments = precedingTerm
      ? await this.prisma.enrollment.findMany({
          where: {
            class: {
              termId: precedingTerm.id,
              instituteId,
              ...branchScope,
            },
            status: { in: [...ACTIVE_ENROLLMENT_STATUSES] },
            student: { isActive: true },
          },
          include: {
            class: { select: { courseId: true } },
            student: {
              select: {
                id: true,
                studentProfile: {
                  select: { schoolShift: true, dayPreference: true },
                },
              },
            },
          },
        })
      : [];
    const targetTermEnrollments = await this.prisma.enrollment.findMany({
      where: {
        class: { termId: term.id, instituteId, ...branchScope },
        status: { in: [...ACTIVE_ENROLLMENT_STATUSES] },
        student: { isActive: true },
      },
      select: { studentId: true, class: { select: { courseId: true } } },
    });
    const students = await this.prisma.user.findMany({
      where: {
        instituteId,
        role: 'STUDENT',
        isActive: true,
        currentAllowedCourseId: { in: courseIds },
        ...branchScope,
      },
      include: {
        studentProfile: {
          select: { schoolShift: true, dayPreference: true },
        },
      },
    });
    const existingRequirements = await this.prisma.classRequirement.findMany({
      where: {
        instituteId,
        termId: input.termId,
        isActive: true,
        ...(input.branchId
          ? { OR: [{ branchId: input.branchId }, { branchId: null }] }
          : { branchId: null }),
      },
    });
    const classrooms = await this.prisma.classroom.findMany({
      where: { instituteId, isActive: true, ...branchScope },
      select: { capacity: true },
    });

    const maxStudentsPerClass = input.maxStudentsPerClass ?? 14;
    const maxAvailableRoomCapacity = classrooms.reduce<number | null>(
      (maximum, classroom) =>
        maximum === null
          ? classroom.capacity
          : Math.max(maximum, classroom.capacity),
      null,
    );
    const effectiveCapacityLimit = maxAvailableRoomCapacity
      ? Math.min(maxStudentsPerClass, maxAvailableRoomCapacity)
      : maxStudentsPerClass;
    const warnings: TermDemandReportDto['warnings'] = [];
    if (maxAvailableRoomCapacity === null)
      warnings.push('NO_ACTIVE_CLASSROOMS');
    if (
      maxAvailableRoomCapacity !== null &&
      maxAvailableRoomCapacity < maxStudentsPerClass
    ) {
      warnings.push('CLASS_LIMIT_CLAMPED');
    }

    const alreadyEnrolledByCourse = new Map<string, Set<string>>();
    for (const enrollment of targetTermEnrollments) {
      const studentIds =
        alreadyEnrolledByCourse.get(enrollment.class.courseId) ?? new Set();
      studentIds.add(enrollment.studentId);
      alreadyEnrolledByCourse.set(enrollment.class.courseId, studentIds);
    }
    const precedingStudentIds = new Set(
      precedingEnrollments.map((enrollment) => enrollment.student.id),
    );
    const continuingByCourse = new Map<string, Map<string, StudentPreferences>>(
      courses.map((course) => [course.id, new Map()]),
    );
    const nextCoursesByPrerequisite = new Map<string, string[]>();
    for (const course of courses) {
      if (!course.prerequisiteId) continue;
      const nextCourses =
        nextCoursesByPrerequisite.get(course.prerequisiteId) ?? [];
      nextCourses.push(course.id);
      nextCoursesByPrerequisite.set(course.prerequisiteId, nextCourses);
    }
    for (const enrollment of precedingEnrollments) {
      for (const nextCourseId of nextCoursesByPrerequisite.get(
        enrollment.class.courseId,
      ) ?? []) {
        if (
          alreadyEnrolledByCourse.get(nextCourseId)?.has(enrollment.student.id)
        ) {
          continue;
        }
        continuingByCourse.get(nextCourseId)?.set(enrollment.student.id, {
          schoolShift: enrollment.student.studentProfile?.schoolShift,
          dayPreference: enrollment.student.studentProfile?.dayPreference,
        });
      }
    }

    const summaries = courses.map((course) => {
      const continuing =
        continuingByCourse.get(course.id) ??
        new Map<string, StudentPreferences>();
      const placed = students.filter(
        (student) =>
          student.currentAllowedCourseId === course.id &&
          !precedingStudentIds.has(student.id) &&
          !alreadyEnrolledByCourse.get(course.id)?.has(student.id),
      );
      const preferences: StudentPreferences[] = [
        ...continuing.values(),
        ...placed.map((student): StudentPreferences => ({
          schoolShift: student.studentProfile?.schoolShift,
          dayPreference: student.studentProfile?.dayPreference,
        })),
      ];
      const eligibleStudentsCount = continuing.size + placed.length;
      const capacities = suggestBalancedClassCapacities(
        eligibleStudentsCount,
        effectiveCapacityLimit,
      );
      const suggestedClasses = capacities.map((capacity, index) => ({
        key: `${course.id}:${index + 1}`,
        capacity,
      }));
      const plannedCapacity = capacities.reduce(
        (sum, capacity) => sum + capacity,
        0,
      );
      const requirements = existingRequirements.filter(
        (requirement) => requirement.courseId === course.id,
      );

      return {
        courseId: course.id,
        courseTitle: course.title,
        baseFee: course.baseFee,
        prerequisiteId: course.prerequisiteId,
        prerequisiteTitle: course.prerequisite?.title ?? null,
        eligibleStudentsCount,
        passedPrerequisiteCount: continuing.size,
        continuingStudentsCount: continuing.size,
        newPlacementCount: placed.length,
        ...summarizeStudentPreferences(preferences),
        suggestedClassCount: suggestedClasses.length,
        suggestedClasses,
        plannedCapacity,
        uncoveredStudentCount: calculateUncoveredStudents(
          eligibleStudentsCount,
          capacities,
        ),
        existingRequirementId: requirements[0]?.id ?? null,
        currentRequirementClassCount:
          requirements.length > 0
            ? requirements.reduce(
                (sum, requirement) => sum + requirement.requiredClassCount,
                0,
              )
            : null,
        sessionsPerWeek: requirements[0]?.sessionsPerWeek ?? 3,
      } satisfies CourseDemandSummaryDto;
    });

    summaries.sort((left, right) => {
      const leftActive =
        left.eligibleStudentsCount > 0 || left.existingRequirementId !== null;
      const rightActive =
        right.eligibleStudentsCount > 0 || right.existingRequirementId !== null;
      if (leftActive !== rightActive) return leftActive ? -1 : 1;
      return right.eligibleStudentsCount - left.eligibleStudentsCount;
    });
    const sum = (selector: (course: CourseDemandSummaryDto) => number) =>
      summaries.reduce((total, course) => total + selector(course), 0);
    const report: TermDemandReportDto = {
      termId: term.id,
      termTitle: term.title,
      currentTermId: precedingTerm?.id ?? null,
      branchId: input.branchId ?? null,
      maxStudentsPerClass,
      maxAvailableRoomCapacity,
      effectiveCapacityLimit,
      warnings,
      totalEligibleStudents: sum((course) => course.eligibleStudentsCount),
      totalContinuingStudents: sum((course) => course.continuingStudentsCount),
      totalNewPlacements: sum((course) => course.newPlacementCount),
      totalSuggestedClasses: sum((course) => course.suggestedClassCount),
      totalPlannedCapacity: sum((course) => course.plannedCapacity),
      totalUncoveredStudents: sum((course) => course.uncoveredStudentCount),
      courses: summaries,
    };

    this.logger.log(
      `Calculated demand for term "${term.title}" (${term.id}): ${report.totalEligibleStudents} eligible students, ${report.totalSuggestedClasses} suggested classes`,
    );
    return report;
  }
}

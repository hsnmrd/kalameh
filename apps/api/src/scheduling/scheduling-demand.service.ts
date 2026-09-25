import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  type ApplyTermDemandInput,
  type ApplyTermDemandResult,
  type CalculateTermDemandInput,
  type CourseDemandSummaryDto,
  type JwtPayload,
  type TermDemandReportDto,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulingDemandService {
  private readonly logger = new Logger(SchedulingDemandService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveInstituteForTerm(
    currentUser: JwtPayload,
    termId: string,
    targetInstituteId?: string,
  ): Promise<{
    term: { id: string; title: string; startDate: Date };
    instituteId: string;
  }> {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
      select: {
        id: true,
        title: true,
        startDate: true,
        instituteId: true,
      },
    });

    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      term.instituteId !== currentUser.instituteId
    ) {
      throw new ForbiddenException();
    }

    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : term.instituteId;

    return { term, instituteId };
  }

  private async resolvePrecedingTerm(
    instituteId: string,
    targetTermStartDate: Date,
  ): Promise<{ id: string; title: string } | null> {
    const precedingTerm = await this.prisma.term.findFirst({
      where: {
        instituteId,
        startDate: {
          lt: targetTermStartDate,
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

    return precedingTerm;
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

    const courses = await this.prisma.course.findMany({
      where: { instituteId },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const courseIds = courses.map((c) => c.id);

    const activeEnrollments = precedingTerm
      ? await this.prisma.enrollment.findMany({
          where: {
            class: {
              termId: precedingTerm.id,
              instituteId,
              ...(input.branchId
                ? { OR: [{ branchId: input.branchId }, { branchId: null }] }
                : {}),
            },
            status: { in: ['ENROLLED', 'PENDING_PAYMENT', 'PENDING_APPROVAL'] },
            student: {
              isActive: true,
            },
          },
          include: {
            class: {
              select: {
                courseId: true,
              },
            },
            student: {
              select: {
                id: true,
                studentProfile: {
                  select: {
                    schoolShift: true,
                    dayPreference: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const enrolledStudentIdsInCurrentTerm = new Set(
      activeEnrollments.map((e) => e.student.id),
    );

    const continuingStudentsByCourseId = new Map<
      string,
      Map<
        string,
        {
          schoolShift?: string | null;
          dayPreference?: string | null;
        }
      >
    >();

    for (const course of courses) {
      continuingStudentsByCourseId.set(course.id, new Map());
    }

    for (const enrollment of activeEnrollments) {
      const currentCourseId = enrollment.class.courseId;
      const nextCourses = courses.filter(
        (c) => c.prerequisiteId === currentCourseId,
      );

      for (const nextCourse of nextCourses) {
        const studentMap = continuingStudentsByCourseId.get(nextCourse.id);
        if (studentMap && !studentMap.has(enrollment.student.id)) {
          studentMap.set(enrollment.student.id, {
            schoolShift: enrollment.student.studentProfile?.schoolShift,
            dayPreference: enrollment.student.studentProfile?.dayPreference,
          });
        }
      }
    }

    const students = await this.prisma.user.findMany({
      where: {
        instituteId,
        role: 'STUDENT',
        isActive: true,
        currentAllowedCourseId: { in: courseIds },
        ...(input.branchId
          ? { OR: [{ branchId: input.branchId }, { branchId: null }] }
          : {}),
      },
      include: {
        studentProfile: {
          select: {
            schoolShift: true,
            dayPreference: true,
          },
        },
      },
    });

    const existingRequirements = await this.prisma.classRequirement.findMany({
      where: {
        instituteId,
        termId: input.termId,
        isActive: true,
        ...(input.branchId ? { branchId: input.branchId } : {}),
      },
    });

    const defaultCapacity = input.defaultCapacity || 14;

    const courseSummaries: CourseDemandSummaryDto[] = courses.map((course) => {
      const continuingMap =
        continuingStudentsByCourseId.get(course.id) ?? new Map();
      const continuingStudentsCount = continuingMap.size;

      const placedStudents = students.filter(
        (s) =>
          s.currentAllowedCourseId === course.id &&
          !enrolledStudentIdsInCurrentTerm.has(s.id),
      );
      const newPlacementCount = placedStudents.length;

      const eligibleCount = continuingStudentsCount + newPlacementCount;

      let morningShift = 0;
      let afternoonShift = 0;
      let flexibleShift = 0;
      let evenDays = 0;
      let oddDays = 0;
      let anyDay = 0;

      for (const profile of continuingMap.values()) {
        const shift = profile.schoolShift ?? 'FLEXIBLE';
        if (shift === 'MORNING') morningShift++;
        else if (shift === 'AFTERNOON') afternoonShift++;
        else flexibleShift++;

        const pref = profile.dayPreference ?? 'ANY';
        if (pref === 'EVEN_DAYS') evenDays++;
        else if (pref === 'ODD_DAYS') oddDays++;
        else anyDay++;
      }

      for (const student of placedStudents) {
        const shift = student.studentProfile?.schoolShift ?? 'FLEXIBLE';
        if (shift === 'MORNING') morningShift++;
        else if (shift === 'AFTERNOON') afternoonShift++;
        else flexibleShift++;

        const pref = student.studentProfile?.dayPreference ?? 'ANY';
        if (pref === 'EVEN_DAYS') evenDays++;
        else if (pref === 'ODD_DAYS') oddDays++;
        else anyDay++;
      }

      const suggestedClassCount =
        eligibleCount > 0
          ? Math.max(1, Math.ceil(eligibleCount / defaultCapacity))
          : 0;

      const existingReq = existingRequirements.find(
        (r) => r.courseId === course.id,
      );

      return {
        courseId: course.id,
        courseTitle: course.title,
        baseFee: course.baseFee,
        prerequisiteId: course.prerequisiteId,
        prerequisiteTitle: course.prerequisite?.title ?? null,
        eligibleStudentsCount: eligibleCount,
        passedPrerequisiteCount: continuingStudentsCount,
        continuingStudentsCount,
        newPlacementCount,
        morningShiftCount: morningShift,
        afternoonShiftCount: afternoonShift,
        flexibleShiftCount: flexibleShift,
        evenDaysPreferenceCount: evenDays,
        oddDaysPreferenceCount: oddDays,
        anyDayPreferenceCount: anyDay,
        suggestedClassCount,
        suggestedCapacity: defaultCapacity,
        suggestedInPersonCount: suggestedClassCount,
        suggestedOnlineCount: 0,
        existingRequirementId: existingReq?.id ?? null,
        currentRequirementClassCount: existingReq?.requiredClassCount ?? null,
        sessionsPerWeek:
          existingReq?.sessionsPerWeek ?? (evenDays >= oddDays ? 3 : 2),
      };
    });

    courseSummaries.sort((a, b) => {
      const aActive =
        a.eligibleStudentsCount > 0 || a.existingRequirementId !== null;
      const bActive =
        b.eligibleStudentsCount > 0 || b.existingRequirementId !== null;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return b.eligibleStudentsCount - a.eligibleStudentsCount;
    });

    const totalEligibleStudents = courseSummaries.reduce(
      (sum, c) => sum + c.eligibleStudentsCount,
      0,
    );
    const totalContinuingStudents = courseSummaries.reduce(
      (sum, c) => sum + c.continuingStudentsCount,
      0,
    );
    const totalNewPlacements = courseSummaries.reduce(
      (sum, c) => sum + c.newPlacementCount,
      0,
    );
    const totalSuggestedClasses = courseSummaries.reduce(
      (sum, c) => sum + c.suggestedClassCount,
      0,
    );

    this.logger.log(
      `Calculated demand for term "${term.title}" (${term.id}): ${totalEligibleStudents} eligible students, ${totalSuggestedClasses} suggested classes across ${courseSummaries.length} courses`,
    );

    return {
      termId: term.id,
      termTitle: term.title,
      currentTermId: precedingTerm?.id ?? null,
      branchId: input.branchId ?? null,
      defaultCapacity,
      totalEligibleStudents,
      totalContinuingStudents,
      totalNewPlacements,
      totalSuggestedClasses,
      courses: courseSummaries,
    };
  }

  async applyDemand(
    currentUser: JwtPayload,
    input: ApplyTermDemandInput,
  ): Promise<ApplyTermDemandResult> {
    const { instituteId } = await this.resolveInstituteForTerm(
      currentUser,
      input.termId,
      input.instituteId,
    );

    const activeBranches = await this.prisma.branch.findMany({
      where: { instituteId, isActive: true },
      select: { id: true },
    });
    const targetBranchId =
      input.branchId ??
      (activeBranches.length === 1 ? activeBranches[0].id : null);

    let createdCount = 0;
    let updatedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const existing = await tx.classRequirement.findFirst({
          where: {
            instituteId,
            termId: input.termId,
            courseId: item.courseId,
            ...(targetBranchId
              ? { OR: [{ branchId: targetBranchId }, { branchId: null }] }
              : { branchId: null }),
          },
        });

        const sessionsPerWeek =
          item.sessionsPerWeek ??
          existing?.sessionsPerWeek ??
          (item.totalSessions || existing?.totalSessions ? null : 2);
        const totalSessions =
          item.totalSessions ??
          (sessionsPerWeek ? null : (existing?.totalSessions ?? null));

        if (existing) {
          await tx.classRequirement.update({
            where: { id: existing.id },
            data: {
              branchId: targetBranchId,
              requiredClassCount: item.requiredClassCount,
              capacity: item.capacity,
              deliveryMode: item.deliveryMode,
              sessionDurationMinutes: item.sessionDurationMinutes,
              sessionsPerWeek,
              totalSessions,
              isActive: true,
            },
          });
          updatedCount++;
        } else {
          await tx.classRequirement.create({
            data: {
              instituteId,
              termId: input.termId,
              courseId: item.courseId,
              branchId: targetBranchId,
              requiredClassCount: item.requiredClassCount,
              capacity: item.capacity,
              deliveryMode: item.deliveryMode,
              sessionDurationMinutes: item.sessionDurationMinutes,
              sessionsPerWeek,
              totalSessions,
              isActive: true,
            },
          });
          updatedCount++;
        }
      }
    });

    const totalRequirements = await this.prisma.classRequirement.count({
      where: {
        instituteId,
        termId: input.termId,
        isActive: true,
        ...(input.branchId ? { branchId: input.branchId } : {}),
      },
    });

    this.logger.log(
      `Applied term demand for term ${input.termId}: ${createdCount} created, ${updatedCount} updated, ${totalRequirements} total active requirements`,
    );

    return {
      createdCount,
      updatedCount,
      totalRequirements,
    };
  }
}

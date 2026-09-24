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
  ): Promise<{ term: { id: string; title: string }; instituteId: string }> {
    const term = await this.prisma.term.findUniqueOrThrow({
      where: { id: termId },
      select: {
        id: true,
        title: true,
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

  async calculateDemand(
    currentUser: JwtPayload,
    input: CalculateTermDemandInput,
  ): Promise<TermDemandReportDto> {
    const { term, instituteId } = await this.resolveInstituteForTerm(
      currentUser,
      input.termId,
      input.instituteId,
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
        enrollments: {
          where: { isPassed: true },
          include: {
            class: {
              select: {
                courseId: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
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
      const eligibleStudents = students.filter(
        (s) => s.currentAllowedCourseId === course.id,
      );
      const eligibleCount = eligibleStudents.length;

      let passedPrereqCount = 0;
      let newPlacementCount = 0;

      for (const student of eligibleStudents) {
        const hasPassedPrereq = course.prerequisiteId
          ? student.enrollments.some(
              (e) =>
                e.class.courseId === course.prerequisiteId &&
                e.isPassed === true,
            )
          : false;

        if (hasPassedPrereq) {
          passedPrereqCount++;
        } else {
          newPlacementCount++;
        }
      }

      let morningShift = 0;
      let afternoonShift = 0;
      let flexibleShift = 0;
      let evenDays = 0;
      let oddDays = 0;
      let anyDay = 0;

      for (const student of eligibleStudents) {
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
        passedPrerequisiteCount: passedPrereqCount,
        continuingStudentsCount: passedPrereqCount,
        newPlacementCount: newPlacementCount,
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
      currentTermId: null,
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

    let createdCount = 0;
    let updatedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const existing = await tx.classRequirement.findFirst({
          where: {
            instituteId,
            termId: input.termId,
            courseId: item.courseId,
            branchId: input.branchId ?? null,
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
              branchId: input.branchId ?? null,
              requiredClassCount: item.requiredClassCount,
              capacity: item.capacity,
              deliveryMode: item.deliveryMode,
              sessionDurationMinutes: item.sessionDurationMinutes,
              sessionsPerWeek,
              totalSessions,
              isActive: true,
            },
          });
          createdCount++;
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

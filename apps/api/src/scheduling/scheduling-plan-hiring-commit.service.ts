import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  CommitHiringPlanInputSchema,
  ROLES,
  calculateTermScheduleFromDateRange,
  type CommitHiringPlanInput,
  type JwtPayload,
  type SchedulingPlanDetailsDto,
  type SupportedLocale,
  type WeekDay,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';

const editablePlanStatuses = ['DRAFT', 'SELECTED'] as const;

@Injectable()
export class SchedulingPlanHiringCommitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
    private readonly planQueryService: SchedulingPlanQueryService,
  ) {}

  async commit(
    currentUser: JwtPayload,
    planId: string,
    rawInput: CommitHiringPlanInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    committedAt = new Date(),
  ): Promise<SchedulingPlanDetailsDto> {
    const input = CommitHiringPlanInputSchema.parse(rawInput);
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );

    const plan = await this.prisma.schedulingPlan.findFirstOrThrow({
      where: {
        id: planId,
        instituteId,
        status: { in: [...editablePlanStatuses] },
        run: { instituteId, status: 'COMPLETED' },
      },
      select: {
        id: true,
        runId: true,
        firstReviewStartedAt: true,
        run: {
          select: {
            termId: true,
            term: {
              select: {
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    const requirementIds = Array.from(
      new Set(input.assignments.map((assignment) => assignment.requirementId)),
    );
    const classroomIds = Array.from(
      new Set(
        input.assignments
          .map((assignment) => assignment.classroomId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const [requirements, classrooms, unresolvedRecords] = await Promise.all([
      this.prisma.classRequirement.findMany({
        where: { id: { in: requirementIds }, instituteId },
        select: {
          id: true,
          courseId: true,
          branchId: true,
          capacity: true,
          deliveryMode: true,
          course: { select: { id: true, title: true } },
        },
      }),
      this.prisma.classroom.findMany({
        where: { id: { in: classroomIds }, instituteId, isActive: true },
        select: { id: true, name: true, capacity: true, branchId: true },
      }),
      this.prisma.schedulingUnresolvedRequirement.findMany({
        where: {
          planId: plan.id,
          instituteId,
          classRequirementId: { in: requirementIds },
        },
        select: { id: true, classRequirementId: true, missingClassCount: true },
      }),
    ]);

    const requirementMap = new Map(requirements.map((req) => [req.id, req]));
    const classroomMap = new Map(classrooms.map((room) => [room.id, room]));
    const unresolvedMap = new Map(
      unresolvedRecords
        .filter((rec) => rec.classRequirementId !== null)
        .map((rec) => [rec.classRequirementId!, rec]),
    );

    for (const assignment of input.assignments) {
      const requirement = requirementMap.get(assignment.requirementId);
      if (!requirement) {
        throw new BadRequestException(
          `Class requirement not found: ${assignment.requirementId}`,
        );
      }
      if (assignment.startTime >= assignment.endTime) {
        throw new ConflictException(
          'Assignment start time must precede end time',
        );
      }
      if (assignment.deliveryMode === 'IN_PERSON' && !assignment.classroomId) {
        throw new BadRequestException(
          'In-person class assignment requires an available physical classroom',
        );
      }
      if (assignment.classroomId) {
        const classroom = classroomMap.get(assignment.classroomId);
        if (!classroom) {
          throw new BadRequestException(
            `Classroom not found or inactive: ${assignment.classroomId}`,
          );
        }
      }
    }

    const termDates = plan.run.term;
    const termStartDate = termDates.startDate;
    const termEndDate = termDates.endDate;

    await this.prisma.$transaction(async (transaction) => {
      for (const assignment of input.assignments) {
        const requirement = requirementMap.get(assignment.requirementId)!;

        const createdProposal = await transaction.schedulingProposal.create({
          data: {
            instituteId,
            planId: plan.id,
            classRequirementId: assignment.requirementId,
            courseId: assignment.courseId,
            branchId: requirement.branchId,
            teacherId: null,
            classroomId: assignment.classroomId ?? null,
            teacherQualificationId: null,
            qualificationCheckedAt: null,
            title: requirement.course.title,
            capacity: requirement.capacity,
            deliveryMode: assignment.deliveryMode,
            daysOfWeek: assignment.daysOfWeek,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            isLocked: false,
            isManuallyEdited: true,
            editCount: 1,
          },
          select: { id: true },
        });

        if (termStartDate && termEndDate) {
          const schedule = calculateTermScheduleFromDateRange({
            startDate: termStartDate,
            endDate: termEndDate,
            daysOfWeek: assignment.daysOfWeek,
            skipHolidays: true,
            observeOfficialHolidays: true,
          });

          if (schedule.sessionDates.length > 0) {
            await transaction.schedulingProposalSession.createMany({
              data: schedule.sessionDates.map((dateStr) => ({
                instituteId,
                planId: plan.id,
                proposalId: createdProposal.id,
                sessionDate: new Date(dateStr),
                startTime: assignment.startTime,
                endTime: assignment.endTime,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      // Decrement or delete corresponding unresolved requirements
      const countsByRequirementId = new Map<string, number>();
      for (const assignment of input.assignments) {
        const current =
          countsByRequirementId.get(assignment.requirementId) ?? 0;
        countsByRequirementId.set(assignment.requirementId, current + 1);
      }

      for (const [reqId, count] of countsByRequirementId.entries()) {
        const unresolved = unresolvedMap.get(reqId);
        if (!unresolved) continue;

        if (unresolved.missingClassCount <= count) {
          await transaction.schedulingUnresolvedRequirement.delete({
            where: { id: unresolved.id },
          });
        } else {
          await transaction.schedulingUnresolvedRequirement.update({
            where: { id: unresolved.id },
            data: { missingClassCount: unresolved.missingClassCount - count },
          });
        }
      }

      // Touch plan
      await transaction.schedulingPlan.update({
        where: { id: plan.id },
        data: {
          updatedAt: committedAt,
          firstReviewStartedAt: plan.firstReviewStartedAt ?? committedAt,
        },
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: plan.id,
      action: 'HIRING_PLAN_COMMITTED',
      metadata: {
        committedAssignmentsCount: input.assignments.length,
        runId: plan.runId,
      },
    });

    return this.planQueryService.findOne(
      currentUser,
      plan.id,
      requestedInstituteId,
      locale,
    );
  }

  private resolveInstituteId(
    currentUser: JwtPayload,
    requestedInstituteId: string | undefined,
    locale: SupportedLocale,
  ): string {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (!requestedInstituteId) {
        throw new BadRequestException(
          this.i18n.t('scheduling.instituteRequired', locale),
        );
      }
      return requestedInstituteId;
    }
    return currentUser.instituteId;
  }
}

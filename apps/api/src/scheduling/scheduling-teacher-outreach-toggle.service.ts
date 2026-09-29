import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  findHigherLevelCourse,
  ROLES,
  ToggleTeacherOutreachInputSchema,
  type JwtPayload,
  type SchedulingPlanDetailsDto,
  type SupportedLocale,
  type ToggleTeacherOutreachInput,
  type WeekDay,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';
import {
  buildOutreachSelectionReasons,
  buildUpdatedUnresolvedDetails,
  createProposalSessionsForTerm,
  readAcceptedOutreachRecords,
  removeAcceptedOutreachInTransaction,
  type AcceptedTeacherOutreachRecord,
} from './scheduling-teacher-outreach.types';

const editablePlanStatuses = ['DRAFT', 'SELECTED'] as const;

@Injectable()
export class SchedulingTeacherOutreachToggleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
    private readonly planQueryService: SchedulingPlanQueryService,
  ) {}

  async toggle(
    currentUser: JwtPayload,
    planId: string,
    rawInput: ToggleTeacherOutreachInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    changedAt = new Date(),
  ): Promise<SchedulingPlanDetailsDto> {
    const input = ToggleTeacherOutreachInputSchema.parse(rawInput);
    if (input.startTime >= input.endTime) {
      throw new ConflictException('Outreach start time must precede end time');
    }
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );

    const [plan, unresolved] = await Promise.all([
      this.prisma.schedulingPlan.findFirstOrThrow({
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
          proposals: {
            where: { instituteId },
            select: {
              id: true,
              teacherId: true,
              classroomId: true,
              daysOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
          run: {
            select: {
              termId: true,
              term: { select: { startDate: true, endDate: true } },
            },
          },
        },
      }),
      this.prisma.schedulingUnresolvedRequirement.findFirstOrThrow({
        where: {
          id: input.unresolvedRequirementId,
          planId,
          instituteId,
        },
        select: {
          id: true,
          classRequirementId: true,
          missingClassCount: true,
          details: true,
          classRequirement: {
            select: {
              id: true,
              courseId: true,
              branchId: true,
              capacity: true,
              deliveryMode: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      }),
    ]);

    const requirement = unresolved.classRequirement;
    if (!requirement) {
      throw new BadRequestException(
        `Class requirement not found: ${unresolved.id}`,
      );
    }

    const proposalIds = new Set(plan.proposals.map(({ id }) => id));
    const existingAccepted = readAcceptedOutreachRecords(
      unresolved.details,
    ).filter((rec) => proposalIds.has(rec.proposalId));
    const targetAccepted = existingAccepted.find(
      (rec) => rec.optionKey === input.optionKey,
    );

    if (targetAccepted) {
      await this.prisma.$transaction(async (tx) => {
        await removeAcceptedOutreachInTransaction(
          tx,
          instituteId,
          plan.id,
          targetAccepted,
        );
        await tx.schedulingUnresolvedRequirement.update({
          where: { id: unresolved.id },
          data: {
            missingClassCount: unresolved.missingClassCount + 1,
            details: buildUpdatedUnresolvedDetails(
              unresolved.details,
              existingAccepted.filter(
                (rec) => rec.optionKey !== targetAccepted.optionKey,
              ),
            ),
          },
        });
        await tx.schedulingPlan.update({
          where: { id: plan.id },
          data: {
            updatedAt: changedAt,
            firstReviewStartedAt: plan.firstReviewStartedAt ?? changedAt,
          },
        });
      });

      await this.auditLogsService.log({
        instituteId,
        userId: currentUser.sub,
        module: 'SCHEDULING',
        entityId: plan.id,
        action: 'TEACHER_OUTREACH_REVERTED',
        metadata: {
          runId: plan.runId,
          unresolvedRequirementId: unresolved.id,
          optionKey: input.optionKey,
          teacherId: targetAccepted.teacher.id,
          proposalId: targetAccepted.proposalId,
        },
      });
      return this.planQueryService.findOne(
        currentUser,
        plan.id,
        requestedInstituteId,
        locale,
      );
    }

    const swappedOut =
      unresolved.missingClassCount === 0
        ? existingAccepted[existingAccepted.length - 1]
        : undefined;
    if (unresolved.missingClassCount === 0 && !swappedOut) {
      throw new ConflictException(
        'All missing classes for this requirement are already resolved',
      );
    }

    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id: input.teacherId,
        instituteId,
        role: ROLES.TEACHER,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherProfile: {
          select: {
            id: true,
            availabilities: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
              },
            },
            teachableCourses: {
              where: { instituteId },
              select: {
                id: true,
                courseId: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!teacher.teacherProfile) {
      throw new BadRequestException('Selected teacher is not qualified');
    }

    const directQualification = teacher.teacherProfile.teachableCourses.find(
      (item) => !item.courseId || item.courseId === requirement.courseId,
    );
    let higherLevelCourseTitle: string | null = null;
    if (!directQualification) {
      const allCourses = this.prisma.course?.findMany
        ? await this.prisma.course.findMany({
            where: { instituteId },
            select: { id: true, title: true, prerequisiteId: true },
          })
        : [];
      const teacherCourses = teacher.teacherProfile.teachableCourses
        .map(
          (tc) =>
            tc.course ?? allCourses.find((course) => course.id === tc.courseId),
        )
        .filter((c): c is NonNullable<typeof c> => Boolean(c));
      const higherCourse = findHigherLevelCourse(
        requirement.course,
        teacherCourses,
        allCourses,
      );
      if (!higherCourse) {
        throw new BadRequestException('Selected teacher is not qualified');
      }
      higherLevelCourseTitle = higherCourse.title;
    }

    const chosenClassroom =
      input.deliveryMode === 'ONLINE'
        ? null
        : await this.resolveClassroom(
            instituteId,
            requirement,
            input,
            plan.proposals.filter(({ id }) => id !== swappedOut?.proposalId),
          );

    const createdProposalId = await this.prisma.$transaction(async (tx) => {
      if (swappedOut) {
        await removeAcceptedOutreachInTransaction(
          tx,
          instituteId,
          plan.id,
          swappedOut,
        );
      }
      let qualificationId = directQualification?.id;
      let createdQualificationId: string | null = null;
      if (!qualificationId) {
        const createdQual = await tx.teacherCourseQualification.create({
          data: {
            instituteId,
            teacherProfileId: teacher.teacherProfile!.id,
            courseId: requirement.courseId,
          },
          select: { id: true },
        });
        qualificationId = createdQual.id;
        createdQualificationId = createdQual.id;
      }

      const createdAvailabilityIds: string[] = [];
      for (const dayOfWeek of input.daysOfWeek) {
        const covered = teacher.teacherProfile!.availabilities.some(
          (slot) =>
            !swappedOut?.createdAvailabilityIds.includes(slot.id) &&
            slot.dayOfWeek === dayOfWeek &&
            slot.startTime <= input.startTime &&
            slot.endTime >= input.endTime,
        );
        if (!covered) {
          const created = await tx.teacherAvailability.create({
            data: {
              teacherProfileId: teacher.teacherProfile!.id,
              dayOfWeek,
              startTime: input.startTime,
              endTime: input.endTime,
            },
            select: { id: true },
          });
          createdAvailabilityIds.push(created.id);
        }
      }

      const createdProposal = await tx.schedulingProposal.create({
        data: {
          instituteId,
          planId: plan.id,
          classRequirementId: requirement.id,
          courseId: requirement.courseId,
          branchId: requirement.branchId,
          teacherId: teacher.id,
          classroomId:
            input.deliveryMode === 'ONLINE'
              ? null
              : (chosenClassroom?.id ?? null),
          teacherQualificationId: qualificationId,
          qualificationCheckedAt: changedAt,
          title: requirement.course.title,
          capacity: requirement.capacity,
          deliveryMode: input.deliveryMode,
          daysOfWeek: input.daysOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          isLocked: false,
          isManuallyEdited: true,
          editCount: 1,
          selectionReasons: buildOutreachSelectionReasons(input),
        },
        select: { id: true },
      });

      await createProposalSessionsForTerm(tx, {
        instituteId,
        planId: plan.id,
        proposalId: createdProposal.id,
        startDate: plan.run.term.startDate,
        endDate: plan.run.term.endDate,
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      });

      const baseAccepted = swappedOut
        ? existingAccepted.filter(
            (rec) => rec.optionKey !== swappedOut.optionKey,
          )
        : existingAccepted;
      const nextRecord: AcceptedTeacherOutreachRecord = {
        optionKey: input.optionKey,
        proposalId: createdProposal.id,
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
        },
        deliveryMode: input.deliveryMode,
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        availabilityChangeDays: input.availabilityChangeDays,
        availableClassrooms: chosenClassroom ? [chosenClassroom] : [],
        createdAvailabilityIds,
        ...(createdQualificationId ? { createdQualificationId } : {}),
        ...(higherLevelCourseTitle ? { higherLevelCourseTitle } : {}),
      };

      await tx.schedulingUnresolvedRequirement.update({
        where: { id: unresolved.id },
        data: {
          missingClassCount: swappedOut
            ? unresolved.missingClassCount
            : Math.max(0, unresolved.missingClassCount - 1),
          details: buildUpdatedUnresolvedDetails(unresolved.details, [
            ...baseAccepted,
            nextRecord,
          ]),
        },
      });
      await tx.schedulingPlan.update({
        where: { id: plan.id },
        data: {
          updatedAt: changedAt,
          firstReviewStartedAt: plan.firstReviewStartedAt ?? changedAt,
        },
      });
      return createdProposal.id;
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: plan.id,
      action: 'TEACHER_OUTREACH_ACCEPTED',
      metadata: {
        runId: plan.runId,
        unresolvedRequirementId: unresolved.id,
        optionKey: input.optionKey,
        teacherId: teacher.id,
        proposalId: createdProposalId,
      },
    });
    return this.planQueryService.findOne(
      currentUser,
      plan.id,
      requestedInstituteId,
      locale,
    );
  }

  private async resolveClassroom(
    instituteId: string,
    requirement: { branchId: string | null; capacity: number },
    input: ToggleTeacherOutreachInput,
    activeProposals: Array<{
      classroomId: string | null;
      daysOfWeek: string[];
      startTime: string;
      endTime: string;
    }>,
  ): Promise<{ id: string; name: string; capacity: number }> {
    const rooms = await this.prisma.classroom.findMany({
      where: {
        instituteId,
        isActive: true,
        ...(input.classroomId ? { id: input.classroomId } : {}),
      },
      select: { id: true, name: true, capacity: true, branchId: true },
      orderBy: [{ capacity: 'asc' }, { name: 'asc' }],
    });
    const freeRoom = rooms.find(
      (room) =>
        room.capacity >= requirement.capacity &&
        (requirement.branchId === null ||
          room.branchId === null ||
          room.branchId === requirement.branchId) &&
        !activeProposals.some(
          (p) =>
            p.classroomId === room.id &&
            p.daysOfWeek.some((d) => input.daysOfWeek.includes(d as WeekDay)) &&
            p.startTime < input.endTime &&
            input.startTime < p.endTime,
        ),
    );
    if (!freeRoom) {
      throw new ConflictException(
        'No compatible physical classroom is available',
      );
    }
    return {
      id: freeRoom.id,
      name: freeRoom.name,
      capacity: freeRoom.capacity,
    };
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

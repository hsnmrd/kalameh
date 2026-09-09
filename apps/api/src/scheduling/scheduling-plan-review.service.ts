import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@workspace/database';
import {
  SchedulingPlanSelectionResultSchema,
  SchedulingProposalSchema,
  ROLES,
  SetSchedulingProposalLockSchema,
  UpdateSchedulingProposalSchema,
  type JwtPayload,
  type SchedulingPlanSelectionResult,
  type SchedulingProposalDto,
  type SetSchedulingProposalLockInput,
  type SupportedLocale,
  type UpdateSchedulingProposalInput,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

const editablePlanStatuses = ['DRAFT', 'SELECTED'] as const;

@Injectable()
export class SchedulingPlanReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
  ) {}

  async selectPlan(
    currentUser: JwtPayload,
    planId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    selectedAt = new Date(),
  ): Promise<SchedulingPlanSelectionResult> {
    this.assertValidDate(selectedAt);
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
      select: { id: true, runId: true, firstReviewStartedAt: true },
    });

    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.schedulingPlan.updateMany({
        where: {
          instituteId,
          runId: plan.runId,
          status: 'SELECTED',
          id: { not: plan.id },
        },
        data: { status: 'DRAFT', selectedAt: null },
      });
      const selected = await transaction.schedulingPlan.updateMany({
        where: {
          id: plan.id,
          instituteId,
          runId: plan.runId,
          status: { in: [...editablePlanStatuses] },
        },
        data: {
          status: 'SELECTED',
          selectedAt,
          firstReviewStartedAt: plan.firstReviewStartedAt ?? selectedAt,
        },
      });
      if (selected.count !== 1) {
        throw new ConflictException('scheduling plan is no longer selectable');
      }

      return SchedulingPlanSelectionResultSchema.parse({
        planId: plan.id,
        runId: plan.runId,
        status: 'SELECTED',
        selectedAt,
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: plan.id,
      action: 'PLAN_SELECTED',
      metadata: { runId: plan.runId },
    });
    return result;
  }

  async setProposalLock(
    currentUser: JwtPayload,
    planId: string,
    proposalId: string,
    rawInput: SetSchedulingProposalLockInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    changedAt = new Date(),
  ): Promise<SchedulingProposalDto> {
    this.assertValidDate(changedAt);
    const input = SetSchedulingProposalLockSchema.parse(rawInput);
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const proposal = await this.findEditableProposal(
      instituteId,
      planId,
      proposalId,
    );

    const updated = await this.prisma.$transaction(async (transaction) => {
      await this.touchPlan(
        transaction,
        instituteId,
        planId,
        proposal.plan.firstReviewStartedAt,
        changedAt,
      );
      const changed = await transaction.schedulingProposal.updateMany({
        where: {
          id: proposalId,
          planId,
          instituteId,
          publishedClassId: null,
        },
        data: input.isLocked
          ? {
              isLocked: true,
              lockedByUserId: currentUser.sub,
              lockedAt: changedAt,
            }
          : { isLocked: false, lockedByUserId: null, lockedAt: null },
      });
      if (changed.count !== 1) {
        throw new ConflictException(
          'scheduling proposal is no longer editable',
        );
      }
      return transaction.schedulingProposal.findFirstOrThrow({
        where: { id: proposalId, planId, instituteId },
        include: { sessions: { orderBy: { sessionDate: 'asc' } } },
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: proposalId,
      action: input.isLocked ? 'PROPOSAL_LOCKED' : 'PROPOSAL_UNLOCKED',
      metadata: { planId },
    });
    return SchedulingProposalSchema.parse(updated);
  }

  async updateProposal(
    currentUser: JwtPayload,
    planId: string,
    proposalId: string,
    rawInput: UpdateSchedulingProposalInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    changedAt = new Date(),
  ): Promise<SchedulingProposalDto> {
    this.assertValidDate(changedAt);
    const input = UpdateSchedulingProposalSchema.parse(rawInput);
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const proposal = await this.findEditableProposal(
      instituteId,
      planId,
      proposalId,
    );
    const merged = {
      title: input.title ?? proposal.title,
      teacherId: input.teacherId ?? proposal.teacherId,
      branchId:
        input.branchId !== undefined ? input.branchId : proposal.branchId,
      classroomId:
        input.classroomId !== undefined
          ? input.classroomId
          : proposal.classroomId,
      capacity: input.capacity ?? proposal.capacity,
      deliveryMode: input.deliveryMode ?? proposal.deliveryMode,
      daysOfWeek: input.daysOfWeek ?? proposal.daysOfWeek,
      startTime: input.startTime ?? proposal.startTime,
      endTime: input.endTime ?? proposal.endTime,
    };
    if (merged.startTime >= merged.endTime) {
      throw new ConflictException('proposal time range is invalid');
    }
    if (
      (merged.deliveryMode === 'ONLINE' && merged.classroomId !== null) ||
      (merged.deliveryMode === 'IN_PERSON' && merged.classroomId === null)
    ) {
      throw new ConflictException('proposal delivery location is invalid');
    }

    const [qualification, , classroom] = await Promise.all([
      this.prisma.teacherCourseQualification.findFirstOrThrow({
        where: {
          instituteId,
          courseId: proposal.courseId,
          teacherProfile: {
            userId: merged.teacherId,
            user: {
              instituteId,
              role: 'TEACHER',
              isActive: true,
            },
          },
        },
        select: { id: true },
      }),
      merged.branchId
        ? this.prisma.branch.findFirstOrThrow({
            where: {
              id: merged.branchId,
              instituteId,
              isActive: true,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      merged.classroomId
        ? this.prisma.classroom.findFirstOrThrow({
            where: {
              id: merged.classroomId,
              instituteId,
              isActive: true,
            },
            select: { id: true, branchId: true, capacity: true },
          })
        : Promise.resolve(null),
    ]);
    if (
      (classroom && classroom.capacity < merged.capacity) ||
      (classroom &&
        merged.branchId !== null &&
        classroom.branchId !== null &&
        classroom.branchId !== merged.branchId)
    ) {
      throw new ConflictException('proposal classroom is incompatible');
    }

    const changedFields = Object.keys(input).sort();
    const updated = await this.prisma.$transaction(async (transaction) => {
      await this.touchPlan(
        transaction,
        instituteId,
        planId,
        proposal.plan.firstReviewStartedAt,
        changedAt,
        true,
        proposal.plan.metricsSnapshot,
      );
      const changed = await transaction.schedulingProposal.updateMany({
        where: {
          id: proposalId,
          planId,
          instituteId,
          publishedClassId: null,
        },
        data: {
          ...merged,
          teacherQualificationId: qualification.id,
          qualificationCheckedAt: changedAt,
          score: null,
          scoreBreakdown: this.toJson({}),
          selectionReasons: this.toJson([
            { code: 'MANUALLY_SELECTED', evidence: { changedFields } },
          ]),
          scoredAt: null,
          isManuallyEdited: true,
          editCount: { increment: 1 },
          warnings: this.toJson([
            {
              code: 'MANUAL_EDIT_REQUIRES_VALIDATION',
              severity: 'WARNING',
              scope: 'PROPOSAL',
              context: { changedFields },
            },
          ]),
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException(
          'scheduling proposal is no longer editable',
        );
      }
      return transaction.schedulingProposal.findFirstOrThrow({
        where: { id: proposalId, planId, instituteId },
        include: { sessions: { orderBy: { sessionDate: 'asc' } } },
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: proposalId,
      action: 'PROPOSAL_UPDATED',
      metadata: { planId, changedFields },
    });
    return SchedulingProposalSchema.parse(updated);
  }

  private findEditableProposal(
    instituteId: string,
    planId: string,
    proposalId: string,
  ) {
    return this.prisma.schedulingProposal.findFirstOrThrow({
      where: {
        id: proposalId,
        planId,
        instituteId,
        publishedClassId: null,
        plan: {
          instituteId,
          status: { in: [...editablePlanStatuses] },
          run: { instituteId, status: 'COMPLETED' },
        },
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        teacherId: true,
        branchId: true,
        classroomId: true,
        capacity: true,
        deliveryMode: true,
        daysOfWeek: true,
        startTime: true,
        endTime: true,
        plan: {
          select: { firstReviewStartedAt: true, metricsSnapshot: true },
        },
      },
    });
  }

  private async touchPlan(
    transaction: Prisma.TransactionClient,
    instituteId: string,
    planId: string,
    firstReviewStartedAt: Date | null,
    changedAt: Date,
    invalidateScore = false,
    metricsSnapshot: Prisma.JsonValue = {},
  ): Promise<void> {
    const changed = await transaction.schedulingPlan.updateMany({
      where: {
        id: planId,
        instituteId,
        status: { in: [...editablePlanStatuses] },
        run: { instituteId, status: 'COMPLETED' },
      },
      data: {
        firstReviewStartedAt: firstReviewStartedAt ?? changedAt,
        ...(invalidateScore
          ? {
              earnedWeightedPoints: 0,
              applicableWeightedPoints: 0,
              qualityIndex: null,
              coveragePercent: null,
              minimumCourseCoveragePercent: null,
              scoreBreakdown: this.toJson({}),
              metricsSnapshot: this.toJson({
                ...this.jsonRecord(metricsSnapshot),
                validationStatus: 'STALE_AFTER_MANUAL_EDIT',
              }),
              manualEditCount: { increment: 1 },
            }
          : {}),
      },
    });
    if (changed.count !== 1) {
      throw new ConflictException('scheduling plan is no longer editable');
    }
  }

  private jsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private assertValidDate(value: Date): void {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError('review timestamp must be valid');
    }
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

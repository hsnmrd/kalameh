import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApplyTeacherReassignmentChainInputSchema,
  ROLES,
  type ApplyTeacherReassignmentChainInput,
  type JwtPayload,
  type SchedulingPlanDetailsDto,
  type SupportedLocale,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';

const editablePlanStatuses = ['DRAFT', 'SELECTED'] as const;

@Injectable()
export class SchedulingPlanReassignmentApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
    private readonly planQueryService: SchedulingPlanQueryService,
  ) {}

  async apply(
    currentUser: JwtPayload,
    planId: string,
    rawInput: ApplyTeacherReassignmentChainInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    appliedAt = new Date(),
  ): Promise<SchedulingPlanDetailsDto> {
    const input = ApplyTeacherReassignmentChainInputSchema.parse(rawInput);
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
      },
    });

    const proposalIds = input.reassignments.map((r) => r.proposalId);
    const proposals = await this.prisma.schedulingProposal.findMany({
      where: {
        id: { in: proposalIds },
        planId: plan.id,
        instituteId,
      },
      select: {
        id: true,
        courseId: true,
      },
    });
    if (proposals.length !== input.reassignments.length) {
      throw new BadRequestException(
        'One or more proposals in the reassignment chain were not found',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      // 1. Apply each reassignment step in the chain
      for (const step of input.reassignments) {
        const proposal = proposals.find((p) => p.id === step.proposalId);
        let teacherQualificationId: string | null = null;
        if (proposal) {
          const qual = await transaction.teacherCourseQualification.findFirst({
            where: {
              courseId: proposal.courseId,
              teacherProfile: { userId: step.toTeacherId },
            },
            select: { id: true },
          });
          teacherQualificationId = qual?.id ?? null;
        }

        await transaction.schedulingProposal.update({
          where: { id: step.proposalId },
          data: {
            teacherId: step.toTeacherId,
            teacherQualificationId,
            qualificationCheckedAt: teacherQualificationId ? appliedAt : null,
            isManuallyEdited: true,
            updatedAt: appliedAt,
          },
        });
      }

      // 2. If targetAssignment is provided and targets an unresolved requirement:
      if (input.targetAssignment && input.unresolvedRequirementId) {
        const unresolvedReq =
          await transaction.schedulingUnresolvedRequirement.findFirst({
            where: {
              id: input.unresolvedRequirementId,
              planId: plan.id,
              instituteId,
            },
            include: {
              classRequirement: {
                select: {
                  id: true,
                  courseId: true,
                  branchId: true,
                  capacity: true,
                  course: { select: { title: true } },
                },
              },
            },
          });

        if (unresolvedReq?.classRequirement) {
          const req = unresolvedReq.classRequirement;
          let teacherQualificationId: string | null = null;
          const qual = await transaction.teacherCourseQualification.findFirst({
            where: {
              courseId: req.courseId,
              teacherProfile: { userId: input.targetAssignment.teacherId },
            },
            select: { id: true },
          });
          teacherQualificationId = qual?.id ?? null;

          await transaction.schedulingProposal.create({
            data: {
              instituteId,
              planId: plan.id,
              classRequirementId: req.id,
              courseId: req.courseId,
              branchId: req.branchId,
              teacherId: input.targetAssignment.teacherId,
              classroomId: input.targetAssignment.classroomId ?? null,
              teacherQualificationId,
              qualificationCheckedAt: teacherQualificationId ? appliedAt : null,
              title: req.course.title,
              capacity: req.capacity,
              deliveryMode: input.targetAssignment.deliveryMode ?? 'IN_PERSON',
              daysOfWeek: input.targetAssignment.daysOfWeek ?? [
                'SATURDAY',
                'MONDAY',
                'WEDNESDAY',
              ],
              startTime: input.targetAssignment.startTime ?? '16:30',
              endTime: input.targetAssignment.endTime ?? '18:00',
              isLocked: false,
              isManuallyEdited: true,
            },
          });

          if (unresolvedReq.missingClassCount > 1) {
            await transaction.schedulingUnresolvedRequirement.update({
              where: { id: unresolvedReq.id },
              data: {
                missingClassCount: unresolvedReq.missingClassCount - 1,
                updatedAt: appliedAt,
              },
            });
          } else {
            await transaction.schedulingUnresolvedRequirement.delete({
              where: { id: unresolvedReq.id },
            });
          }
        }
      }

      await transaction.schedulingPlan.update({
        where: { id: plan.id },
        data: {
          updatedAt: appliedAt,
          firstReviewStartedAt: plan.firstReviewStartedAt ?? appliedAt,
        },
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: plan.id,
      action: 'REASSIGNMENT_CHAIN_APPLIED',
      metadata: {
        chainKey: input.chainKey,
        reassignmentsCount: input.reassignments.length,
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

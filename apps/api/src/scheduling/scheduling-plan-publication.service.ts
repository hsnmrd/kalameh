import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@workspace/database';
import {
  ROLES,
  SchedulingPlanPublicationResultSchema,
  isTermInActivationWindow,
  type JwtPayload,
  type SchedulingPlanPublicationResult,
  type SupportedLocale,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanValidationService } from './scheduling-plan-validation.service';

@Injectable()
export class SchedulingPlanPublicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: SchedulingPlanValidationService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
  ) {}

  async publish(
    currentUser: JwtPayload,
    planId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    publishedAt = new Date(),
  ): Promise<SchedulingPlanPublicationResult> {
    if (Number.isNaN(publishedAt.getTime())) {
      throw new RangeError('publication timestamp must be valid');
    }
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );

    try {
      const result = await this.prisma.client.$transaction(
        async (transaction) => {
          const validation = await this.validationService.validate(
            currentUser,
            planId,
            instituteId,
            locale,
            publishedAt,
            transaction,
            false,
          );
          if (!validation.isValid) {
            throw new ConflictException({
              code: 'HARD_CONSTRAINT_PUBLISH_BLOCKED',
              validation,
            });
          }

          const plan = await transaction.schedulingPlan.findFirstOrThrow({
            where: {
              id: planId,
              instituteId,
              status: 'SELECTED',
              run: { instituteId, status: 'COMPLETED' },
            },
            select: {
              id: true,
              runId: true,
              run: {
                select: {
                  termId: true,
                  term: { select: { startDate: true } },
                },
              },
              proposals: {
                where: { instituteId },
                select: {
                  id: true,
                  publishedClassId: true,
                  title: true,
                  courseId: true,
                  branchId: true,
                  classroomId: true,
                  teacherId: true,
                  capacity: true,
                  daysOfWeek: true,
                  startTime: true,
                  endTime: true,
                  course: { select: { baseFee: true } },
                  teacher: { select: { firstName: true, lastName: true } },
                  sessions: {
                    select: { sessionDate: true },
                    orderBy: { sessionDate: 'asc' },
                  },
                },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              },
            },
          });

          if (!isTermInActivationWindow(plan.run.term.startDate, publishedAt)) {
            throw new ConflictException({
              code: 'HARD_CONSTRAINT_PUBLISH_BLOCKED',
              message: this.i18n.t(
                'scheduling.termNotInActivationWindow',
                locale,
              ),
            });
          }
          if (
            plan.proposals.length === 0 ||
            plan.proposals.some(
              ({ publishedClassId }) => publishedClassId !== null,
            )
          ) {
            throw new ConflictException({
              code: 'HARD_CONSTRAINT_PUBLISH_BLOCKED',
              message:
                'selected plan does not contain a complete unpublished proposal set',
            });
          }

          const claimed = await transaction.schedulingPlan.updateMany({
            where: { id: plan.id, instituteId, status: 'SELECTED' },
            data: { status: 'PUBLISHED', publishedAt },
          });
          if (claimed.count !== 1) {
            throw new ConflictException(
              'scheduling plan is no longer publishable',
            );
          }

          const classItems = plan.proposals.map((proposal) => {
            const classId = randomUUID();
            return {
              classId,
              proposalId: proposal.id,
              classRow: {
                id: classId,
                instituteId,
                termId: plan.run.termId,
                courseId: proposal.courseId,
                branchId: proposal.branchId,
                classroomId: proposal.classroomId,
                title: proposal.title,
                capacity: proposal.capacity,
                fee: proposal.course.baseFee,
                teacherId: proposal.teacherId,
                teacherName: proposal.teacher
                  ? `${proposal.teacher.firstName} ${proposal.teacher.lastName}`.trim()
                  : null,
                schedule: null,
                daysOfWeek: proposal.daysOfWeek,
                sessionDates: proposal.sessions.map(({ sessionDate }) =>
                  sessionDate.toISOString().slice(0, 10),
                ),
                startTime: proposal.startTime,
                endTime: proposal.endTime,
              },
            };
          });

          if (transaction.class.createMany) {
            await transaction.class.createMany({
              data: classItems.map((item) => item.classRow),
            });
          } else {
            for (const item of classItems) {
              await transaction.class.create({
                data: item.classRow,
                select: { id: true },
              });
            }
          }

          await Promise.all(
            classItems.map(async ({ classId, proposalId }) => {
              const linked = await transaction.schedulingProposal.updateMany({
                where: {
                  id: proposalId,
                  planId: plan.id,
                  instituteId,
                  publishedClassId: null,
                },
                data: { publishedClassId: classId },
              });
              if (linked.count !== 1) {
                throw new ConflictException(
                  'scheduling proposal changed during publication',
                );
              }
            }),
          );

          const classIds = classItems.map((item) => item.classId);

          await transaction.schedulingPlan.updateMany({
            where: {
              instituteId,
              runId: plan.runId,
              id: { not: plan.id },
              status: { in: ['DRAFT', 'SELECTED'] },
            },
            data: { status: 'REJECTED', rejectedAt: publishedAt },
          });

          return SchedulingPlanPublicationResultSchema.parse({
            planId: plan.id,
            runId: plan.runId,
            status: 'PUBLISHED',
            classIds,
            proposalCount: plan.proposals.length,
            publishedAt,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await this.auditLogsService.log({
        instituteId,
        userId: currentUser.sub,
        module: 'SCHEDULING',
        entityId: planId,
        action: 'PLAN_PUBLISHED',
        metadata: {
          runId: result.runId,
          classIds: result.classIds,
          proposalCount: result.proposalCount,
        },
      });
      return result;
    } catch (error) {
      const response =
        error instanceof ConflictException ? error.getResponse() : null;
      if (
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        response.code === 'HARD_CONSTRAINT_PUBLISH_BLOCKED'
      ) {
        await this.auditLogsService.log({
          instituteId,
          userId: currentUser.sub,
          module: 'SCHEDULING',
          entityId: planId,
          action: 'PLAN_PUBLICATION_BLOCKED',
          metadata: { reason: 'HARD_CONSTRAINT_PUBLISH_BLOCKED' },
        });
      }
      throw error;
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

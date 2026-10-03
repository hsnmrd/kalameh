import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ROLES,
  SchedulingRunStatusSchema,
  type JwtPayload,
  type SchedulingRunStatusDto,
  type SupportedLocale,
} from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

const TERMINAL_RUN_STATUSES = new Set([
  'PREFLIGHT_FAILED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

@Injectable()
export class SchedulingRunQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findStatus(
    currentUser: JwtPayload,
    runId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<SchedulingRunStatusDto> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const run = await this.prisma.schedulingRun.findFirstOrThrow({
      where: { id: runId, instituteId },
      select: {
        id: true,
        status: true,
        preflightReport: true,
        failureCode: true,
        failureMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        plans: {
          select: { id: true, isRecommended: true },
          orderBy: [{ rank: 'asc' }, { id: 'asc' }],
        },
      },
    });
    const result =
      run.status === 'COMPLETED'
        ? {
            planIds: run.plans.map((plan) => plan.id),
            recommendedPlanId:
              run.plans.find((plan) => plan.isRecommended)?.id ?? null,
          }
        : null;

    return SchedulingRunStatusSchema.parse({
      runId: run.id,
      status: run.status,
      isTerminal: TERMINAL_RUN_STATUSES.has(run.status),
      result,
      preflightReport: run.preflightReport,
      failureCode: run.failureCode,
      failureMessage: run.failureMessage,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    });
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

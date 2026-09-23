import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ROLES,
  SchedulingTermSummaryDtoSchema,
  type JwtPayload,
  type SchedulingTermStatus,
  type SchedulingTermSummaryDto,
  type SupportedLocale,
} from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulingTermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async getTermsSummary(
    currentUser: JwtPayload,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<SchedulingTermSummaryDto[]> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );

    const terms = await this.prisma.term.findMany({
      where: { instituteId },
      include: {
        operatingPhase: {
          select: {
            id: true,
            title: true,
            slotDurationMinutes: true,
          },
        },
        classRequirements: {
          where: { isActive: true },
          select: { requiredClassCount: true },
        },
        _count: {
          select: { classes: true },
        },
        schedulingRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plans: {
              select: {
                id: true,
                status: true,
                isRecommended: true,
                rank: true,
              },
              orderBy: { rank: 'asc' },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return terms.map((term) => {
      const requirementsCount = term.classRequirements.length;
      const totalRequiredClasses = term.classRequirements.reduce(
        (sum, r) => sum + r.requiredClassCount,
        0,
      );
      const latestRun = term.schedulingRuns[0] ?? null;

      let schedulingStatus: SchedulingTermStatus = 'NO_REQUIREMENTS';
      if (
        latestRun?.status === 'GENERATING' ||
        latestRun?.status === 'QUEUED'
      ) {
        schedulingStatus = 'GENERATING';
      } else if (latestRun?.plans.some((p) => p.status === 'PUBLISHED')) {
        schedulingStatus = 'PUBLISHED';
      } else if (latestRun?.plans && latestRun.plans.length > 0) {
        schedulingStatus = 'SCHEDULED';
      } else if (requirementsCount > 0) {
        schedulingStatus = 'READY_TO_SCHEDULE';
      }

      return SchedulingTermSummaryDtoSchema.parse({
        id: term.id,
        title: term.title,
        startDate: term.startDate.toISOString(),
        endDate: term.endDate.toISOString(),
        isActive: term.isActive,
        operatingPhase: term.operatingPhase
          ? {
              id: term.operatingPhase.id,
              title: term.operatingPhase.title,
              slotDurationMinutes: term.operatingPhase.slotDurationMinutes,
            }
          : null,
        classesCount: term._count.classes,
        requirementsCount,
        totalRequiredClasses,
        schedulingStatus,
        latestRun: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              createdAt: latestRun.createdAt.toISOString(),
              plansCount: latestRun.plans.length,
            }
          : null,
      });
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

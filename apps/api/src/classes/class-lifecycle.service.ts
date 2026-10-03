import { BadRequestException, Injectable } from '@nestjs/common';
import type { JwtPayload, SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassQueryService } from './class-query.service';
@Injectable()
export class ClassLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly queries: ClassQueryService,
  ) {}
  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ success: boolean }> {
    const existing = await this.queries.findOne(id, currentUser, locale);

    const enrollmentsCount = await this.prisma.enrollment.count({
      where: { classId: id },
    });

    if (enrollmentsCount > 0) {
      throw new BadRequestException(
        this.i18n.t('classes.cannotDeleteWithEnrollments', locale),
      );
    }

    await this.prisma.class.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'CLASS',
      entityId: id,
      action: 'DELETE',
      metadata: {
        title: existing.title,
        termId: existing.termId,
        courseId: existing.courseId,
      },
    });

    return { success: true };
  }
}

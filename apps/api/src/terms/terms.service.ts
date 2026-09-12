import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { PreviewTermScheduleDto } from './dto/preview-term-schedule.dto';
import { BatchCreatePhaseTermsDto } from './dto/batch-create-phase-terms.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  calculateTermEndDate,
  calculateTermLifecycleStatus,
  isTermDeletable,
  generatePhaseTerms,
  gregorianToJalali,
  type JwtPayload,
  type SupportedLocale,
  type TermDto,
  type WeekDay,
} from '@workspace/types';

@Injectable()
export class TermsService {
  private readonly logger = new Logger(TermsService.name);

  private readonly operatingPhaseSelect = {
    select: {
      id: true,
      title: true,
      months: true,
      startTime: true,
      endTime: true,
      slotDurationMinutes: true,
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
    search?: string,
    isActive?: boolean,
    operatingPhaseId?: string,
    status?: string,
  ): Promise<TermDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : currentUser.instituteId;

    const terms = await this.prisma.term.findMany({
      where: {
        instituteId,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(operatingPhaseId ? { operatingPhaseId } : {}),
      },
      include: {
        _count: { select: { classes: true } },
        operatingPhase: this.operatingPhaseSelect,
      },
      orderBy: { startDate: 'desc' },
    });

    const mappedTerms = terms.map(({ _count, ...term }) => ({
      ...term,
      classesCount: _count.classes,
    }));

    const termsWithLifecycle = mappedTerms.map((term) => ({
      ...term,
      lifecycleStatus: calculateTermLifecycleStatus(term, mappedTerms),
    }));

    if (status && status !== 'ALL') {
      return termsWithLifecycle.filter((t) => t.lifecycleStatus === status);
    }

    return termsWithLifecycle;
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    void locale;
    const instituteId = currentUser.instituteId;

    const term = await this.prisma.term.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        _count: { select: { classes: true } },
        operatingPhase: this.operatingPhaseSelect,
      },
    });

    const { _count, ...data } = term;
    return {
      ...data,
      classesCount: _count.classes,
      lifecycleStatus: calculateTermLifecycleStatus(data),
    };
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ success: boolean }> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.instituteId;

    const term = await this.prisma.term.findFirstOrThrow({
      where: {
        id,
        ...(instituteId ? { instituteId } : {}),
      },
      include: {
        _count: { select: { classes: true } },
      },
    });

    const siblingTerms = await this.prisma.term.findMany({
      where: {
        instituteId: term.instituteId,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        isActive: true,
        operatingPhaseId: true,
      },
    });

    if (!isTermDeletable(term, siblingTerms)) {
      throw new BadRequestException(
        this.i18n.t('terms.cannotDeleteActiveTerm', locale),
      );
    }

    if (term._count.classes > 0) {
      throw new ConflictException(
        this.i18n.t('terms.cannotDeleteWithClasses', locale),
      );
    }

    await this.prisma.term.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: term.instituteId,
      userId: currentUser.sub,
      module: 'TERMS',
      entityId: id,
      action: 'DELETE',
      description: `ترم تحصیلی «${term.title}» حذف شد.`,
    });

    return { success: true };
  }

  async create(
    dto: CreateTermDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException(
        this.i18n.t('terms.invalidDateRange', locale),
      );
    }

    // Check duplicate title in same institute
    const existing = await this.prisma.term.findFirst({
      where: {
        instituteId,
        title: dto.title,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('terms.termAlreadyExists', locale),
      );
    }

    const created = await this.prisma.term.create({
      data: {
        instituteId,
        title: dto.title,
        startDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
        operatingPhaseId: dto.operatingPhaseId ?? null,
      },
      include: {
        _count: { select: { classes: true } },
        operatingPhase: this.operatingPhaseSelect,
      },
    });

    this.logger.log(
      `Term created: "${created.title}" (${created.id}) for institute ${instituteId} by user ${currentUser.sub} (${currentUser.role})`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'TERM',
      entityId: created.id,
      action: 'CREATE',
      metadata: {
        title: created.title,
        startDate: created.startDate,
        endDate: created.endDate,
        operatingPhaseId: created.operatingPhaseId,
      },
    });

    const { _count, ...data } = created;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }

  async update(
    id: string,
    dto: UpdateTermDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    const existing = await this.findOne(id, currentUser, locale);

    const start = dto.startDate
      ? new Date(dto.startDate)
      : new Date(existing.startDate);
    const end = dto.endDate
      ? new Date(dto.endDate)
      : new Date(existing.endDate);
    if (start >= end) {
      throw new BadRequestException(
        this.i18n.t('terms.invalidDateRange', locale),
      );
    }

    if (dto.title && dto.title !== existing.title) {
      const duplicate = await this.prisma.term.findFirst({
        where: {
          instituteId: existing.instituteId,
          title: dto.title,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('terms.termAlreadyExists', locale),
        );
      }
    }

    const updated = await this.prisma.term.update({
      where: {
        id,
        instituteId: existing.instituteId,
      },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.startDate ? { startDate: start } : {}),
        ...(dto.endDate ? { endDate: end } : {}),
        ...(typeof dto.isActive === 'boolean'
          ? { isActive: dto.isActive }
          : {}),
        ...(dto.operatingPhaseId !== undefined
          ? { operatingPhaseId: dto.operatingPhaseId }
          : {}),
      },
      include: {
        _count: { select: { classes: true } },
        operatingPhase: this.operatingPhaseSelect,
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'TERM',
      entityId: updated.id,
      action: 'UPDATE',
      metadata: dto as unknown as Record<string, unknown>,
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }

  previewSchedule(dto: PreviewTermScheduleDto) {
    return calculateTermEndDate({
      startDate: dto.startDate,
      targetDays: dto.targetDays ?? dto.targetSessions ?? 45,
      targetSessions: dto.targetSessions,
      daysOfWeek: dto.daysOfWeek,
      skipHolidays: dto.skipHolidays ?? true,
    });
  }

  async previewPhaseTerms(
    currentUser: JwtPayload,
    operatingPhaseId: string,
    jalaliYear: number,
    daysPerTerm: number,
    daysOfWeek?: WeekDay[],
    gapDays?: number,
    locale: SupportedLocale = 'fa',
  ) {
    const instituteId = currentUser.instituteId;
    const phase = await this.prisma.instituteOperatingPhase.findFirstOrThrow({
      where: {
        id: operatingPhaseId,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
    });

    // Check if terms already exist for this operating phase and academic year
    const existingPhaseTerms = await this.prisma.term.findMany({
      where: {
        instituteId,
        operatingPhaseId,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
      },
    });

    const isDuplicate = existingPhaseTerms.some((t) => {
      const startYear = gregorianToJalali(t.startDate).year;
      return startYear === jalaliYear;
    });

    if (isDuplicate) {
      throw new ConflictException(
        this.i18n.t('terms.duplicatePhaseYear', locale),
      );
    }

    return generatePhaseTerms({
      phase: {
        id: phase.id,
        title: phase.title,
        months: phase.months,
        daysOfWeek: phase.daysOfWeek as WeekDay[],
      },
      jalaliYear,
      daysPerTerm,
      sessionsPerTerm: daysPerTerm,
      daysOfWeek:
        daysOfWeek && daysOfWeek.length > 0
          ? daysOfWeek
          : (phase.daysOfWeek as WeekDay[]),
      gapDaysBetweenTerms: gapDays ?? 2,
    });
  }

  async batchCreatePhaseTerms(
    dto: BatchCreatePhaseTermsDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    // Verify operating phase existence for this tenant
    await this.prisma.instituteOperatingPhase.findFirstOrThrow({
      where: {
        id: dto.operatingPhaseId,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
    });

    if (!dto.terms || dto.terms.length === 0) {
      throw new BadRequestException('At least one term must be provided');
    }

    // Validate dates
    for (const t of dto.terms) {
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      if (s >= e) {
        throw new BadRequestException(
          this.i18n.t('terms.invalidDateRange', locale),
        );
      }
    }

    // Check duplicate titles within this institute
    const titles = dto.terms.map((t) => t.title);
    const existingTitles = await this.prisma.term.findMany({
      where: {
        instituteId,
        title: { in: titles },
      },
      select: { title: true },
    });

    if (existingTitles.length > 0) {
      throw new ConflictException(
        `${this.i18n.t('terms.termAlreadyExists', locale)}: ${existingTitles
          .map((t) => t.title)
          .join(', ')}`,
      );
    }

    const createdTerms = await this.prisma.$transaction(async (tx) => {
      const results: {
        id: string;
        instituteId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        operatingPhaseId: string | null;
        createdAt: Date;
        updatedAt: Date;
        _count: { classes: number };
        operatingPhase: {
          id: string;
          title: string;
          months: number[];
          startTime: string;
          endTime: string;
          slotDurationMinutes: number;
        } | null;
      }[] = [];
      for (const t of dto.terms!) {
        const created = await tx.term.create({
          data: {
            instituteId,
            title: t.title,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            operatingPhaseId: dto.operatingPhaseId,
            isActive: true,
          },
          include: {
            _count: { select: { classes: true } },
            operatingPhase: this.operatingPhaseSelect,
          },
        });
        results.push(created);
      }
      return results;
    });

    for (const created of createdTerms) {
      await this.auditLogsService.log({
        instituteId,
        userId: currentUser.sub,
        module: 'TERM',
        entityId: created.id,
        action: 'CREATE',
        metadata: {
          title: created.title,
          startDate: created.startDate,
          endDate: created.endDate,
          operatingPhaseId: dto.operatingPhaseId,
          batchGenerated: true,
        },
      });
    }

    return createdTerms.map(({ _count, ...data }) => ({
      ...data,
      classesCount: _count.classes,
    }));
  }
}

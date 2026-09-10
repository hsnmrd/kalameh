import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateOperatingPhaseDto } from './dto/create-operating-phase.dto';
import { UpdateOperatingPhaseDto } from './dto/update-operating-phase.dto';
import { PreviewSlotsDto } from './dto/preview-slots.dto';
import {
  calculatePhaseSlots,
  type JwtPayload,
  type OperatingPhaseWithSlots,
  type PhaseSlotsCalculationResult,
  type WeekDay,
} from '@workspace/types';

@Injectable()
export class OperatingPhasesService {
  private readonly logger = new Logger(OperatingPhasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private resolveInstituteId(
    currentUser: JwtPayload,
    targetInstituteId?: string,
  ): string {
    if (currentUser.role === 'SUPER_ADMIN' && targetInstituteId) {
      return targetInstituteId;
    }
    return currentUser.instituteId;
  }

  private toPhaseWithSlots(phase: {
    id: string;
    instituteId: string;
    title: string;
    months: number[];
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    daysOfWeek: string[];
    hasBreak: boolean;
    breakStartTime: string | null;
    breakEndTime: string | null;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }): OperatingPhaseWithSlots {
    return {
      ...phase,
      daysOfWeek: phase.daysOfWeek as WeekDay[],
      calculation: calculatePhaseSlots(
        phase.startTime,
        phase.endTime,
        phase.slotDurationMinutes,
        {
          hasBreak: phase.hasBreak,
          breakStartTime: phase.breakStartTime,
          breakEndTime: phase.breakEndTime,
        },
      ),
    };
  }

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
  ): Promise<OperatingPhaseWithSlots[]> {
    const instituteId = this.resolveInstituteId(currentUser, targetInstituteId);

    const phases = await this.prisma.instituteOperatingPhase.findMany({
      where: { instituteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return phases.map((phase) => this.toPhaseWithSlots(phase));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    const phase = await this.prisma.instituteOperatingPhase.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN'
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
    });

    return this.toPhaseWithSlots(phase);
  }

  async create(
    dto: CreateOperatingPhaseDto,
    currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    const instituteId = this.resolveInstituteId(currentUser, dto.instituteId);

    // Validate month overlap with other active phases of the same institute
    if (dto.isActive !== false) {
      await this.assertNoMonthOverlap(instituteId, dto.months);
    }

    const phase = await this.prisma.instituteOperatingPhase.create({
      data: {
        instituteId,
        title: dto.title,
        months: dto.months,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 90,
        daysOfWeek: dto.daysOfWeek,
        hasBreak: dto.hasBreak ?? false,
        breakStartTime: dto.hasBreak ? (dto.breakStartTime ?? null) : null,
        breakEndTime: dto.hasBreak ? (dto.breakEndTime ?? null) : null,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
      },
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'OPERATING_PHASES',
      entityId: phase.id,
      action: 'CREATE',
      description: `فاز زمانی «${phase.title}» ایجاد شد.`,
      metadata: phase,
    });

    return this.toPhaseWithSlots(phase);
  }

  async update(
    id: string,
    dto: UpdateOperatingPhaseDto,
    currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    const existing = await this.prisma.instituteOperatingPhase.findFirstOrThrow(
      {
        where: {
          id,
          ...(currentUser.role === 'SUPER_ADMIN'
            ? {}
            : { instituteId: currentUser.instituteId }),
        },
      },
    );

    const instituteId = existing.instituteId;

    const willBeActive =
      dto.isActive !== undefined ? dto.isActive : existing.isActive;
    const effectiveMonths =
      dto.months !== undefined ? dto.months : existing.months;

    if (willBeActive) {
      await this.assertNoMonthOverlap(instituteId, effectiveMonths, id);
    }

    const updated = await this.prisma.instituteOperatingPhase.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.months !== undefined ? { months: dto.months } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.slotDurationMinutes !== undefined
          ? { slotDurationMinutes: dto.slotDurationMinutes }
          : {}),
        ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
        ...(dto.hasBreak !== undefined ? { hasBreak: dto.hasBreak } : {}),
        ...(dto.breakStartTime !== undefined
          ? { breakStartTime: dto.breakStartTime }
          : {}),
        ...(dto.breakEndTime !== undefined
          ? { breakEndTime: dto.breakEndTime }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'OPERATING_PHASES',
      entityId: updated.id,
      action: 'UPDATE',
      description: `فاز زمانی «${updated.title}» ویرایش شد.`,
      metadata: updated,
    });

    return this.toPhaseWithSlots(updated);
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.instituteOperatingPhase.findFirstOrThrow(
      {
        where: {
          id,
          ...(currentUser.role === 'SUPER_ADMIN'
            ? {}
            : { instituteId: currentUser.instituteId }),
        },
      },
    );

    const instituteId = existing.instituteId;

    await this.prisma.instituteOperatingPhase.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'OPERATING_PHASES',
      entityId: id,
      action: 'DELETE',
      description: `فاز زمانی «${existing.title}» حذف شد.`,
    });

    return { success: true };
  }

  preview(dto: PreviewSlotsDto): PhaseSlotsCalculationResult {
    return calculatePhaseSlots(
      dto.startTime,
      dto.endTime,
      dto.slotDurationMinutes ?? 90,
      {
        hasBreak: dto.hasBreak,
        breakStartTime: dto.breakStartTime,
        breakEndTime: dto.breakEndTime,
      },
    );
  }

  private async assertNoMonthOverlap(
    instituteId: string,
    months: number[],
    excludePhaseId?: string,
  ): Promise<void> {
    const activePhases = await this.prisma.instituteOperatingPhase.findMany({
      where: {
        instituteId,
        isActive: true,
        ...(excludePhaseId ? { id: { not: excludePhaseId } } : {}),
      },
      select: {
        id: true,
        title: true,
        months: true,
      },
    });

    for (const phase of activePhases) {
      const overlappingMonths = phase.months.filter((m) => months.includes(m));
      if (overlappingMonths.length > 0) {
        throw new ConflictException(
          `ماه‌های انتخاب‌شده با فاز فعال «${phase.title}» تداخل دارند.`,
        );
      }
    }
  }
}

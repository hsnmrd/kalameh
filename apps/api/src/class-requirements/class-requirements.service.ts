import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ClassRequirementInputSchema,
  ClassRequirementSchema,
  ROLES,
  type ClassRequirementDto,
  type ClassRequirementFilter,
  type ClassRequirementInput,
  type JwtPayload,
  type SupportedLocale,
  type UpdateClassRequirementInput,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

const classRequirementRelations = {
  term: { select: { id: true, title: true } },
  course: { select: { id: true, title: true } },
  branch: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ClassRequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    filter: ClassRequirementFilter,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassRequirementDto[]> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      filter.instituteId,
      locale,
    );
    const requirements = await this.prisma.classRequirement.findMany({
      where: {
        instituteId,
        ...(filter.termId ? { termId: filter.termId } : {}),
        ...(filter.courseId ? { courseId: filter.courseId } : {}),
        ...(filter.branchId !== undefined ? { branchId: filter.branchId } : {}),
        ...(filter.deliveryMode ? { deliveryMode: filter.deliveryMode } : {}),
        ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      },
      include: classRequirementRelations,
      orderBy: [
        { term: { startDate: 'desc' } },
        { course: { title: 'asc' } },
        { createdAt: 'asc' },
      ],
    });

    const sanitized = requirements.map((req) => ({
      ...req,
      sessionsPerWeek:
        req.sessionsPerWeek == null && req.totalSessions == null
          ? 2
          : req.sessionsPerWeek,
    }));

    return ClassRequirementSchema.array().parse(sanitized);
  }

  async findOne(
    currentUser: JwtPayload,
    id: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassRequirementDto> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const requirement = await this.prisma.classRequirement.findFirstOrThrow({
      where: { id, instituteId },
      include: classRequirementRelations,
    });

    const sanitized = {
      ...requirement,
      sessionsPerWeek:
        requirement.sessionsPerWeek == null && requirement.totalSessions == null
          ? 2
          : requirement.sessionsPerWeek,
    };

    return ClassRequirementSchema.parse(sanitized);
  }

  async create(
    currentUser: JwtPayload,
    input: ClassRequirementInput,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassRequirementDto> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      input.instituteId,
      locale,
    );
    await this.assertReferencesBelongToInstitute(instituteId, input);

    const requirement = await this.prisma.classRequirement.create({
      data: {
        instituteId,
        termId: input.termId,
        courseId: input.courseId,
        branchId: input.branchId ?? null,
        requiredClassCount: input.requiredClassCount,
        capacity: input.capacity,
        sessionDurationMinutes: input.sessionDurationMinutes,
        sessionsPerWeek: input.sessionsPerWeek ?? null,
        totalSessions: input.totalSessions ?? null,
        deliveryMode: input.deliveryMode,
        isActive: input.isActive,
      },
      include: classRequirementRelations,
    });

    await this.logChange(currentUser, requirement, 'CREATE', input);
    return ClassRequirementSchema.parse(requirement);
  }

  async update(
    currentUser: JwtPayload,
    id: string,
    input: UpdateClassRequirementInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassRequirementDto> {
    const existing = await this.findOne(
      currentUser,
      id,
      requestedInstituteId,
      locale,
    );
    const merged = {
      termId: input.termId ?? existing.termId,
      courseId: input.courseId ?? existing.courseId,
      branchId:
        input.branchId !== undefined ? input.branchId : existing.branchId,
      requiredClassCount:
        input.requiredClassCount ?? existing.requiredClassCount,
      capacity: input.capacity ?? existing.capacity,
      sessionDurationMinutes:
        input.sessionDurationMinutes ?? existing.sessionDurationMinutes,
      sessionsPerWeek:
        input.sessionsPerWeek !== undefined
          ? input.sessionsPerWeek
          : existing.sessionsPerWeek,
      totalSessions:
        input.totalSessions !== undefined
          ? input.totalSessions
          : existing.totalSessions,
      deliveryMode: input.deliveryMode ?? existing.deliveryMode,
      isActive: input.isActive ?? existing.isActive,
    };
    const parsed = ClassRequirementInputSchema.safeParse(merged);

    if (!parsed.success) {
      throw new BadRequestException(
        this.i18n.t('classRequirements.invalidCadence', locale),
      );
    }

    await this.assertReferencesBelongToInstitute(
      existing.instituteId,
      parsed.data,
    );
    const requirement = await this.prisma.classRequirement.update({
      where: { id, instituteId: existing.instituteId },
      data: parsed.data,
      include: classRequirementRelations,
    });

    await this.logChange(currentUser, requirement, 'UPDATE', input);
    return ClassRequirementSchema.parse(requirement);
  }

  async deactivate(
    currentUser: JwtPayload,
    id: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassRequirementDto> {
    const existing = await this.findOne(
      currentUser,
      id,
      requestedInstituteId,
      locale,
    );
    const requirement = await this.prisma.classRequirement.update({
      where: { id, instituteId: existing.instituteId },
      data: { isActive: false },
      include: classRequirementRelations,
    });

    await this.logChange(currentUser, requirement, 'DEACTIVATE', {
      isActive: false,
    });
    return ClassRequirementSchema.parse(requirement);
  }

  private resolveInstituteId(
    currentUser: JwtPayload,
    requestedInstituteId: string | undefined,
    locale: SupportedLocale,
  ): string {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (!requestedInstituteId) {
        throw new BadRequestException(
          this.i18n.t('classRequirements.instituteRequired', locale),
        );
      }

      return requestedInstituteId;
    }

    return currentUser.instituteId;
  }

  private async assertReferencesBelongToInstitute(
    instituteId: string,
    requirement: Pick<
      ClassRequirementInput,
      'termId' | 'courseId' | 'branchId'
    >,
  ): Promise<void> {
    await Promise.all([
      this.prisma.term.findFirstOrThrow({
        where: { id: requirement.termId, instituteId },
        select: { id: true },
      }),
      this.prisma.course.findFirstOrThrow({
        where: { id: requirement.courseId, instituteId },
        select: { id: true },
      }),
      ...(requirement.branchId
        ? [
            this.prisma.branch.findFirstOrThrow({
              where: { id: requirement.branchId, instituteId },
              select: { id: true },
            }),
          ]
        : []),
    ]);
  }

  private async logChange(
    currentUser: JwtPayload,
    requirement: { id: string; instituteId: string },
    action: 'CREATE' | 'UPDATE' | 'DEACTIVATE',
    metadata: object,
  ): Promise<void> {
    await this.auditLogsService.log({
      instituteId: requirement.instituteId,
      userId: currentUser.sub,
      module: 'CLASS_REQUIREMENT',
      entityId: requirement.id,
      action,
      metadata: metadata as Record<string, unknown>,
    });
  }
}

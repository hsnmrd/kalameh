import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import type {
  JwtPayload,
  SupportedLocale,
  ClassroomDto,
} from '@workspace/types';

@Injectable()
export class ClassroomsService {
  private readonly logger = new Logger(ClassroomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
    branchId?: string,
    search?: string,
    isActive?: boolean,
  ): Promise<ClassroomDto[]> {
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
    const instituteId = isSuperAdmin
      ? targetInstituteId
      : currentUser.instituteId;

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        ...(instituteId
          ? { instituteId }
          : isSuperAdmin
            ? { institute: { subdomain: { not: 'system' } } }
            : { instituteId: currentUser.instituteId }),
        ...(branchId ? { branchId } : {}),
        ...(search
          ? {
              name: { contains: search, mode: 'insensitive' },
            }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { classes: true },
        },
      },
      orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
    });

    return classrooms.map(({ _count, ...item }) => ({
      ...item,
      classesCount: _count.classes,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassroomDto> {
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id,
        ...(isSuperAdmin ? {} : { instituteId: currentUser.instituteId }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { classes: true },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException(
        this.i18n.t('classrooms.classroomNotFound', locale),
      );
    }

    const { _count, ...item } = classroom;
    return {
      ...item,
      classesCount: _count.classes,
    };
  }

  async create(
    dto: CreateClassroomDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassroomDto> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, instituteId },
      });
      if (!branch) {
        throw new BadRequestException(
          this.i18n.t('branches.branchNotFound', locale),
        );
      }
    }

    const existing = await this.prisma.classroom.findFirst({
      where: {
        name: dto.name,
        instituteId,
        branchId: dto.branchId || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('classrooms.classroomAlreadyExists', locale),
      );
    }

    const created = await this.prisma.classroom.create({
      data: {
        instituteId,
        branchId: dto.branchId || null,
        name: dto.name,
        capacity: dto.capacity,
        description: dto.description || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'CLASSROOM',
      entityId: created.id,
      action: 'CREATE',
      metadata: dto as unknown as Record<string, unknown>,
    });

    return {
      ...created,
      classesCount: 0,
    };
  }

  async update(
    id: string,
    dto: UpdateClassroomDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassroomDto> {
    const existing = await this.findOne(id, currentUser, locale);

    const targetBranchId =
      dto.branchId !== undefined ? dto.branchId : existing.branchId;

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, instituteId: existing.instituteId },
      });
      if (!branch) {
        throw new BadRequestException(
          this.i18n.t('branches.branchNotFound', locale),
        );
      }
    }

    if (dto.name || dto.branchId !== undefined) {
      const duplicate = await this.prisma.classroom.findFirst({
        where: {
          id: { not: id },
          name: dto.name || existing.name,
          instituteId: existing.instituteId,
          branchId: targetBranchId || null,
        },
      });
      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('classrooms.classroomAlreadyExists', locale),
        );
      }
    }

    const updated = await this.prisma.classroom.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.branchId !== undefined
          ? { branchId: dto.branchId || null }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { classes: true },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'CLASSROOM',
      entityId: updated.id,
      action: 'UPDATE',
      metadata: dto as unknown as Record<string, unknown>,
    });

    const { _count, ...item } = updated;
    return {
      ...item,
      classesCount: _count.classes,
    };
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ success: boolean }> {
    const existing = await this.findOne(id, currentUser, locale);

    await this.prisma.classroom.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'CLASSROOM',
      entityId: id,
      action: 'DELETE',
    });

    return { success: true };
  }
}

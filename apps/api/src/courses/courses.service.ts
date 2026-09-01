import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { JwtPayload, SupportedLocale, CourseDto } from '@workspace/types';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
    search?: string,
    prerequisiteId?: string,
  ): Promise<CourseDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : currentUser.instituteId;

    const courses = await this.prisma.course.findMany({
      where: {
        instituteId,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        ...(prerequisiteId === 'NONE'
          ? { prerequisiteId: null }
          : prerequisiteId && prerequisiteId !== 'ALL'
            ? { prerequisiteId }
            : {}),
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: { select: { classes: true } },
      },
      orderBy: { title: 'asc' },
    });

    return courses.map(({ _count, ...course }) => ({
      ...course,
      classesCount: _count.classes,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto> {
    const instituteId = currentUser.instituteId;

    const course = await this.prisma.course.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: { select: { classes: true } },
      },
    });

    if (!course) {
      throw new NotFoundException(
        this.i18n.t('courses.courseNotFound', locale),
      );
    }

    const { _count, ...data } = course;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }

  async create(
    dto: CreateCourseDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    // Check duplicate title in same institute
    const existing = await this.prisma.course.findFirst({
      where: {
        instituteId,
        title: dto.title,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('courses.courseAlreadyExists', locale),
      );
    }

    // Verify prerequisite exists in same institute
    if (dto.prerequisiteId) {
      const prereq = await this.prisma.course.findFirst({
        where: {
          id: dto.prerequisiteId,
          instituteId,
        },
      });

      if (!prereq) {
        throw new NotFoundException(
          this.i18n.t('courses.prerequisiteNotFound', locale),
        );
      }
    }

    const created = await this.prisma.course.create({
      data: {
        instituteId,
        title: dto.title,
        baseFee: dto.baseFee,
        prerequisiteId: dto.prerequisiteId || null,
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: { select: { classes: true } },
      },
    });

    this.logger.log(
      `Course created: "${created.title}" (${created.id}) for institute ${instituteId} by user ${currentUser.sub} (${currentUser.role})`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'COURSE',
      entityId: created.id,
      action: 'CREATE',
      metadata: {
        title: created.title,
        baseFee: created.baseFee,
        prerequisiteId: created.prerequisiteId,
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
    dto: UpdateCourseDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto> {
    const existing = await this.findOne(id, currentUser, locale);

    if (dto.title && dto.title !== existing.title) {
      const duplicate = await this.prisma.course.findFirst({
        where: {
          instituteId: existing.instituteId,
          title: dto.title,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('courses.courseAlreadyExists', locale),
        );
      }
    }

    // Circular prerequisite check
    if (dto.prerequisiteId !== undefined) {
      if (dto.prerequisiteId === id) {
        throw new BadRequestException(
          this.i18n.t('courses.prerequisiteCycleDetected', locale),
        );
      }

      if (dto.prerequisiteId) {
        const prereq = await this.prisma.course.findFirst({
          where: {
            id: dto.prerequisiteId,
            instituteId: existing.instituteId,
          },
        });

        if (!prereq) {
          throw new NotFoundException(
            this.i18n.t('courses.prerequisiteNotFound', locale),
          );
        }

        // Trace prerequisite chain upwards to ensure we don't hit `id`
        let currentPrereqId: string | null | undefined = prereq.prerequisiteId;
        const visited = new Set<string>([id, dto.prerequisiteId]);

        while (currentPrereqId) {
          if (currentPrereqId === id || visited.has(currentPrereqId)) {
            throw new BadRequestException(
              this.i18n.t('courses.prerequisiteCycleDetected', locale),
            );
          }
          visited.add(currentPrereqId);

          const parentCourse = await this.prisma.course.findUnique({
            where: { id: currentPrereqId },
            select: { id: true, prerequisiteId: true },
          });

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          currentPrereqId = parentCourse?.prerequisiteId ?? null;
        }
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.baseFee !== undefined ? { baseFee: dto.baseFee } : {}),
        ...(dto.prerequisiteId !== undefined
          ? { prerequisiteId: dto.prerequisiteId || null }
          : {}),
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: { select: { classes: true } },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'COURSE',
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
}

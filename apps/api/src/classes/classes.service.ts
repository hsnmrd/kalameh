import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassFilterDto } from './dto/class-filter.dto';
import { CheckClassConflictsDto } from './dto/check-class-conflicts.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  JwtPayload,
  SupportedLocale,
  ClassDto,
  ClassConflictResult,
  ClassConflictItem,
} from '@workspace/types';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    filter?: ClassFilterDto,
  ): Promise<ClassDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && filter?.instituteId
        ? filter.instituteId
        : currentUser.instituteId;

    const classes = await this.prisma.class.findMany({
      where: {
        instituteId,
        ...(filter?.termId ? { termId: filter.termId } : {}),
        ...(filter?.courseId ? { courseId: filter.courseId } : {}),
        ...(filter?.branchId ? { branchId: filter.branchId } : {}),
        ...(filter?.search
          ? {
              OR: [
                { title: { contains: filter.search, mode: 'insensitive' } },
                {
                  teacherName: { contains: filter.search, mode: 'insensitive' },
                },
              ],
            }
          : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(({ _count, ...cls }) => ({
      ...cls,
      enrolledCount: _count.enrollments,
    }));
  }

  async findAvailableForStudent(
    currentUser: JwtPayload,
  ): Promise<{ allowedCourseTitle?: string; classes: ClassDto[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      include: {
        currentAllowedCourse: true,
      },
    });

    const instituteId = currentUser.instituteId;
    let targetCourseId = user?.currentAllowedCourseId;

    // If user has no specific allowed course set, default to root courses (prerequisiteId: null)
    if (!targetCourseId) {
      const rootCourse = await this.prisma.course.findFirst({
        where: {
          instituteId,
          prerequisiteId: null,
        },
        orderBy: { createdAt: 'asc' },
      });
      targetCourseId = rootCourse?.id;
    }

    if (!targetCourseId) {
      return { allowedCourseTitle: undefined, classes: [] };
    }

    const course = await this.prisma.course.findUnique({
      where: { id: targetCourseId },
    });

    const classes = await this.prisma.class.findMany({
      where: {
        instituteId,
        courseId: targetCourseId,
        term: {
          isActive: true,
        },
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return {
      allowedCourseTitle: course?.title,
      classes: classes.map(({ _count, ...cls }) => ({
        ...cls,
        enrolledCount: _count.enrollments,
      })),
    };
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(this.i18n.t('classes.classNotFound', locale));
    }

    const { _count, ...data } = cls;
    return {
      ...data,
      enrolledCount: _count.enrollments,
    };
  }

  async create(
    dto: CreateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    let instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (currentUser.role === 'SUPER_ADMIN' && !dto.instituteId) {
      const termRecord = await this.prisma.term.findUnique({
        where: { id: dto.termId },
        select: { instituteId: true },
      });
      if (termRecord) {
        instituteId = termRecord.instituteId;
      }
    }

    // Verify Term exists and belongs to institute
    const term = await this.prisma.term.findFirst({
      where: {
        id: dto.termId,
        instituteId,
      },
    });

    if (!term) {
      throw new BadRequestException(
        this.i18n.t('classes.invalidTermOrCourse', locale),
      );
    }

    // Verify Course exists and belongs to institute
    const course = await this.prisma.course.findFirst({
      where: {
        id: dto.courseId,
        instituteId,
      },
    });

    if (!course) {
      throw new BadRequestException(
        this.i18n.t('classes.invalidTermOrCourse', locale),
      );
    }

    // Verify Branch exists and belongs to institute if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: dto.branchId,
          instituteId,
        },
      });
      if (!branch) {
        throw new BadRequestException(
          this.i18n.t('branches.branchNotFound', locale),
        );
      }
    }

    // Verify Classroom exists and belongs to institute if provided
    if (dto.classroomId) {
      const classroom = await this.prisma.classroom.findFirst({
        where: {
          id: dto.classroomId,
          instituteId,
        },
      });
      if (!classroom) {
        throw new BadRequestException(
          this.i18n.t('classrooms.classroomNotFound', locale),
        );
      }
    }

    await this.validateScheduleConflicts(
      instituteId,
      dto.termId,
      {
        classroomId: dto.classroomId,
        teacherName: dto.teacherName,
        startTime: dto.startTime,
        endTime: dto.endTime,
        daysOfWeek: dto.daysOfWeek,
        sessionDates: dto.sessionDates,
      },
      locale,
    );

    const created = await this.prisma.class.create({
      data: {
        instituteId,
        termId: dto.termId,
        courseId: dto.courseId,
        branchId: dto.branchId || null,
        classroomId: dto.classroomId || null,
        title: dto.title,
        capacity: dto.capacity,
        fee: dto.fee,
        teacherName: dto.teacherName || null,
        schedule: dto.schedule || null,
        daysOfWeek: dto.daysOfWeek || [],
        sessionDates: dto.sessionDates || [],
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    this.logger.log(
      `Class created: "${created.title}" (${created.id}) for institute ${instituteId} by user ${currentUser.sub} (${currentUser.role})`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'CLASS',
      entityId: created.id,
      action: 'CREATE',
      metadata: {
        title: created.title,
        capacity: created.capacity,
        fee: created.fee,
        termId: created.termId,
        courseId: created.courseId,
      },
    });

    return {
      id: created.id,
      instituteId: created.instituteId,
      termId: created.termId,
      courseId: created.courseId,
      branchId: created.branchId,
      classroomId: created.classroomId,
      title: created.title,
      capacity: created.capacity,
      fee: created.fee,
      teacherName: created.teacherName,
      schedule: created.schedule,
      daysOfWeek: created.daysOfWeek,
      sessionDates: created.sessionDates,
      startTime: created.startTime,
      endTime: created.endTime,
      branch: created.branch,
      classroom: created.classroom,
      term: created.term,
      course: created.course,
      enrolledCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(
    id: string,
    dto: UpdateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const existing = await this.findOne(id, currentUser, locale);

    if (dto.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: dto.termId, instituteId: existing.instituteId },
      });
      if (!term) {
        throw new BadRequestException(
          this.i18n.t('classes.invalidTermOrCourse', locale),
        );
      }
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: dto.courseId, instituteId: existing.instituteId },
      });
      if (!course) {
        throw new BadRequestException(
          this.i18n.t('classes.invalidTermOrCourse', locale),
        );
      }
    }

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

    if (dto.classroomId) {
      const classroom = await this.prisma.classroom.findFirst({
        where: { id: dto.classroomId, instituteId: existing.instituteId },
      });
      if (!classroom) {
        throw new BadRequestException(
          this.i18n.t('classrooms.classroomNotFound', locale),
        );
      }
    }

    const targetTermId = dto.termId || existing.termId;
    const targetClassroomId =
      dto.classroomId !== undefined ? dto.classroomId : existing.classroomId;
    const targetTeacherName =
      dto.teacherName !== undefined ? dto.teacherName : existing.teacherName;
    const targetStartTime =
      dto.startTime !== undefined ? dto.startTime : existing.startTime;
    const targetEndTime =
      dto.endTime !== undefined ? dto.endTime : existing.endTime;
    const targetDaysOfWeek =
      dto.daysOfWeek !== undefined ? dto.daysOfWeek : existing.daysOfWeek;
    const targetSessionDates =
      dto.sessionDates !== undefined ? dto.sessionDates : existing.sessionDates;

    await this.validateScheduleConflicts(
      existing.instituteId,
      targetTermId,
      {
        classroomId: targetClassroomId,
        teacherName: targetTeacherName,
        startTime: targetStartTime,
        endTime: targetEndTime,
        daysOfWeek: targetDaysOfWeek,
        sessionDates: targetSessionDates,
      },
      locale,
      id,
    );

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.termId ? { termId: dto.termId } : {}),
        ...(dto.courseId ? { courseId: dto.courseId } : {}),
        ...(dto.branchId !== undefined
          ? { branchId: dto.branchId || null }
          : {}),
        ...(dto.classroomId !== undefined
          ? { classroomId: dto.classroomId || null }
          : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.fee !== undefined ? { fee: dto.fee } : {}),
        ...(dto.teacherName !== undefined
          ? { teacherName: dto.teacherName }
          : {}),
        ...(dto.schedule !== undefined ? { schedule: dto.schedule } : {}),
        ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
        ...(dto.sessionDates !== undefined
          ? { sessionDates: dto.sessionDates }
          : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'CLASS',
      entityId: updated.id,
      action: 'UPDATE',
      metadata: dto as unknown as Record<string, unknown>,
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      enrolledCount: _count.enrollments,
    };
  }

  private parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] ?? '0', 10);
    const minutes = parseInt(parts[1] ?? '0', 10);
    return hours * 60 + minutes;
  }

  private normalizePersianText(str?: string | null): string {
    if (!str) return '';
    return str
      .trim()
      .replace(/\u064A/g, '\u06CC')
      .replace(/\u0643/g, '\u06A9')
      .replace(/\u0649/g, '\u06CC')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private hasTimeOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    const sA = this.parseTimeToMinutes(startA);
    const eA = this.parseTimeToMinutes(endA);
    const sB = this.parseTimeToMinutes(startB);
    const eB = this.parseTimeToMinutes(endB);
    // Overlap condition: startA < endB && startB < endA
    return sA < eB && sB < eA;
  }

  async checkConflicts(
    dto: CheckClassConflictsDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassConflictResult> {
    let instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (!instituteId || currentUser.role === 'SUPER_ADMIN') {
      const term = await this.prisma.term.findUnique({
        where: { id: dto.termId },
        select: { instituteId: true },
      });
      if (term) {
        instituteId = term.instituteId;
      }
    }

    if (!dto.startTime || !dto.endTime) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const trimmedTeacher = dto.teacherName?.trim();
    if (!dto.classroomId && !trimmedTeacher) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const daysCount = dto.daysOfWeek?.length ?? 0;
    const sessionsCount = dto.sessionDates?.length ?? 0;
    if (daysCount === 0 && sessionsCount === 0) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const orConditions: Array<{
      classroomId?: string;
      teacherName?: { equals: string; mode: 'insensitive' };
    }> = [];

    if (dto.classroomId) {
      orConditions.push({ classroomId: dto.classroomId });
    }

    if (trimmedTeacher) {
      const normalized = this.normalizePersianText(trimmedTeacher);
      const arabicYehVariant = trimmedTeacher
        .replace(/\u06CC/g, '\u064A')
        .replace(/\u06A9/g, '\u0643');
      const persianYehVariant = trimmedTeacher
        .replace(/\u064A/g, '\u06CC')
        .replace(/\u0643/g, '\u06A9');

      const seenVariants = new Set<string>();
      for (const variant of [
        trimmedTeacher,
        normalized,
        arabicYehVariant,
        persianYehVariant,
      ]) {
        if (!seenVariants.has(variant)) {
          seenVariants.add(variant);
          orConditions.push({
            teacherName: {
              equals: variant,
              mode: 'insensitive',
            },
          });
        }
      }
    }

    const candidateClasses = await this.prisma.class.findMany({
      where: {
        instituteId,
        termId: dto.termId,
        ...(dto.excludeClassId ? { id: { not: dto.excludeClassId } } : {}),
        startTime: { not: null },
        endTime: { not: null },
        OR: orConditions,
      },
      select: {
        id: true,
        title: true,
        classroomId: true,
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        teacherName: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        sessionDates: true,
      },
    });

    const conflicts: ClassConflictItem[] = [];
    const allConflictingDates = new Set<string>();

    for (const candidate of candidateClasses) {
      if (!candidate.startTime || !candidate.endTime) continue;

      const timeCollision = this.hasTimeOverlap(
        dto.startTime,
        dto.endTime,
        candidate.startTime,
        candidate.endTime,
      );

      if (!timeCollision) continue;

      const collidingDates = this.getCollidingDates(
        dto.daysOfWeek ?? [],
        dto.sessionDates ?? [],
        candidate.daysOfWeek ?? [],
        candidate.sessionDates ?? [],
      );

      if (collidingDates.length === 0) continue;

      const isClassroomCollision = Boolean(
        dto.classroomId && candidate.classroomId === dto.classroomId,
      );

      const isTeacherCollision = Boolean(
        trimmedTeacher &&
        this.normalizePersianText(candidate.teacherName) ===
          this.normalizePersianText(trimmedTeacher),
      );

      // Check classroom collision
      if (isClassroomCollision) {
        collidingDates.forEach((d) => allConflictingDates.add(d));
        conflicts.push({
          type: 'CLASSROOM',
          conflictingClassId: candidate.id,
          conflictingClassTitle: candidate.title,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          teacherName: candidate.teacherName,
          classroomName: candidate.classroom?.name,
          message: this.i18n.t('classes.classroomConflict', locale, {
            conflictingClass: candidate.title,
          }),
          conflictingDates: collidingDates,
        });
      }

      // Check teacher collision:
      // If the class already has a classroom collision and the teacher is the same,
      // only show the classroom collision (skip redundant teacher conflict for that class).
      if (isTeacherCollision && !isClassroomCollision) {
        collidingDates.forEach((d) => allConflictingDates.add(d));
        conflicts.push({
          type: 'TEACHER',
          conflictingClassId: candidate.id,
          conflictingClassTitle: candidate.title,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          teacherName: candidate.teacherName,
          classroomName: candidate.classroom?.name,
          message: this.i18n.t('classes.teacherConflict', locale, {
            conflictingClass: candidate.title,
          }),
          conflictingDates: collidingDates,
        });
      }
    }

    const sortedConflictingDates = Array.from(allConflictingDates).sort();

    return {
      hasConflict: conflicts.length > 0,
      conflictingDates: sortedConflictingDates,
      conflicts,
    };
  }

  private getCollidingDates(
    daysA: string[] = [],
    sessionsA: string[] = [],
    daysB: string[] = [],
    sessionsB: string[] = [],
  ): string[] {
    // If both have specific calendar session dates
    if (sessionsA.length > 0 && sessionsB.length > 0) {
      const setB = new Set(sessionsB);
      return sessionsA.filter((date) => setB.has(date));
    }

    const JS_DAY_TO_WEEKDAY: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    // If A has sessionDates and B has daysOfWeek
    if (sessionsA.length > 0 && daysB.length > 0) {
      const setB = new Set(daysB);
      return sessionsA.filter((dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return setB.has(JS_DAY_TO_WEEKDAY[d.getDay()]);
      });
    }

    // If A has daysOfWeek and B has sessionDates
    if (daysA.length > 0 && sessionsB.length > 0) {
      const setA = new Set(daysA);
      return sessionsB.filter((dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return setA.has(JS_DAY_TO_WEEKDAY[d.getDay()]);
      });
    }

    // If both have only daysOfWeek
    if (daysA.length > 0 && daysB.length > 0) {
      const setB = new Set(daysB);
      return daysA.filter((d) => setB.has(d));
    }

    return [];
  }

  private hasDayOrDateOverlap(
    daysA: string[] = [],
    sessionsA: string[] = [],
    daysB: string[] = [],
    sessionsB: string[] = [],
  ): boolean {
    return (
      this.getCollidingDates(daysA, sessionsA, daysB, sessionsB).length > 0
    );
  }

  private async validateScheduleConflicts(
    instituteId: string,
    termId: string,
    scheduleInfo: {
      classroomId?: string | null;
      teacherName?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      daysOfWeek?: string[] | null;
      sessionDates?: string[] | null;
    },
    locale: SupportedLocale,
    excludeClassId?: string,
  ): Promise<void> {
    if (!scheduleInfo.startTime || !scheduleInfo.endTime) {
      return;
    }

    const trimmedTeacher = scheduleInfo.teacherName?.trim();
    if (!scheduleInfo.classroomId && !trimmedTeacher) {
      return;
    }

    const daysCount = scheduleInfo.daysOfWeek?.length ?? 0;
    const sessionsCount = scheduleInfo.sessionDates?.length ?? 0;
    if (daysCount === 0 && sessionsCount === 0) {
      return;
    }

    const orConditions: Array<{
      classroomId?: string;
      teacherName?: { equals: string; mode: 'insensitive' };
    }> = [];

    if (scheduleInfo.classroomId) {
      orConditions.push({ classroomId: scheduleInfo.classroomId });
    }

    if (trimmedTeacher) {
      const normalized = this.normalizePersianText(trimmedTeacher);
      const arabicYehVariant = trimmedTeacher
        .replace(/\u06CC/g, '\u064A')
        .replace(/\u06A9/g, '\u0643');
      const persianYehVariant = trimmedTeacher
        .replace(/\u064A/g, '\u06CC')
        .replace(/\u0643/g, '\u06A9');

      const seenVariants = new Set<string>();
      for (const variant of [
        trimmedTeacher,
        normalized,
        arabicYehVariant,
        persianYehVariant,
      ]) {
        if (!seenVariants.has(variant)) {
          seenVariants.add(variant);
          orConditions.push({
            teacherName: {
              equals: variant,
              mode: 'insensitive',
            },
          });
        }
      }
    }

    const candidateClasses = await this.prisma.class.findMany({
      where: {
        instituteId,
        termId,
        ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
        startTime: { not: null },
        endTime: { not: null },
        OR: orConditions,
      },
      select: {
        id: true,
        title: true,
        classroomId: true,
        teacherName: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        sessionDates: true,
      },
    });

    for (const candidate of candidateClasses) {
      if (!candidate.startTime || !candidate.endTime) continue;

      const timeCollision = this.hasTimeOverlap(
        scheduleInfo.startTime,
        scheduleInfo.endTime,
        candidate.startTime,
        candidate.endTime,
      );

      if (!timeCollision) continue;

      const dayCollision = this.hasDayOrDateOverlap(
        scheduleInfo.daysOfWeek ?? [],
        scheduleInfo.sessionDates ?? [],
        candidate.daysOfWeek ?? [],
        candidate.sessionDates ?? [],
      );

      if (!dayCollision) continue;

      // Check classroom collision
      if (
        scheduleInfo.classroomId &&
        candidate.classroomId === scheduleInfo.classroomId
      ) {
        throw new ConflictException(
          this.i18n.t('classes.classroomConflict', locale, {
            conflictingClass: candidate.title,
          }),
        );
      }

      // Check teacher collision
      if (
        trimmedTeacher &&
        this.normalizePersianText(candidate.teacherName) ===
          this.normalizePersianText(trimmedTeacher)
      ) {
        throw new ConflictException(
          this.i18n.t('classes.teacherConflict', locale, {
            conflictingClass: candidate.title,
          }),
        );
      }
    }
  }
}

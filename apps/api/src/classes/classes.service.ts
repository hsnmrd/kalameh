import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassFilterDto } from './dto/class-filter.dto';
import { CheckClassConflictsDto } from './dto/check-class-conflicts.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ClassScheduleConflicts } from './class-schedule-conflicts';
import {
  ROLES,
  type JwtPayload,
  type SupportedLocale,
  type ClassDto,
  type ClassConflictResult,
} from '@workspace/types';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);
  private readonly scheduleConflicts: ClassScheduleConflicts;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {
    this.scheduleConflicts = new ClassScheduleConflicts(prisma, i18n);
  }

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
    const instituteId = currentUser.instituteId;
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.sub,
        instituteId,
      },
      include: {
        currentAllowedCourse: true,
      },
    });

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

    const course = await this.prisma.course.findFirst({
      where: {
        id: targetCourseId,
        instituteId,
      },
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
    _locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirstOrThrow({
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

    let resolvedTeacherName = dto.teacherName || null;
    if (dto.teacherId && !resolvedTeacherName) {
      const teacher = await this.prisma.user.findFirst({
        where: { id: dto.teacherId, instituteId, role: ROLES.TEACHER },
      });
      if (teacher) {
        resolvedTeacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }

    await this.scheduleConflicts.validateScheduleConflicts(
      instituteId,
      dto.termId,
      {
        classroomId: dto.classroomId,
        teacherId: dto.teacherId,
        teacherName: resolvedTeacherName,
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
        teacherId: dto.teacherId || null,
        teacherName: resolvedTeacherName,
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
    const targetStartTime =
      dto.startTime !== undefined ? dto.startTime : existing.startTime;
    const targetEndTime =
      dto.endTime !== undefined ? dto.endTime : existing.endTime;
    const targetDaysOfWeek =
      dto.daysOfWeek !== undefined ? dto.daysOfWeek : existing.daysOfWeek;
    const targetSessionDates =
      dto.sessionDates !== undefined ? dto.sessionDates : existing.sessionDates;

    const targetTeacherId =
      dto.teacherId !== undefined ? dto.teacherId : existing.teacherId;
    let targetTeacherName =
      dto.teacherName !== undefined ? dto.teacherName : existing.teacherName;

    if (dto.teacherId && dto.teacherName === undefined) {
      const teacher = await this.prisma.user.findFirst({
        where: {
          id: dto.teacherId,
          instituteId: existing.instituteId,
          role: ROLES.TEACHER,
        },
      });
      if (teacher) {
        targetTeacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }

    await this.scheduleConflicts.validateScheduleConflicts(
      existing.instituteId,
      targetTermId,
      {
        classroomId: targetClassroomId,
        teacherId: targetTeacherId,
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
      where: {
        id,
        instituteId: existing.instituteId,
      },
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
        ...(dto.teacherId !== undefined
          ? { teacherId: dto.teacherId || null }
          : {}),
        ...(targetTeacherName !== undefined
          ? { teacherName: targetTeacherName }
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

  async checkConflicts(
    dto: CheckClassConflictsDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassConflictResult> {
    return this.scheduleConflicts.checkConflicts(dto, currentUser, locale);
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ success: boolean }> {
    const existing = await this.findOne(id, currentUser, locale);

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

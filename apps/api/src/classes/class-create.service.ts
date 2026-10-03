import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ROLES,
  type ClassDto,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassScheduleConflicts } from './class-schedule-conflicts';
import { CreateClassDto } from './dto/create-class.dto';
@Injectable()
export class ClassCreateService {
  private readonly logger = new Logger(ClassCreateService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly scheduleConflicts: ClassScheduleConflicts,
  ) {}
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
}

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
import { UpdateClassDto } from './dto/update-class.dto';
@Injectable()
export class ClassUpdateService {
  private readonly logger = new Logger(ClassUpdateService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly scheduleConflicts: ClassScheduleConflicts,
  ) {}
  async update(
    id: string,
    dto: UpdateClassDto,
    currentUser: JwtPayload,
    existing: ClassDto,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
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
}

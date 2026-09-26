import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ROLES,
  TeacherCourseQualificationsSchema,
  type JwtPayload,
  type ReplaceTeacherCoursesInput,
  type SupportedLocale,
  type TeacherCourseQualificationsDto,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherQualificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findCourseQualifications(
    currentUser: JwtPayload,
    teacherId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<TeacherCourseQualificationsDto> {
    const instituteId = this.resolveQualificationsInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const teacher = await this.findTeacherForQualifications(
      teacherId,
      instituteId,
    );

    return TeacherCourseQualificationsSchema.parse(
      teacher.teacherProfile?.teachableCourses ?? [],
    );
  }

  async replaceCourseQualifications(
    currentUser: JwtPayload,
    teacherId: string,
    input: ReplaceTeacherCoursesInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<TeacherCourseQualificationsDto> {
    const instituteId = this.resolveQualificationsInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const teacher = await this.findTeacherForQualifications(
      teacherId,
      instituteId,
    );
    const courseIds = await this.validateCourseIds(
      instituteId,
      input.courseIds,
      locale,
    );

    const qualifications = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.teacherProfile.upsert({
        where: { userId: teacher.id },
        create: { userId: teacher.id },
        update: {},
        select: { id: true },
      });

      await tx.teacherCourseQualification.deleteMany({
        where: {
          instituteId,
          teacherProfileId: profile.id,
        },
      });

      if (courseIds.length > 0) {
        await tx.teacherCourseQualification.createMany({
          data: courseIds.map((courseId) => ({
            instituteId,
            teacherProfileId: profile.id,
            courseId,
          })),
        });
      }

      return tx.teacherCourseQualification.findMany({
        where: {
          instituteId,
          teacherProfileId: profile.id,
        },
        include: {
          course: { select: { id: true, title: true } },
        },
        orderBy: { course: { title: 'asc' } },
      });
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'TEACHER_COURSE_QUALIFICATION',
      action: 'REPLACE',
      entityId: teacher.id,
      metadata: {
        previousCourseIds:
          teacher.teacherProfile?.teachableCourses.map(
            (qualification) => qualification.courseId,
          ) ?? [],
        courseIds,
      },
    });

    return TeacherCourseQualificationsSchema.parse(qualifications);
  }

  async validateCourseIds(
    instituteId: string,
    requestedCourseIds: string[] | undefined,
    locale: SupportedLocale,
  ): Promise<string[]> {
    const courseIds = [...new Set(requestedCourseIds ?? [])];
    if (courseIds.length === 0) return courseIds;

    const courses = await this.prisma.course.findMany({
      where: {
        instituteId,
        id: { in: courseIds },
      },
      select: { id: true },
    });

    if (courses.length !== courseIds.length) {
      throw new BadRequestException(
        this.i18n.t('teachers.invalidCourses', locale),
      );
    }

    return courseIds;
  }

  private resolveQualificationsInstituteId(
    currentUser: JwtPayload,
    requestedInstituteId: string | undefined,
    locale: SupportedLocale,
  ): string {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (!requestedInstituteId) {
        throw new BadRequestException(
          this.i18n.t('teachers.instituteRequired', locale),
        );
      }

      return requestedInstituteId;
    }

    return currentUser.instituteId;
  }

  private findTeacherForQualifications(teacherId: string, instituteId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: {
        id: teacherId,
        instituteId,
        role: ROLES.TEACHER,
      },
      select: {
        id: true,
        instituteId: true,
        teacherProfile: {
          select: {
            id: true,
            teachableCourses: {
              where: { instituteId },
              include: {
                course: { select: { id: true, title: true } },
              },
              orderBy: { course: { title: 'asc' } },
            },
          },
        },
      },
    });
  }
}

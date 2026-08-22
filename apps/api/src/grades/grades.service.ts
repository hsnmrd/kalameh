import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@workspace/database';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { SubmitFinalGradesDto } from './dto/submit-grades.dto';
import { SetStudentLevelDto } from './dto/set-student-level.dto';
import type {
  JwtPayload,
  SupportedLocale,
  ClassGradeRecordDto,
} from '@workspace/types';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async getClassStudentsAndGrades(
    classId: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassGradeRecordDto[]> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirst({
      where: {
        id: classId,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
    });

    if (!cls) {
      throw new NotFoundException(this.i18n.t('classes.classNotFound', locale));
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            currentAllowedCourseId: true,
          },
        },
      },
      orderBy: { student: { lastName: 'asc' } },
    });

    return enrollments.map((enr) => ({
      enrollmentId: enr.id,
      studentId: enr.studentId,
      student: enr.student,
      finalScore: enr.finalScore,
      isPassed: enr.isPassed,
      status: enr.status,
    }));
  }

  async submitClassGrades(
    classId: string,
    dto: SubmitFinalGradesDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ message: string; updatedCount: number }> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirst({
      where: {
        id: classId,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        course: true,
      },
    });

    if (!cls) {
      throw new NotFoundException(this.i18n.t('classes.classNotFound', locale));
    }

    // Find the subsequent course in the prerequisite chain
    const nextCourse = await this.prisma.course.findFirst({
      where: {
        instituteId: cls.instituteId,
        prerequisiteId: cls.courseId,
      },
    });

    let updatedCount = 0;

    // Process all grades in a transactional manner
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const gradeItem of dto.grades) {
        const enrollment = await tx.enrollment.findUnique({
          where: {
            studentId_classId: {
              studentId: gradeItem.studentId,
              classId,
            },
          },
        });

        if (!enrollment) {
          throw new BadRequestException(
            this.i18n.t('grades.studentNotEnrolled', locale),
          );
        }

        // Update score and pass status
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            finalScore: gradeItem.finalScore ?? null,
            isPassed: gradeItem.isPassed ?? null,
          },
        });

        // If student passed, auto-progress currentAllowedCourseId to next course
        if (gradeItem.isPassed === true && nextCourse) {
          await tx.user.update({
            where: { id: gradeItem.studentId },
            data: {
              currentAllowedCourseId: nextCourse.id,
            },
          });
        }

        updatedCount++;
      }
    });

    return {
      message: this.i18n.t('grades.gradesSubmittedSuccess', locale),
      updatedCount,
    };
  }

  async setStudentLevel(
    studentId: string,
    dto: SetStudentLevelDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ message: string }> {
    const instituteId = currentUser.instituteId;

    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
    });

    if (!student) {
      throw new NotFoundException(this.i18n.t('users.userNotFound', locale));
    }

    if (dto.currentAllowedCourseId) {
      const course = await this.prisma.course.findFirst({
        where: {
          id: dto.currentAllowedCourseId,
          instituteId: student.instituteId,
        },
      });

      if (!course) {
        throw new NotFoundException(
          this.i18n.t('courses.courseNotFound', locale),
        );
      }
    }

    await this.prisma.user.update({
      where: { id: studentId },
      data: {
        currentAllowedCourseId: dto.currentAllowedCourseId || null,
      },
    });

    return {
      message: this.i18n.t('grades.studentLevelUpdatedSuccess', locale),
    };
  }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { ROLES, type JwtPayload, type SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherQualificationsService } from './teacher-qualifications.service';

@Injectable()
export class TeacherUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly qualifications: TeacherQualificationsService,
  ) {}
  async update(
    currentUser: JwtPayload,
    id: string,
    dto: UpdateTeacherDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        teacherProfile: {
          include: {
            availabilities: true,
          },
        },
      },
    });

    if (dto.phone && dto.phone !== existing.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: {
          phone_instituteId: {
            phone: dto.phone,
            instituteId: existing.instituteId,
          },
        },
      });

      if (phoneExists) {
        throw new ConflictException(
          this.i18n.t('users.userAlreadyExists', locale),
        );
      }
    }

    const avatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : dto.avatarUrl !== undefined
        ? dto.avatarUrl
        : existing.avatarUrl;

    const courseIds =
      dto.courseIds === undefined
        ? undefined
        : await this.qualifications.validateCourseIds(
            existing.instituteId,
            dto.courseIds,
            locale,
          );

    const userUpdateData: Record<string, unknown> = {
      ...(dto.firstName ? { firstName: dto.firstName } : {}),
      ...(dto.lastName ? { lastName: dto.lastName } : {}),
      ...(dto.phone ? { phone: dto.phone } : {}),
      ...(dto.nationalCode !== undefined
        ? { nationalCode: dto.nationalCode }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      avatarUrl,
    };

    const hasProfileUpdate =
      dto.bio !== undefined ||
      dto.degree !== undefined ||
      dto.specialties !== undefined ||
      dto.availabilities !== undefined ||
      courseIds !== undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (hasProfileUpdate) {
        const profile = await tx.teacherProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            bio: dto.bio,
            degree: dto.degree,
            specialties: dto.specialties || [],
          },
          update: {
            ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
            ...(dto.degree !== undefined ? { degree: dto.degree } : {}),
            ...(dto.specialties !== undefined
              ? { specialties: dto.specialties }
              : {}),
          },
        });

        if (dto.availabilities !== undefined) {
          await tx.teacherAvailability.deleteMany({
            where: { teacherProfileId: profile.id },
          });
          if (dto.availabilities && dto.availabilities.length > 0) {
            await tx.teacherAvailability.createMany({
              data: dto.availabilities.map((slot) => ({
                teacherProfileId: profile.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            });
          }
        }

        if (courseIds !== undefined) {
          await tx.teacherCourseQualification.deleteMany({
            where: { teacherProfileId: profile.id },
          });
          if (courseIds.length > 0) {
            await tx.teacherCourseQualification.createMany({
              data: courseIds.map((courseId) => ({
                instituteId: existing.instituteId,
                teacherProfileId: profile.id,
                courseId,
              })),
            });
          }
        }
      }

      return tx.user.update({
        where: {
          id,
          instituteId: existing.instituteId,
        },
        data: userUpdateData,
        include: {
          teacherProfile: {
            include: {
              availabilities: {
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
              },
              teachableCourses: {
                include: { course: { select: { id: true, title: true } } },
                orderBy: { course: { title: 'asc' } },
              },
            },
          },
        },
      });
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_UPDATED',
      entityId: id,
      metadata: {
        fields: Object.keys(dto),
        ...(courseIds !== undefined ? { courseIds } : {}),
      },
    });

    const { password: _password, ...safeTeacher } = updated;
    return safeTeacher;
  }
}

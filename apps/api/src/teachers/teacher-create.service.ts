import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ROLES, type JwtPayload, type SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TeacherQualificationsService } from './teacher-qualifications.service';

@Injectable()
export class TeacherCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly qualifications: TeacherQualificationsService,
  ) {}
  async create(
    currentUser: JwtPayload,
    dto: CreateTeacherDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (!targetInstituteId) {
      throw new BadRequestException(
        locale === 'fa' ? 'شناسه آموزشگاه الزامی است' : 'Institute is required',
      );
    }

    const avatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : dto.avatarUrl;

    const existing = await this.prisma.user.findUnique({
      where: {
        phone_instituteId: {
          phone: dto.phone,
          instituteId: targetInstituteId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('users.userAlreadyExists', locale),
      );
    }

    const rawPassword = dto.password || dto.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const courseIds = await this.qualifications.validateCourseIds(
      targetInstituteId,
      dto.courseIds,
      locale,
    );

    let defaultBranchId: string | null = null;
    if (dto.availabilities && dto.availabilities.length > 0) {
      const explicitBranchIds = Array.from(
        new Set(
          dto.availabilities
            .map((s) => s.branchId)
            .filter((b): b is string => !!b),
        ),
      );
      if (explicitBranchIds.length > 0) {
        const foundBranches = await this.prisma.branch.findMany({
          where: {
            id: { in: explicitBranchIds },
            instituteId: targetInstituteId,
          },
          select: { id: true },
        });
        if (foundBranches.length !== explicitBranchIds.length) {
          throw new BadRequestException(
            this.i18n.t('branches.branchNotFound', locale),
          );
        }
      }

      const hasMissingBranch = dto.availabilities.some((s) => !s.branchId);
      if (hasMissingBranch) {
        const firstBranch = await this.prisma.branch.findFirst({
          where: { instituteId: targetInstituteId, isActive: true },
          select: { id: true },
        });
        if (!firstBranch) {
          throw new BadRequestException(
            this.i18n.t('branches.branchNotFound', locale),
          );
        }
        defaultBranchId = firstBranch.id;
      }
    }

    const availabilitiesData =
      dto.availabilities && dto.availabilities.length > 0
        ? {
            create: dto.availabilities.map((slot) => ({
              branchId: slot.branchId || defaultBranchId!,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          }
        : undefined;

    const teacher = await this.prisma.user.create({
      data: {
        instituteId: targetInstituteId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: ROLES.TEACHER,
        nationalCode: dto.nationalCode,
        avatarUrl,
        isActive: true,
        teacherProfile: {
          create: {
            bio: dto.bio,
            degree: dto.degree,
            specialties: dto.specialties || [],
            availabilities: availabilitiesData,
            teachableCourses:
              courseIds.length > 0
                ? {
                    create: courseIds.map((courseId) => ({
                      instituteId: targetInstituteId,
                      courseId,
                    })),
                  }
                : undefined,
          },
        },
      },
      include: {
        teacherProfile: {
          include: {
            availabilities: true,
            teachableCourses: {
              include: { course: { select: { id: true, title: true } } },
              orderBy: { course: { title: 'asc' } },
            },
          },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId: targetInstituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_CREATED',
      entityId: teacher.id,
      metadata: {
        name: `${teacher.firstName} ${teacher.lastName}`,
        phone: teacher.phone,
        courseIds,
      },
    });

    const { password: _password, ...safeTeacher } = teacher;
    return safeTeacher;
  }
}

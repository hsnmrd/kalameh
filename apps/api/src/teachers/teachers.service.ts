import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import {
  ROLES,
  type JwtPayload,
  type SupportedLocale,
  type TeacherLookupResponse,
} from '@workspace/types';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
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

    const availabilitiesData =
      dto.availabilities && dto.availabilities.length > 0
        ? {
            create: dto.availabilities.map((slot) => ({
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
          },
        },
      },
      include: {
        teacherProfile: {
          include: {
            availabilities: true,
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
      },
    });

    const { password, ...safeTeacher } = teacher;
    return safeTeacher;
  }

  async findAll(
    currentUser: JwtPayload,
    query: {
      search?: string;
      isActive?: boolean;
      instituteId?: string;
    },
    _locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && query.instituteId
        ? query.instituteId
        : currentUser.instituteId;

    const where: Record<string, unknown> = {
      role: ROLES.TEACHER,
      ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { nationalCode: { contains: s } },
      ];
    }

    const teachers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          include: {
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
        _count: {
          select: {
            teachingClasses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teachers.map((t) => {
      const { _count, ...rest } = t;
      return {
        ...rest,
        classesCount: _count.teachingClasses,
      };
    });
  }

  async findOne(
    currentUser: JwtPayload,
    id: string,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          include: {
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
        teachingClasses: {
          select: {
            id: true,
            title: true,
            schedule: true,
            term: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            teachingClasses: true,
          },
        },
      },
    });

    const { _count, ...rest } = teacher;
    return {
      ...rest,
      classesCount: _count.teachingClasses,
    };
  }

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

    // Update profile & availabilities
    const hasProfileUpdate =
      dto.bio !== undefined ||
      dto.degree !== undefined ||
      dto.specialties !== undefined ||
      dto.availabilities !== undefined;

    if (hasProfileUpdate) {
      const profile = await this.prisma.teacherProfile.upsert({
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
        await this.prisma.$transaction(async (tx) => {
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
        });
      }
    }

    const updated = await this.prisma.user.update({
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
          },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_UPDATED',
      entityId: id,
      metadata: {
        fields: Object.keys(dto),
      },
    });

    const { password, ...safeTeacher } = updated;
    return safeTeacher;
  }

  async resetPassword(
    currentUser: JwtPayload,
    id: string,
    newPassword?: string,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
    });

    const rawPassword = newPassword?.trim() || teacher.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.prisma.user.update({
      where: {
        id,
        instituteId: teacher.instituteId,
      },
      data: { password: hashedPassword },
    });

    await this.auditLogsService.log({
      instituteId: teacher.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_PASSWORD_RESET',
      entityId: id,
      metadata: { phone: teacher.phone },
    });

    return { success: true };
  }

  async remove(
    currentUser: JwtPayload,
    id: string,
    locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        _count: {
          select: { teachingClasses: true },
        },
      },
    });

    if (teacher._count.teachingClasses > 0) {
      // Soft-deactivate if classes are associated
      await this.prisma.user.update({
        where: {
          id,
          instituteId: teacher.instituteId,
        },
        data: { isActive: false },
      });
      return { success: true, deactivated: true };
    }

    await this.prisma.user.delete({
      where: {
        id,
        instituteId: teacher.instituteId,
      },
    });

    await this.auditLogsService.log({
      instituteId: teacher.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_DELETED',
      entityId: id,
      metadata: { phone: teacher.phone },
    });

    return { success: true, deleted: true };
  }

  async lookup(
    currentUser: JwtPayload,
    nationalCode?: string,
    phone?: string,
  ): Promise<TeacherLookupResponse> {
    if (!nationalCode && !phone) {
      return { found: false, teacher: null };
    }

    const where: Record<string, unknown> = {
      role: ROLES.TEACHER,
      ...(currentUser.role === ROLES.SUPER_ADMIN
        ? {}
        : { instituteId: currentUser.instituteId }),
    };

    if (nationalCode) {
      where.nationalCode = nationalCode;
    } else if (phone) {
      where.phone = phone;
    }

    const teacher = await this.prisma.user.findFirst({
      where,
      include: {
        teacherProfile: true,
      },
    });

    if (!teacher) {
      return { found: false, teacher: null };
    }

    return {
      found: true,
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        nationalCode: teacher.nationalCode,
        avatarUrl: teacher.avatarUrl,
        bio: teacher.teacherProfile?.bio ?? null,
        degree: teacher.teacherProfile?.degree ?? null,
      },
    };
  }
}

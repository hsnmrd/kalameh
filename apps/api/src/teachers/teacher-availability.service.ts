import { Injectable } from '@nestjs/common';
import { ROLES, type JwtPayload, type SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReplaceTeacherAvailabilitiesDto } from './dto/replace-teacher-availabilities.dto';

@Injectable()
export class TeacherAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getAvailabilities(
    currentUser: JwtPayload,
    teacherId: string,
    termId?: string,
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id: teacherId,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        teacherProfile: true,
      },
    });

    if (!teacher.teacherProfile) {
      return [];
    }

    if (termId) {
      const termAvailabilities = await this.prisma.teacherAvailability.findMany(
        {
          where: {
            teacherProfileId: teacher.teacherProfile.id,
            termId,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      );

      if (termAvailabilities.length > 0) {
        return termAvailabilities;
      }

      return this.prisma.teacherAvailability.findMany({
        where: {
          teacherProfileId: teacher.teacherProfile.id,
          termId: null,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    }

    return this.prisma.teacherAvailability.findMany({
      where: { teacherProfileId: teacher.teacherProfile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceAvailabilities(
    currentUser: JwtPayload,
    teacherId: string,
    dto: ReplaceTeacherAvailabilitiesDto,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id: teacherId,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        teacherProfile: true,
      },
    });

    const profile =
      teacher.teacherProfile ||
      (await this.prisma.teacherProfile.create({
        data: {
          userId: teacher.id,
        },
      }));

    const availabilities = await this.prisma.$transaction(async (tx) => {
      await tx.teacherAvailability.deleteMany({
        where: {
          teacherProfileId: profile.id,
          ...(dto.termId !== undefined ? { termId: dto.termId } : {}),
        },
      });

      if (dto.availabilities.length > 0) {
        await tx.teacherAvailability.createMany({
          data: dto.availabilities.map((slot) => ({
            teacherProfileId: profile.id,
            termId: slot.termId ?? dto.termId ?? null,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }

      return tx.teacherAvailability.findMany({
        where: {
          teacherProfileId: profile.id,
          ...(dto.termId !== undefined ? { termId: dto.termId } : {}),
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });

    await this.auditLogsService.log({
      instituteId: teacher.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_AVAILABILITY_UPDATED',
      entityId: teacher.id,
      metadata: {
        count: dto.availabilities.length,
        termId: dto.termId ?? null,
      },
    });

    return availabilities;
  }
}

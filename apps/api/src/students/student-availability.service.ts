import { Injectable } from '@nestjs/common';
import { ROLES, type JwtPayload, type SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentAvailabilitiesDto } from './dto/update-student-availabilities.dto';

@Injectable()
export class StudentAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getAvailabilities(
    currentUser: JwtPayload,
    studentId: string,
    operatingPhaseId?: string,
  ) {
    const student = await this.prisma.user.findFirstOrThrow({
      where: {
        id: studentId,
        role: ROLES.STUDENT,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        studentProfile: true,
      },
    });

    if (!student.studentProfile) {
      return [];
    }

    return this.prisma.studentAvailability.findMany({
      where: {
        studentProfileId: student.studentProfile.id,
        ...(operatingPhaseId ? { operatingPhaseId } : {}),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateAvailabilities(
    currentUser: JwtPayload,
    studentId: string,
    dto: UpdateStudentAvailabilitiesDto,
    _locale: SupportedLocale = 'fa',
  ) {
    const student = await this.prisma.user.findFirstOrThrow({
      where: {
        id: studentId,
        role: ROLES.STUDENT,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        studentProfile: true,
      },
    });

    await this.prisma.instituteOperatingPhase.findFirstOrThrow({
      where: {
        id: dto.operatingPhaseId,
        instituteId: student.instituteId,
      },
    });

    const profile =
      student.studentProfile ??
      (await this.prisma.studentProfile.create({
        data: {
          userId: student.id,
        },
      }));

    const availabilities = await this.prisma.$transaction(async (tx) => {
      await tx.studentAvailability.deleteMany({
        where: {
          studentProfileId: profile.id,
          operatingPhaseId: dto.operatingPhaseId,
        },
      });

      if (dto.availabilities.length > 0) {
        await tx.studentAvailability.createMany({
          data: dto.availabilities.map((slot) => ({
            studentProfileId: profile.id,
            operatingPhaseId: dto.operatingPhaseId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }

      const totalAvailabilitiesCount = await tx.studentAvailability.count({
        where: { studentProfileId: profile.id },
      });

      const newScheduleStatus =
        totalAvailabilitiesCount > 0 ? 'COMPLETE' : 'INCOMPLETE';

      await tx.studentProfile.update({
        where: { id: profile.id },
        data: { scheduleStatus: newScheduleStatus },
      });

      return tx.studentAvailability.findMany({
        where: {
          studentProfileId: profile.id,
          operatingPhaseId: dto.operatingPhaseId,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });

    await this.auditLogsService.log({
      instituteId: student.instituteId,
      userId: currentUser.sub,
      module: 'STUDENT',
      action: 'STUDENT_AVAILABILITY_UPDATED',
      entityId: student.id,
      metadata: {
        operatingPhaseId: dto.operatingPhaseId,
        count: dto.availabilities.length,
      },
    });

    return availabilities;
  }
}

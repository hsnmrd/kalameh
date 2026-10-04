import { Injectable } from '@nestjs/common';
import {
  ROLES,
  calculatePhaseSlots,
  type JwtPayload,
  type SetAllStudentsAvailableResponse,
  type SupportedLocale,
  type WeekDay,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentAvailabilitiesDto } from './dto/update-student-availabilities.dto';
import { SetAllStudentsAvailableDto } from './dto/set-all-students-available.dto';

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

  async setAllStudentsAvailable(
    currentUser: JwtPayload,
    dto: SetAllStudentsAvailableDto,
    _locale: SupportedLocale = 'fa',
  ): Promise<SetAllStudentsAvailableResponse> {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    const phase = await this.prisma.instituteOperatingPhase.findFirstOrThrow({
      where: {
        id: dto.operatingPhaseId,
        instituteId: targetInstituteId,
      },
    });

    const calculation = calculatePhaseSlots(
      phase.startTime,
      phase.endTime,
      phase.slotDurationMinutes,
      {
        hasBreak: phase.hasBreak,
        breakStartTime: phase.breakStartTime,
        breakEndTime: phase.breakEndTime,
      },
    );

    const phaseSlots = calculation.slots;
    const phaseDays = (phase.daysOfWeek as WeekDay[]) || [];

    const students = await this.prisma.user.findMany({
      where: {
        instituteId: targetInstituteId,
        role: ROLES.STUDENT,
      },
      include: {
        studentProfile: true,
      },
    });

    if (students.length === 0) {
      return {
        success: true,
        studentCount: 0,
        slotsPerStudent: 0,
      };
    }

    const slotsPerStudent = phaseDays.length * phaseSlots.length;

    await this.prisma.$transaction(async (tx) => {
      const profileIds: string[] = [];

      for (const student of students) {
        if (!student.studentProfile) {
          const profile = await tx.studentProfile.create({
            data: {
              userId: student.id,
            },
          });
          profileIds.push(profile.id);
        } else {
          profileIds.push(student.studentProfile.id);
        }
      }

      await tx.studentAvailability.deleteMany({
        where: {
          studentProfileId: { in: profileIds },
          operatingPhaseId: dto.operatingPhaseId,
        },
      });

      if (slotsPerStudent > 0) {
        const slotsToCreate: {
          studentProfileId: string;
          operatingPhaseId: string;
          dayOfWeek: string;
          startTime: string;
          endTime: string;
        }[] = [];

        for (const profileId of profileIds) {
          for (const day of phaseDays) {
            for (const slot of phaseSlots) {
              slotsToCreate.push({
                studentProfileId: profileId,
                operatingPhaseId: dto.operatingPhaseId,
                dayOfWeek: day,
                startTime: slot.startTime,
                endTime: slot.endTime,
              });
            }
          }
        }

        const chunkSize = 5000;
        for (let i = 0; i < slotsToCreate.length; i += chunkSize) {
          await tx.studentAvailability.createMany({
            data: slotsToCreate.slice(i, i + chunkSize),
          });
        }

        await tx.studentProfile.updateMany({
          where: {
            id: { in: profileIds },
          },
          data: {
            scheduleStatus: 'COMPLETE',
          },
        });
      }
    });

    await this.auditLogsService.log({
      instituteId: targetInstituteId,
      userId: currentUser.sub,
      module: 'STUDENT',
      action: 'ALL_STUDENTS_AVAILABILITY_SET',
      entityId: dto.operatingPhaseId,
      metadata: {
        operatingPhaseId: dto.operatingPhaseId,
        studentCount: students.length,
        slotsPerStudent,
      },
    });

    return {
      success: true,
      studentCount: students.length,
      slotsPerStudent,
    };
  }
}

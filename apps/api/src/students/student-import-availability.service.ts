import { Injectable } from '@nestjs/common';
import { calculatePhaseSlots, type WeekDay } from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentImportAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async seedImportedStudentsAvailability(
    instituteId: string,
    phones: string[],
  ): Promise<void> {
    if (!phones.length) return;

    const activePhases = await this.prisma.instituteOperatingPhase.findMany({
      where: { instituteId, isActive: true },
    });

    if (activePhases.length === 0) return;

    const createdProfiles = await this.prisma.studentProfile.findMany({
      where: {
        user: {
          instituteId,
          phone: { in: phones },
        },
      },
      select: { id: true },
    });

    if (createdProfiles.length === 0) return;

    const importSlots: {
      studentProfileId: string;
      operatingPhaseId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }[] = [];

    for (const phase of activePhases) {
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
      const days = (phase.daysOfWeek as WeekDay[]) || [];
      for (const prof of createdProfiles) {
        for (const day of days) {
          for (const slot of calculation.slots) {
            importSlots.push({
              studentProfileId: prof.id,
              operatingPhaseId: phase.id,
              dayOfWeek: day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        }
      }
    }

    if (importSlots.length > 0) {
      const chunkSize = 5000;
      for (let i = 0; i < importSlots.length; i += chunkSize) {
        await this.prisma.studentAvailability.createMany({
          data: importSlots.slice(i, i + chunkSize),
          skipDuplicates: true,
        });
      }
      await this.prisma.studentProfile.updateMany({
        where: { id: { in: createdProfiles.map((p) => p.id) } },
        data: { scheduleStatus: 'COMPLETE' },
      });
    }
  }
}

import { Injectable } from '@nestjs/common';
import {
  calculatePhaseSlots,
  EVEN_CLASS_DAYS,
  ODD_CLASS_DAYS,
  type WeekDay,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';

function isSlotMatchingShift(
  slot: { startTime: string; endTime: string },
  shift: 'MORNING' | 'AFTERNOON' | 'FLEXIBLE',
  isSchoolCalendarAware: boolean,
): boolean {
  if (!isSchoolCalendarAware || shift === 'FLEXIBLE') return true;
  // School in MORNING -> Free for language institute classes from 13:00 onwards
  if (shift === 'MORNING') return slot.startTime >= '13:00';
  // School in AFTERNOON -> Free for language institute classes until 13:00
  if (shift === 'AFTERNOON') return slot.endTime <= '13:00';
  return true;
}

function isDayMatchingPreference(
  day: WeekDay,
  dayPreference: 'EVEN_DAYS' | 'ODD_DAYS' | 'ANY',
): boolean {
  if (dayPreference === 'EVEN_DAYS') {
    return (EVEN_CLASS_DAYS as readonly string[]).includes(day);
  }
  if (dayPreference === 'ODD_DAYS') {
    return (ODD_CLASS_DAYS as readonly string[]).includes(day);
  }
  return true;
}

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
      select: {
        id: true,
        schoolShift: true,
        dayPreference: true,
      },
    });

    if (createdProfiles.length === 0) return;

    const importSlots: {
      studentProfileId: string;
      operatingPhaseId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }[] = [];

    const profilesWithSlots = new Set<string>();

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
      const isSchoolCalendarAware = phase.isSchoolCalendarAware ?? true;

      for (const prof of createdProfiles) {
        const studentShift = prof.schoolShift ?? 'FLEXIBLE';
        const studentDayPref = prof.dayPreference ?? 'ANY';

        for (const day of days) {
          if (!isDayMatchingPreference(day, studentDayPref)) continue;

          for (const slot of calculation.slots) {
            if (
              !isSlotMatchingShift(slot, studentShift, isSchoolCalendarAware)
            ) {
              continue;
            }

            importSlots.push({
              studentProfileId: prof.id,
              operatingPhaseId: phase.id,
              dayOfWeek: day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
            profilesWithSlots.add(prof.id);
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

      if (profilesWithSlots.size > 0) {
        await this.prisma.studentProfile.updateMany({
          where: { id: { in: Array.from(profilesWithSlots) } },
          data: { scheduleStatus: 'COMPLETE' },
        });
      }
    }
  }
}

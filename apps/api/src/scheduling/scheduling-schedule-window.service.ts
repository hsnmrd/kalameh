import { Injectable } from '@nestjs/common';
import {
  calculatePhaseSlots,
  type PhaseGeneratedSlot,
  type WeekDay,
} from '@workspace/types';

export type SchedulingWindowOperatingPhase = {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  daysOfWeek: string[];
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
};

export type SchedulingWindowClass = {
  classroomId: string | null;
  daysOfWeek: string[];
  sessionDates: string[];
  startTime: string | null;
  endTime: string | null;
  blocksNewTeacher?: boolean;
};

@Injectable()
export class SchedulingScheduleWindowService {
  phaseSlots(
    phase: SchedulingWindowOperatingPhase,
    slotDurationMinutes = phase.slotDurationMinutes,
  ): PhaseGeneratedSlot[] {
    return calculatePhaseSlots(
      phase.startTime,
      phase.endTime,
      slotDurationMinutes,
      {
        hasBreak: phase.hasBreak,
        breakStartTime: phase.breakStartTime,
        breakEndTime: phase.breakEndTime,
      },
    ).slots;
  }

  overlapsBreak(
    startTime: string,
    endTime: string,
    phase: SchedulingWindowOperatingPhase,
  ): boolean {
    return Boolean(
      phase.hasBreak &&
      phase.breakStartTime &&
      phase.breakEndTime &&
      startTime < phase.breakEndTime &&
      phase.breakStartTime < endTime,
    );
  }

  hasConflict(
    daysOfWeek: WeekDay[],
    startTime: string,
    endTime: string,
    scheduledClass: SchedulingWindowClass,
  ): boolean {
    if (!scheduledClass.startTime || !scheduledClass.endTime) return false;
    if (
      startTime >= scheduledClass.endTime ||
      scheduledClass.startTime >= endTime
    ) {
      return false;
    }
    return daysOfWeek.some(
      (day) =>
        scheduledClass.daysOfWeek.includes(day) ||
        scheduledClass.sessionDates.some(
          (date) => this.dayOfWeek(date) === day,
        ),
    );
  }

  toMinutes(time: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  toTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }

  private dayOfWeek(sessionDate: string): WeekDay | null {
    const date = new Date(`${sessionDate.slice(0, 10)}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getUTCDay()] as WeekDay;
  }
}

import { Injectable } from '@nestjs/common';
import type {
  SchedulingEngineSettingsSnapshot,
  WeekDay,
} from '@workspace/types';
import {
  SchedulingScheduleWindowService,
  type SchedulingWindowOperatingPhase,
} from './scheduling-schedule-window.service';

type NewTeacherPreferenceInput = {
  settings: SchedulingEngineSettingsSnapshot;
  operatingPhase: SchedulingWindowOperatingPhase;
};

@Injectable()
export class SchedulingNewTeacherPreferenceService {
  constructor(
    private readonly windowService: SchedulingScheduleWindowService,
  ) {}

  dayGroups(input: NewTeacherPreferenceInput): WeekDay[][] {
    const phaseDays = new Set(input.operatingPhase.daysOfWeek);
    const configuredGroups = [
      [...input.settings.timeGroups.oddDays],
      [...input.settings.timeGroups.evenDays],
      [...input.settings.timeGroups.neutralDays],
    ].filter(
      (days): days is WeekDay[] =>
        days.length > 0 && days.every((day) => phaseDays.has(day)),
    );

    return Array.from(
      new Map(configuredGroups.map((days) => [days.join('-'), days])).values(),
    );
  }

  isPreferredThreeDayPattern(
    input: NewTeacherPreferenceInput,
    daysOfWeek: WeekDay[],
  ): boolean {
    return [
      input.settings.timeGroups.oddDays,
      input.settings.timeGroups.evenDays,
    ].some(
      (preferredDays) =>
        preferredDays.length === 3 &&
        preferredDays.every((day, index) => day === daysOfWeek[index]),
    );
  }

  advancePastBreak(
    cursor: number,
    durationMinutes: number,
    phase: SchedulingWindowOperatingPhase,
  ): number | null {
    let adjustedCursor = cursor;
    if (phase.hasBreak && phase.breakStartTime && phase.breakEndTime) {
      const breakStart = this.windowService.toMinutes(phase.breakStartTime);
      const breakEnd = this.windowService.toMinutes(phase.breakEndTime);
      if (
        breakStart !== null &&
        breakEnd !== null &&
        adjustedCursor < breakEnd &&
        adjustedCursor + durationMinutes > breakStart
      ) {
        adjustedCursor = breakEnd;
      }
    }
    const phaseEnd = this.windowService.toMinutes(phase.endTime);
    return phaseEnd !== null && adjustedCursor + durationMinutes <= phaseEnd
      ? adjustedCursor
      : null;
  }
}

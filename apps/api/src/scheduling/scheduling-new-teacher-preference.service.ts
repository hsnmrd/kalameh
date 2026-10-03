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

  subsetsOfSize<T>(items: T[], size: number, maxSubsets = 64): T[][] {
    if (size === items.length) return [items];
    const results: T[][] = [];
    const build = (start: number, current: T[]) => {
      if (results.length >= maxSubsets) return;
      if (current.length === size) {
        results.push(current);
        return;
      }
      if (items.length - start < size - current.length) return;
      for (let index = start; index < items.length; index += 1) {
        const item = items[index];
        if (item !== undefined) build(index + 1, [...current, item]);
      }
    };
    build(0, []);
    return results;
  }
}

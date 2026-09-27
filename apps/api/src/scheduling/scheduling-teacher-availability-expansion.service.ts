import { Injectable } from '@nestjs/common';
import {
  type SchedulingEngineInputSnapshot,
  type SchedulingEngineSettingsSnapshot,
  type SchedulingTeacherOutreachOption,
  type WeekDay,
} from '@workspace/types';
import type { SchedulingRecoveryPlanProposal } from './scheduling-recovery-option-builder.service';
import {
  SchedulingScheduleWindowService,
  type SchedulingWindowClass,
  type SchedulingWindowOperatingPhase,
} from './scheduling-schedule-window.service';

type ScheduledClass = SchedulingWindowClass & {
  teacherId: string | null;
};

type AvailabilityExpansionInput = {
  requirement: SchedulingEngineInputSnapshot['requirements'][number];
  snapshot: SchedulingEngineInputSnapshot;
  settings: SchedulingEngineSettingsSnapshot;
  proposals: SchedulingRecoveryPlanProposal[];
  operatingPhase: SchedulingWindowOperatingPhase | null;
  teacherById: Map<string, { id: string; firstName: string; lastName: string }>;
  classroomById: Map<string, { id: string; name: string; capacity: number }>;
};

@Injectable()
export class SchedulingTeacherAvailabilityExpansionService {
  constructor(
    private readonly windowService: SchedulingScheduleWindowService,
  ) {}

  analyze(
    input: AvailabilityExpansionInput,
  ): SchedulingTeacherOutreachOption[] {
    if (!input.operatingPhase) return [];

    const phase = input.operatingPhase;
    const phaseStart = this.windowService.toMinutes(phase.startTime);
    const phaseEnd = this.windowService.toMinutes(phase.endTime);
    if (phaseStart === null || phaseEnd === null || phaseStart >= phaseEnd) {
      return [];
    }

    const schedules: ScheduledClass[] = [
      ...input.snapshot.existingClasses,
      ...input.proposals.map((proposal) => ({
        teacherId: proposal.teacherId,
        classroomId: proposal.classroomId ?? null,
        daysOfWeek: proposal.daysOfWeek,
        sessionDates: [],
        startTime: proposal.startTime,
        endTime: proposal.endTime,
      })),
    ];
    const dayGroups = this.dayGroups(input.settings, phase.daysOfWeek);
    const rooms = this.compatibleRooms(input);
    const options = new Map<string, SchedulingTeacherOutreachOption>();

    for (const qualification of input.snapshot.teachers) {
      if (qualification.courseId !== input.requirement.courseId) continue;
      const profile = qualification.teacherProfile;
      if (
        !profile.user.isActive ||
        profile.user.role !== 'TEACHER' ||
        (input.requirement.branchId !== null &&
          profile.user.branchId !== null &&
          profile.user.branchId !== input.requirement.branchId)
      ) {
        continue;
      }
      const teacher = input.teacherById.get(profile.userId);
      if (!teacher) continue;

      for (const daysOfWeek of dayGroups) {
        for (
          let start = phaseStart;
          start + input.requirement.sessionDurationMinutes <= phaseEnd;
          start += input.settings.generation.candidateStepMinutes
        ) {
          const startTime = this.windowService.toTime(start);
          const endTime = this.windowService.toTime(
            start + input.requirement.sessionDurationMinutes,
          );
          if (this.windowService.overlapsBreak(startTime, endTime, phase)) {
            continue;
          }
          if (
            schedules.some(
              (scheduledClass) =>
                scheduledClass.teacherId === profile.userId &&
                this.windowService.hasConflict(
                  daysOfWeek,
                  startTime,
                  endTime,
                  scheduledClass,
                ),
            )
          ) {
            continue;
          }

          const availabilityChangeDays = daysOfWeek.filter(
            (day) =>
              !profile.availabilities.some(
                (availability) =>
                  availability.dayOfWeek === day &&
                  availability.startTime <= startTime &&
                  availability.endTime >= endTime,
              ),
          );
          if (availabilityChangeDays.length === 0) continue;

          const availableClassrooms = rooms.filter(
            (room) =>
              !schedules.some(
                (scheduledClass) =>
                  scheduledClass.classroomId === room.id &&
                  this.windowService.hasConflict(
                    daysOfWeek,
                    startTime,
                    endTime,
                    scheduledClass,
                  ),
              ),
          );
          const key = [
            input.requirement.id,
            profile.userId,
            daysOfWeek.join('-'),
            startTime,
            endTime,
          ].join(':');
          options.set(key, {
            key,
            teacher,
            deliveryMode: input.requirement.deliveryMode,
            daysOfWeek,
            startTime,
            endTime,
            availabilityChangeDays,
            availableClassrooms,
          });
        }
      }
    }

    return Array.from(options.values()).sort(
      (left, right) =>
        Number(
          left.deliveryMode === 'IN_PERSON' &&
            left.availableClassrooms.length === 0,
        ) -
          Number(
            right.deliveryMode === 'IN_PERSON' &&
              right.availableClassrooms.length === 0,
          ) ||
        left.availabilityChangeDays.length -
          right.availabilityChangeDays.length ||
        left.startTime.localeCompare(right.startTime) ||
        left.key.localeCompare(right.key),
    );
  }

  private dayGroups(
    settings: SchedulingEngineSettingsSnapshot,
    phaseDays: string[],
  ): WeekDay[][] {
    const allowedDays = new Set(phaseDays);
    return [
      [...settings.timeGroups.oddDays],
      [...settings.timeGroups.evenDays],
      [...settings.timeGroups.neutralDays],
    ].filter(
      (days): days is WeekDay[] =>
        days.length > 0 && days.every((day) => allowedDays.has(day)),
    );
  }

  private compatibleRooms(
    input: AvailabilityExpansionInput,
  ): Array<{ id: string; name: string; capacity: number }> {
    if (input.requirement.deliveryMode === 'ONLINE') return [];

    return input.snapshot.classrooms.flatMap((room) => {
      if (
        !room.isActive ||
        room.capacity < input.requirement.capacity ||
        (input.requirement.branchId !== null &&
          room.branchId !== null &&
          room.branchId !== input.requirement.branchId)
      ) {
        return [];
      }
      const reference = input.classroomById.get(room.id);
      return reference ? [reference] : [];
    });
  }
}

import { Injectable } from '@nestjs/common';
import {
  type SchedulingEngineInputSnapshot,
  type SchedulingEngineSettingsSnapshot,
  type SchedulingTeacherOutreachOption,
  type WeekDay,
} from '@workspace/types';
import type { SchedulingRecoveryPlanProposal } from './scheduling-recovery-option-builder.service';

type OperatingPhase = {
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
};

type ScheduledClass = {
  teacherId: string | null;
  classroomId: string | null;
  daysOfWeek: string[];
  sessionDates: string[];
  startTime: string | null;
  endTime: string | null;
};

type AvailabilityExpansionInput = {
  requirement: SchedulingEngineInputSnapshot['requirements'][number];
  snapshot: SchedulingEngineInputSnapshot;
  settings: SchedulingEngineSettingsSnapshot;
  proposals: SchedulingRecoveryPlanProposal[];
  operatingPhase: OperatingPhase | null;
  teacherById: Map<string, { id: string; firstName: string; lastName: string }>;
  classroomById: Map<string, { id: string; name: string; capacity: number }>;
};

@Injectable()
export class SchedulingTeacherAvailabilityExpansionService {
  analyze(
    input: AvailabilityExpansionInput,
  ): SchedulingTeacherOutreachOption[] {
    if (!input.operatingPhase) return [];

    const phase = input.operatingPhase;
    const phaseStart = this.toMinutes(phase.startTime);
    const phaseEnd = this.toMinutes(phase.endTime);
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
          const startTime = this.toTime(start);
          const endTime = this.toTime(
            start + input.requirement.sessionDurationMinutes,
          );
          if (this.overlapsBreak(startTime, endTime, phase)) continue;
          if (
            schedules.some(
              (scheduledClass) =>
                scheduledClass.teacherId === profile.userId &&
                this.hasConflict(
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
                  this.hasConflict(
                    daysOfWeek,
                    startTime,
                    endTime,
                    scheduledClass,
                  ),
              ),
          );
          if (
            input.requirement.deliveryMode === 'IN_PERSON' &&
            availableClassrooms.length === 0
          ) {
            continue;
          }

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

  private overlapsBreak(
    startTime: string,
    endTime: string,
    phase: OperatingPhase,
  ): boolean {
    return Boolean(
      phase.hasBreak &&
      phase.breakStartTime &&
      phase.breakEndTime &&
      startTime < phase.breakEndTime &&
      phase.breakStartTime < endTime,
    );
  }

  private hasConflict(
    days: WeekDay[],
    startTime: string,
    endTime: string,
    scheduledClass: ScheduledClass,
  ): boolean {
    if (!scheduledClass.startTime || !scheduledClass.endTime) return false;
    if (
      startTime >= scheduledClass.endTime ||
      scheduledClass.startTime >= endTime
    ) {
      return false;
    }
    return days.some(
      (day) =>
        scheduledClass.daysOfWeek.includes(day) ||
        scheduledClass.sessionDates.some(
          (sessionDate) => this.dayOfWeek(sessionDate) === day,
        ),
    );
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

  private toMinutes(time: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private toTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }
}

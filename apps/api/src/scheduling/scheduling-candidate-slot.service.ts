import { Injectable } from '@nestjs/common';
import {
  SchedulingCandidateSlotSchema,
  SchedulingTimeGroupSettingsSchema,
  type SchedulingCandidateSlot,
  type SchedulingTimeGroup,
  type SchedulingTimeGroupSettings,
  type WeekDay,
} from '@workspace/types';

type CandidateRequirement = {
  id: string;
  courseId: string;
  branchId: string | null;
  sessionDurationMinutes: number;
};

type CandidateQualification = {
  id: string;
  courseId: string;
  teacherProfile: {
    userId: string;
    availabilities: Array<{
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
  };
};

export type GenerateCandidateSlotsInput = {
  requirements: CandidateRequirement[];
  qualifications: CandidateQualification[];
  timeGroups: {
    readonly oddDays: readonly WeekDay[];
    readonly evenDays: readonly WeekDay[];
    readonly neutralDays: readonly WeekDay[];
    readonly eveningStartsAt: string;
    readonly timeZone: string;
  };
  stepMinutes?: number;
};

@Injectable()
export class SchedulingCandidateSlotService {
  generate(input: GenerateCandidateSlotsInput): SchedulingCandidateSlot[] {
    const timeGroups = SchedulingTimeGroupSettingsSchema.parse(
      input.timeGroups,
    );
    const stepMinutes = input.stepMinutes ?? 30;
    if (!Number.isInteger(stepMinutes) || stepMinutes < 5 || stepMinutes > 60) {
      throw new RangeError('candidate step must be an integer from 5 to 60');
    }

    const candidates = new Map<string, SchedulingCandidateSlot>();
    const requirements = [...input.requirements].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    const qualifications = [...input.qualifications].sort((left, right) =>
      left.id.localeCompare(right.id),
    );

    for (const requirement of requirements) {
      if (
        !Number.isInteger(requirement.sessionDurationMinutes) ||
        requirement.sessionDurationMinutes <= 0
      ) {
        throw new RangeError('session duration must be a positive integer');
      }

      for (const qualification of qualifications) {
        if (qualification.courseId !== requirement.courseId) continue;

        const availabilities = [
          ...qualification.teacherProfile.availabilities,
        ].sort((left, right) => left.id.localeCompare(right.id));

        for (const availability of availabilities) {
          const availabilityStart = this.toMinutes(availability.startTime);
          const availabilityEnd = this.toMinutes(availability.endTime);
          if (
            availabilityStart === null ||
            availabilityEnd === null ||
            availabilityStart >= availabilityEnd
          ) {
            continue;
          }

          for (
            let start = availabilityStart;
            start + requirement.sessionDurationMinutes <= availabilityEnd;
            start += stepMinutes
          ) {
            const startTime = this.toTime(start);
            const endTime = this.toTime(
              start + requirement.sessionDurationMinutes,
            );
            const key = [
              requirement.id,
              qualification.teacherProfile.userId,
              availability.dayOfWeek,
              startTime,
              endTime,
            ].join(':');
            const candidate = SchedulingCandidateSlotSchema.parse({
              key,
              requirementId: requirement.id,
              courseId: requirement.courseId,
              branchId: requirement.branchId,
              teacherId: qualification.teacherProfile.userId,
              qualificationId: qualification.id,
              availabilityId: availability.id,
              dayOfWeek: availability.dayOfWeek,
              startTime,
              endTime,
              durationMinutes: requirement.sessionDurationMinutes,
              timeGroup: this.resolveTimeGroup(
                availability.dayOfWeek as WeekDay,
                startTime,
                timeGroups,
              ),
            });
            const existing = candidates.get(key);
            if (
              !existing ||
              candidate.availabilityId.localeCompare(existing.availabilityId) <
                0
            ) {
              candidates.set(key, candidate);
            }
          }
        }
      }
    }

    return Array.from(candidates.values()).sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }

  private resolveTimeGroup(
    dayOfWeek: WeekDay,
    startTime: string,
    settings: SchedulingTimeGroupSettings,
  ): SchedulingTimeGroup {
    const dayGroup = settings.oddDays.includes(dayOfWeek)
      ? 'ODD'
      : settings.evenDays.includes(dayOfWeek)
        ? 'EVEN'
        : 'NEUTRAL';
    const timeGroup =
      startTime < settings.eveningStartsAt ? 'MORNING' : 'EVENING';

    return `${dayGroup}_${timeGroup}` as SchedulingTimeGroup;
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

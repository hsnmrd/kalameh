import { Injectable } from '@nestjs/common';
import {
  SchedulingTeacherCalendarSchema,
  WEEK_DAYS,
  type SchedulingTeacherCalendar,
  type WeekDay,
} from '@workspace/types';

type TeacherAvailability = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

type TeacherReference = {
  id: string;
  firstName: string;
  lastName: string;
  availabilities?: TeacherAvailability[];
  teachableCourses?: Array<{ id: string; title: string }>;
};

type TeacherQualification = {
  courseId: string;
  teacherProfile: {
    userId: string;
    availabilities: TeacherAvailability[];
  };
};

type ScheduledClass = {
  id: string;
  teacherId: string | null;
  daysOfWeek: string[];
  sessionDates: string[];
  startTime: string | null;
  endTime: string | null;
};

type PlanClass = {
  id: string;
  title: string;
  teacherId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
};

type TimeWindow = {
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
};

type BusySlot = TimeWindow & {
  id: string;
  title: string | null;
  source: 'PLAN' | 'EXISTING_CLASS';
};

type BuildTeacherCalendarsInput = {
  courseId: string | null;
  additionalTeacherIds?: string[];
  qualifications: TeacherQualification[];
  teachers: TeacherReference[];
  proposals: PlanClass[];
  existingClasses: ScheduledClass[];
  existingClassTitles: Map<string, string>;
};

@Injectable()
export class SchedulingTeacherCalendarService {
  build(input: BuildTeacherCalendarsInput): SchedulingTeacherCalendar[] {
    const teacherById = new Map(
      input.teachers.map((teacher) => [teacher.id, teacher]),
    );
    const teacherIds =
      input.courseId === null
        ? input.teachers.map(({ id }) => id)
        : Array.from(
            new Set([
              ...input.qualifications
                .filter(({ courseId }) => courseId === input.courseId)
                .map(({ teacherProfile }) => teacherProfile.userId),
              ...(input.additionalTeacherIds ?? []),
            ]),
          );
    teacherIds.sort((leftId, rightId) => {
      const left = teacherById.get(leftId);
      const right = teacherById.get(rightId);
      return (
        (left?.lastName ?? '').localeCompare(right?.lastName ?? '') ||
        (left?.firstName ?? '').localeCompare(right?.firstName ?? '') ||
        leftId.localeCompare(rightId)
      );
    });

    return teacherIds.flatMap((teacherId) => {
      const teacher = teacherById.get(teacherId);
      if (!teacher) return [];
      const availability = this.availabilityForTeacher(input, teacherId);
      const busy = this.busyForTeacher(input, teacherId);
      const free = availability.flatMap((window) =>
        this.subtractBusy(window, busy),
      );
      const slots = [
        ...busy.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'BUSY' as const,
          title: slot.title,
          source: slot.source,
        })),
        ...free.map((slot) => ({
          ...slot,
          status: 'FREE' as const,
          title: null,
          source: 'AVAILABILITY' as const,
        })),
      ].sort(
        (left, right) =>
          WEEK_DAYS.indexOf(left.dayOfWeek) -
            WEEK_DAYS.indexOf(right.dayOfWeek) ||
          left.startTime.localeCompare(right.startTime) ||
          left.endTime.localeCompare(right.endTime) ||
          left.status.localeCompare(right.status),
      );

      return [
        SchedulingTeacherCalendarSchema.parse({
          teacher,
          teachableCourses: teacher.teachableCourses ?? [],
          slots,
        }),
      ];
    });
  }

  private availabilityForTeacher(
    input: BuildTeacherCalendarsInput,
    teacherId: string,
  ): TimeWindow[] {
    const source =
      input.courseId === null
        ? (input.teachers.find(({ id }) => id === teacherId)?.availabilities ??
          [])
        : input.qualifications
            .filter(({ teacherProfile }) => teacherProfile.userId === teacherId)
            .flatMap(({ teacherProfile }) => teacherProfile.availabilities);
    const windows = source.map((availability) => ({
      dayOfWeek: availability.dayOfWeek as WeekDay,
      startTime: availability.startTime,
      endTime: availability.endTime,
    }));

    return this.mergeWindows(windows);
  }

  private busyForTeacher(
    input: BuildTeacherCalendarsInput,
    teacherId: string,
  ): BusySlot[] {
    const planSlots = input.proposals
      .filter((proposal) => proposal.teacherId === teacherId)
      .flatMap((proposal) =>
        proposal.daysOfWeek.map((dayOfWeek) => ({
          id: proposal.id,
          dayOfWeek: dayOfWeek as WeekDay,
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          title: proposal.title,
          source: 'PLAN' as const,
        })),
      );
    const existingSlots = input.existingClasses
      .filter(
        (existingClass) =>
          existingClass.teacherId === teacherId &&
          existingClass.startTime !== null &&
          existingClass.endTime !== null,
      )
      .flatMap((existingClass) =>
        this.classDays(existingClass).map((dayOfWeek) => ({
          id: existingClass.id,
          dayOfWeek,
          startTime: existingClass.startTime!,
          endTime: existingClass.endTime!,
          title: input.existingClassTitles.get(existingClass.id) ?? null,
          source: 'EXISTING_CLASS' as const,
        })),
      );

    return Array.from(
      new Map(
        [...planSlots, ...existingSlots].map((slot) => [
          `${slot.source}:${slot.id}:${slot.dayOfWeek}:${slot.startTime}:${slot.endTime}`,
          slot,
        ]),
      ).values(),
    );
  }

  private subtractBusy(window: TimeWindow, busy: BusySlot[]): TimeWindow[] {
    const conflicts = busy
      .filter(
        (slot) =>
          slot.dayOfWeek === window.dayOfWeek &&
          slot.startTime < window.endTime &&
          window.startTime < slot.endTime,
      )
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
    const free: TimeWindow[] = [];
    let cursor = window.startTime;

    for (const conflict of conflicts) {
      const conflictStart = this.maxTime(cursor, conflict.startTime);
      const conflictEnd = this.minTime(window.endTime, conflict.endTime);
      if (cursor < conflictStart) {
        free.push({
          dayOfWeek: window.dayOfWeek,
          startTime: cursor,
          endTime: conflictStart,
        });
      }
      if (conflictEnd > cursor) cursor = conflictEnd;
      if (cursor >= window.endTime) break;
    }
    if (cursor < window.endTime) {
      free.push({
        dayOfWeek: window.dayOfWeek,
        startTime: cursor,
        endTime: window.endTime,
      });
    }

    return free;
  }

  private mergeWindows(windows: TimeWindow[]): TimeWindow[] {
    const merged: TimeWindow[] = [];
    for (const dayOfWeek of WEEK_DAYS) {
      for (const window of windows
        .filter((item) => item.dayOfWeek === dayOfWeek)
        .sort((left, right) => left.startTime.localeCompare(right.startTime))) {
        const previous = merged.at(-1);
        if (
          previous?.dayOfWeek === dayOfWeek &&
          window.startTime <= previous.endTime
        ) {
          previous.endTime = this.maxTime(previous.endTime, window.endTime);
        } else {
          merged.push({ ...window });
        }
      }
    }
    return merged;
  }

  private classDays(existingClass: ScheduledClass): WeekDay[] {
    return Array.from(
      new Set([
        ...existingClass.daysOfWeek.filter((day): day is WeekDay =>
          WEEK_DAYS.includes(day as WeekDay),
        ),
        ...existingClass.sessionDates.flatMap((date) => {
          const day = this.dayOfWeek(date);
          return day ? [day] : [];
        }),
      ]),
    );
  }

  private dayOfWeek(value: string): WeekDay | null {
    const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    const day = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getUTCDay()];
    return day as WeekDay;
  }

  private minTime(left: string, right: string): string {
    return left < right ? left : right;
  }

  private maxTime(left: string, right: string): string {
    return left > right ? left : right;
  }
}

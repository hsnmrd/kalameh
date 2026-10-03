import { Injectable } from '@nestjs/common';
import {
  findHigherLevelCourse,
  type CourseLevelNode,
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
  courses?: ReadonlyArray<CourseLevelNode>;
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
    const phaseSlots = this.windowService
      .phaseSlots(phase)
      .filter(
        (slot) =>
          slot.durationMinutes === input.requirement.sessionDurationMinutes,
      );
    if (phaseSlots.length === 0) return [];

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
    const courseById = new Map(
      (input.courses ?? []).map((course) => [course.id, course]),
    );
    const targetCourse = courseById.get(input.requirement.courseId);

    const teacherEntries = new Map<
      string,
      {
        profile: SchedulingEngineInputSnapshot['teachers'][number]['teacherProfile'];
        courseIds: Set<string>;
      }
    >();
    for (const qualification of input.snapshot.teachers) {
      const userId = qualification.teacherProfile.userId;
      const existing = teacherEntries.get(userId);
      if (existing) {
        existing.courseIds.add(qualification.courseId);
      } else {
        teacherEntries.set(userId, {
          profile: qualification.teacherProfile,
          courseIds: new Set([qualification.courseId]),
        });
      }
    }

    for (const { profile, courseIds } of teacherEntries.values()) {
      if (
        !profile.user.isActive ||
        profile.user.role !== 'TEACHER' ||
        (input.requirement.branchId !== null &&
          profile.user.branchId !== null &&
          profile.user.branchId !== input.requirement.branchId)
      ) {
        continue;
      }
      const isDirectlyQualified = courseIds.has(input.requirement.courseId);
      const teacherCourses = Array.from(courseIds)
        .map((id) => courseById.get(id))
        .filter((c): c is CourseLevelNode => c !== undefined);
      const higherLevelCourse =
        !isDirectlyQualified && targetCourse
          ? findHigherLevelCourse(targetCourse, teacherCourses, input.courses)
          : null;

      if (!isDirectlyQualified && !higherLevelCourse) {
        continue;
      }

      const teacher = input.teacherById.get(profile.userId);
      if (!teacher) continue;

      for (const daysOfWeek of dayGroups) {
        for (const phaseSlot of phaseSlots) {
          const startTime = phaseSlot.startTime;
          const endTime = phaseSlot.endTime;
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
          if (
            isDirectlyQualified
              ? availabilityChangeDays.length === 0
              : availabilityChangeDays.length > 0
          ) {
            continue;
          }

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
            ...(higherLevelCourse
              ? { higherLevelCourseTitle: higherLevelCourse.title }
              : {}),
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
        this.teacherScheduleGapMinutes(left, schedules) -
          this.teacherScheduleGapMinutes(right, schedules) ||
        left.startTime.localeCompare(right.startTime) ||
        left.key.localeCompare(right.key),
    );
  }

  private teacherScheduleGapMinutes(
    option: SchedulingTeacherOutreachOption,
    schedules: ScheduledClass[],
  ): number {
    const optionStart = this.windowService.toMinutes(option.startTime);
    const optionEnd = this.windowService.toMinutes(option.endTime);
    if (optionStart === null || optionEnd === null) {
      return Number.MAX_SAFE_INTEGER;
    }

    const gaps = schedules.flatMap((scheduledClass) => {
      if (
        scheduledClass.teacherId !== option.teacher.id ||
        !scheduledClass.startTime ||
        !scheduledClass.endTime ||
        !option.daysOfWeek.some((day) =>
          scheduledClass.daysOfWeek.includes(day),
        )
      ) {
        return [];
      }
      const classStart = this.windowService.toMinutes(scheduledClass.startTime);
      const classEnd = this.windowService.toMinutes(scheduledClass.endTime);
      if (classStart === null || classEnd === null) return [];
      if (classEnd <= optionStart) return [optionStart - classEnd];
      if (optionEnd <= classStart) return [classStart - optionEnd];
      return [];
    });

    return gaps.length > 0 ? Math.min(...gaps) : Number.MAX_SAFE_INTEGER;
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

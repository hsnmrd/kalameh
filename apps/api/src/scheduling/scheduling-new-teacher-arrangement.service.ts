import { Injectable } from '@nestjs/common';
import type {
  SchedulingNewTeacherHiringAssignment,
  WeekDay,
} from '@workspace/types';
import { SchedulingNewTeacherPreferenceService } from './scheduling-new-teacher-preference.service';
import { SchedulingScheduleWindowService } from './scheduling-schedule-window.service';
import type {
  NewTeacherArrangement,
  NewTeacherHiringWorkItem,
  OptimizeHiringPlanInput,
} from './scheduling-new-teacher.types';

@Injectable()
export class SchedulingNewTeacherArrangementService {
  constructor(
    private readonly windowService: SchedulingScheduleWindowService,
    private readonly preferenceService: SchedulingNewTeacherPreferenceService,
  ) {}

  best(
    input: OptimizeHiringPlanInput,
    daysOfWeek: WeekDay[],
    workItems: NewTeacherHiringWorkItem[],
  ): NewTeacherArrangement | null {
    const phaseStart = this.windowService.toMinutes(
      input.operatingPhase.startTime,
    );
    const phaseEnd = this.windowService.toMinutes(input.operatingPhase.endTime);
    if (phaseStart === null || phaseEnd === null) return null;
    const totalDuration = workItems.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    );
    const candidates: NewTeacherArrangement[] = [];

    for (
      let start = phaseStart;
      start + totalDuration <= phaseEnd;
      start += input.settings.generation.candidateStepMinutes
    ) {
      const arrangement = this.arrange(input, daysOfWeek, start, workItems);
      if (arrangement) candidates.push(arrangement);
    }

    return (
      candidates.sort(
        (left, right) =>
          left.gapMinutes - right.gapMinutes ||
          left.roomIssueCount - right.roomIssueCount ||
          left.roomChangeCount - right.roomChangeCount ||
          (left.assignments[0]?.startTime ?? '').localeCompare(
            right.assignments[0]?.startTime ?? '',
          ),
      )[0] ?? null
    );
  }

  private arrange(
    input: OptimizeHiringPlanInput,
    daysOfWeek: WeekDay[],
    startMinutes: number,
    workItems: NewTeacherHiringWorkItem[],
  ): NewTeacherArrangement | null {
    const failedStates = new Set<string>();
    let visitedStateCount = 0;

    const search = (
      remaining: NewTeacherHiringWorkItem[],
      cursor: number,
      previousRoomId: string | null,
      assignments: SchedulingNewTeacherHiringAssignment[],
      gapMinutes: number,
    ): NewTeacherArrangement | null => {
      visitedStateCount += 1;
      if (visitedStateCount > 10_000) return null;
      if (remaining.length === 0) {
        return {
          assignments,
          roomChangeCount: this.roomChangeCount(assignments),
          roomIssueCount: assignments.filter(
            ({ deliveryMode, classroom }) =>
              deliveryMode === 'IN_PERSON' && classroom === null,
          ).length,
          gapMinutes,
        };
      }
      const stateKey = `${cursor}:${previousRoomId ?? 'NONE'}:${remaining
        .map(({ key }) => key)
        .sort()
        .join('|')}`;
      if (failedStates.has(stateKey)) return null;

      const choices = remaining
        .flatMap((item) => {
          const adjustedCursor = this.preferenceService.advancePastBreak(
            cursor,
            item.durationMinutes,
            input.operatingPhase,
          );
          if (adjustedCursor === null) return [];
          const startTime = this.windowService.toTime(adjustedCursor);
          const endTime = this.windowService.toTime(
            adjustedCursor + item.durationMinutes,
          );
          const rooms = this.availableRooms(
            input,
            item,
            daysOfWeek,
            startTime,
            endTime,
          );
          return [{ item, startTime, endTime, rooms, adjustedCursor }];
        })
        .sort(
          (left, right) =>
            left.rooms.length - right.rooms.length ||
            right.item.durationMinutes - left.item.durationMinutes ||
            left.item.key.localeCompare(right.item.key),
        );

      for (const choice of choices) {
        const classroom =
          choice.item.deliveryMode === 'ONLINE'
            ? null
            : (choice.rooms.find(({ id }) => id === previousRoomId) ??
              choice.rooms[0] ??
              null);
        const result = search(
          remaining.filter(({ key }) => key !== choice.item.key),
          choice.adjustedCursor + choice.item.durationMinutes,
          classroom?.id ?? previousRoomId,
          [
            ...assignments,
            {
              key: choice.item.key,
              requirementId: choice.item.requirementId,
              course: choice.item.course,
              classNumber: choice.item.classNumber,
              deliveryMode: choice.item.deliveryMode,
              daysOfWeek,
              startTime: choice.startTime,
              endTime: choice.endTime,
              classroom,
            },
          ],
          gapMinutes + choice.adjustedCursor - cursor,
        );
        if (result) return result;
      }

      failedStates.add(stateKey);
      return null;
    };

    return search(workItems, startMinutes, null, [], 0);
  }

  private availableRooms(
    input: OptimizeHiringPlanInput,
    item: NewTeacherHiringWorkItem,
    daysOfWeek: WeekDay[],
    startTime: string,
    endTime: string,
  ) {
    if (item.deliveryMode === 'ONLINE') return [];
    return input.classrooms.filter(
      (room) =>
        room.isActive &&
        room.capacity >= item.capacity &&
        (item.branchId === null ||
          room.branchId === null ||
          room.branchId === item.branchId) &&
        !input.scheduledClasses.some(
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
  }

  private roomChangeCount(
    assignments: SchedulingNewTeacherHiringAssignment[],
  ): number {
    return assignments.slice(1).reduce((count, assignment, index) => {
      const previous = assignments[index];
      return (
        count + (previous?.classroom?.id === assignment.classroom?.id ? 0 : 1)
      );
    }, 0);
  }
}

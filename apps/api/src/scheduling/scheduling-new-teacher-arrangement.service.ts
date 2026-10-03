import { Injectable } from '@nestjs/common';
import type {
  PhaseGeneratedSlot,
  SchedulingNewTeacherHiringAssignment,
  WeekDay,
} from '@workspace/types';
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
  ) {}

  best(
    input: OptimizeHiringPlanInput,
    daysOfWeek: WeekDay[],
    workItems: NewTeacherHiringWorkItem[],
  ): NewTeacherArrangement | null {
    const phaseSlots = this.windowService.phaseSlots(
      input.operatingPhase,
      input.operatingPhase.slotDurationMinutes,
    );
    if (phaseSlots.length === 0) return null;
    const candidates: NewTeacherArrangement[] = [];

    for (let startIndex = 0; startIndex < phaseSlots.length; startIndex += 1) {
      const arrangement = this.arrange(
        input,
        daysOfWeek,
        phaseSlots,
        startIndex,
        workItems,
      );
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
    phaseSlots: PhaseGeneratedSlot[],
    startIndex: number,
    workItems: NewTeacherHiringWorkItem[],
  ): NewTeacherArrangement | null {
    const failedStates = new Set<string>();
    let visitedStateCount = 0;

    const search = (
      remaining: NewTeacherHiringWorkItem[],
      slotIndex: number,
      cursorMinutes: number,
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
      const stateKey = `${slotIndex}:${previousRoomId ?? 'NONE'}:${remaining
        .map(({ key }) => key)
        .sort()
        .join('|')}`;
      if (failedStates.has(stateKey)) return null;

      const slot = phaseSlots[slotIndex];
      if (!slot) return null;
      const slotStartMinutes = this.windowService.toMinutes(slot.startTime);
      const slotEndMinutes = this.windowService.toMinutes(slot.endTime);
      if (slotStartMinutes === null || slotEndMinutes === null) return null;

      const teacherBlocked = input.scheduledClasses.some(
        (scheduledClass) =>
          scheduledClass.blocksNewTeacher &&
          this.windowService.hasConflict(
            daysOfWeek,
            slot.startTime,
            slot.endTime,
            scheduledClass,
          ),
      );
      const choices = teacherBlocked
        ? []
        : remaining
            .flatMap((item) => {
              if (item.durationMinutes !== slot.durationMinutes) return [];
              const rooms = this.availableRooms(
                input,
                item,
                daysOfWeek,
                slot.startTime,
                slot.endTime,
              );
              if (item.deliveryMode === 'IN_PERSON' && rooms.length === 0) {
                return [];
              }
              return [{ item, slot, rooms }];
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
        if (choice.item.deliveryMode === 'IN_PERSON' && !classroom) {
          continue;
        }
        const result = search(
          remaining.filter(({ key }) => key !== choice.item.key),
          slotIndex + 1,
          slotEndMinutes,
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
              startTime: choice.slot.startTime,
              endTime: choice.slot.endTime,
              classroom,
            },
          ],
          gapMinutes + Math.max(0, slotStartMinutes - cursorMinutes),
        );
        if (result) return result;
      }

      if (
        assignments.length > 0 &&
        phaseSlots.length - (slotIndex + 1) >= remaining.length
      ) {
        const skipped = search(
          remaining,
          slotIndex + 1,
          cursorMinutes,
          previousRoomId,
          assignments,
          gapMinutes,
        );
        if (skipped) return skipped;
      }

      failedStates.add(stateKey);
      return null;
    };

    const firstSlot = phaseSlots[startIndex];
    if (!firstSlot) return null;
    const startMinutes = this.windowService.toMinutes(firstSlot.startTime);
    if (startMinutes === null) return null;

    return search(workItems, startIndex, startMinutes, null, [], 0);
  }

  placeableWorkItems(
    input: OptimizeHiringPlanInput,
    dayGroups: WeekDay[][],
  ): { items: NewTeacherHiringWorkItem[]; maxCount: number } {
    const phaseSlots = this.windowService.phaseSlots(
      input.operatingPhase,
      input.operatingPhase.slotDurationMinutes,
    );
    const canFit = (
      item: NewTeacherHiringWorkItem,
      daysOfWeek: WeekDay[],
      slot: PhaseGeneratedSlot,
    ) =>
      item.durationMinutes === slot.durationMinutes &&
      (item.deliveryMode === 'ONLINE' ||
        this.availableRooms(
          input,
          item,
          daysOfWeek,
          slot.startTime,
          slot.endTime,
        ).length > 0);

    const items = input.workItems.filter((item) =>
      dayGroups.some((daysOfWeek) =>
        phaseSlots.some((slot) => canFit(item, daysOfWeek, slot)),
      ),
    );
    const usableSlotCount = dayGroups.reduce(
      (count, daysOfWeek) =>
        count +
        phaseSlots.filter((slot) =>
          items.some((item) => canFit(item, daysOfWeek, slot)),
        ).length,
      0,
    );
    return { items, maxCount: Math.min(items.length, usableSlotCount) };
  }

  availableRooms(
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

import { Injectable } from '@nestjs/common';
import {
  SchedulingNewTeacherHiringPlanSchema,
  type SchedulingNewTeacherHiringAssignment,
  type SchedulingNewTeacherHiringPlan,
  type SchedulingNewTeacherHiringSlotOption,
  type WeekDay,
} from '@workspace/types';
import { SchedulingNewTeacherArrangementService } from './scheduling-new-teacher-arrangement.service';
import { SchedulingNewTeacherPreferenceService } from './scheduling-new-teacher-preference.service';
import { SchedulingScheduleWindowService } from './scheduling-schedule-window.service';
import type {
  NewTeacherArrangement,
  NewTeacherHiringWorkItem,
  OptimizeHiringPlanInput,
} from './scheduling-new-teacher.types';

export type { NewTeacherHiringWorkItem } from './scheduling-new-teacher.types';

type PlanCandidate = {
  plan: SchedulingNewTeacherHiringPlan;
  roomChangeCount: number;
  roomIssueCount: number;
  gapMinutes: number;
  dayPatternPenalty: number;
};

@Injectable()
export class SchedulingNewTeacherScheduleOptimizerService {
  constructor(
    private readonly windowService: SchedulingScheduleWindowService,
    private readonly preferenceService: SchedulingNewTeacherPreferenceService,
    private readonly arrangementService: SchedulingNewTeacherArrangementService,
  ) {}

  optimize(
    input: OptimizeHiringPlanInput,
  ): SchedulingNewTeacherHiringPlan | null {
    if (input.workItems.length === 0 || !this.hasValidPhase(input)) return null;

    const dayGroups = this.preferenceService.dayGroups(input);
    const singleGroupCandidates = dayGroups.flatMap((daysOfWeek) => {
      const arrangement = this.arrangementService.best(
        input,
        daysOfWeek,
        input.workItems,
      );
      return arrangement
        ? [this.toCandidate(input, [daysOfWeek], [arrangement])]
        : [];
    });
    const preferredSingleGroup = this.best(singleGroupCandidates);
    const bestPlan = preferredSingleGroup
      ? preferredSingleGroup.plan
      : (this.best(this.multiGroupCandidates(input, dayGroups))?.plan ?? null);

    if (!bestPlan) return null;

    const availableTimeSlots = this.computeAvailableTimeSlots(input);
    return SchedulingNewTeacherHiringPlanSchema.parse({
      ...bestPlan,
      availableTimeSlots,
    });
  }

  computeAvailableTimeSlots(
    input: OptimizeHiringPlanInput,
  ): SchedulingNewTeacherHiringSlotOption[] {
    const dayGroups = this.preferenceService.dayGroups(input);
    const phaseSlots = this.windowService.phaseSlots(
      input.operatingPhase,
      input.operatingPhase.slotDurationMinutes,
    );
    const slots: SchedulingNewTeacherHiringSlotOption[] = [];

    for (const daysOfWeek of dayGroups) {
      for (const phaseSlot of phaseSlots) {
        const availableClassrooms = input.classrooms
          .filter(
            (room) =>
              room.isActive &&
              !input.scheduledClasses.some(
                (scheduledClass) =>
                  scheduledClass.classroomId === room.id &&
                  this.windowService.hasConflict(
                    daysOfWeek,
                    phaseSlot.startTime,
                    phaseSlot.endTime,
                    scheduledClass,
                  ),
              ),
          )
          .map(({ id, name, capacity }) => ({ id, name, capacity }));

        slots.push({
          key: `${daysOfWeek.join(',')}|${phaseSlot.startTime}|${phaseSlot.endTime}`,
          daysOfWeek,
          startTime: phaseSlot.startTime,
          endTime: phaseSlot.endTime,
          availableClassrooms,
          isFullyBooked: availableClassrooms.length === 0,
        });
      }
    }

    return slots;
  }

  private multiGroupCandidates(
    input: OptimizeHiringPlanInput,
    dayGroups: WeekDay[][],
  ): PlanCandidate[] {
    const candidates: PlanCandidate[] = [];
    let visitedPartitions = 0;

    const assign = (
      itemIndex: number,
      buckets: NewTeacherHiringWorkItem[][],
    ): void => {
      visitedPartitions += 1;
      if (visitedPartitions > 10_000) return;
      if (itemIndex === input.workItems.length) {
        const usedGroupIndexes = dayGroups.flatMap((_, index) =>
          (buckets[index]?.length ?? 0) > 0 ? [index] : [],
        );
        if (usedGroupIndexes.length < 2) return;
        const arrangements = usedGroupIndexes.flatMap((groupIndex) => {
          const arrangement = this.arrangementService.best(
            input,
            dayGroups[groupIndex],
            buckets[groupIndex] ?? [],
          );
          return arrangement ? [arrangement] : [];
        });
        if (arrangements.length !== usedGroupIndexes.length) return;
        candidates.push(
          this.toCandidate(
            input,
            usedGroupIndexes.map((index) => dayGroups[index]),
            arrangements,
          ),
        );
        return;
      }

      const item = input.workItems[itemIndex];
      if (!item) return;
      dayGroups.forEach((_, groupIndex) => {
        const nextBuckets = buckets.map((bucket) => [...bucket]);
        nextBuckets[groupIndex]?.push(item);
        assign(itemIndex + 1, nextBuckets);
      });
    };

    assign(
      0,
      dayGroups.map(() => []),
    );
    return candidates;
  }

  private toCandidate(
    input: OptimizeHiringPlanInput,
    usedGroups: WeekDay[][],
    arrangements: NewTeacherArrangement[],
  ): PlanCandidate {
    const assignments = arrangements
      .flatMap(({ assignments: items }) => items)
      .sort(
        (left, right) =>
          this.groupOrder(usedGroups, left.daysOfWeek) -
            this.groupOrder(usedGroups, right.daysOfWeek) ||
          left.startTime.localeCompare(right.startTime),
      );
    const daysOfWeek = input.operatingPhase.daysOfWeek.filter((day) =>
      usedGroups.some((group) => group.includes(day as WeekDay)),
    ) as WeekDay[];
    const starts = assignments.map(({ startTime }) => startTime).sort();
    const ends = assignments.map(({ endTime }) => endTime).sort();
    const usesPreferredThreeDayPattern =
      usedGroups.length === 1 &&
      this.preferenceService.isPreferredThreeDayPattern(input, usedGroups[0]);
    const requiredCourses = Array.from(
      new Map(
        input.workItems.map((item) => [item.course.id, item.course]),
      ).values(),
    ).sort((left, right) => left.title.localeCompare(right.title));

    return {
      plan: SchedulingNewTeacherHiringPlanSchema.parse({
        daysOfWeek,
        startTime: starts[0],
        endTime: ends.at(-1),
        totalClassCount: assignments.length,
        requiredCourses,
        assignments,
        coversAllUnresolvedClasses: true,
        usesPreferredThreeDayPattern,
        hasConsecutiveTimes: arrangements.every(
          ({ gapMinutes }) => gapMinutes === 0,
        ),
      }),
      roomChangeCount: arrangements.reduce(
        (sum, { roomChangeCount }) => sum + roomChangeCount,
        0,
      ),
      roomIssueCount: arrangements.reduce(
        (sum, { roomIssueCount }) => sum + roomIssueCount,
        0,
      ),
      gapMinutes: arrangements.reduce(
        (sum, { gapMinutes }) => sum + gapMinutes,
        0,
      ),
      dayPatternPenalty: usesPreferredThreeDayPattern ? 0 : daysOfWeek.length,
    };
  }

  private best(candidates: PlanCandidate[]): PlanCandidate | null {
    return (
      candidates.sort(
        (left, right) =>
          left.dayPatternPenalty - right.dayPatternPenalty ||
          left.gapMinutes - right.gapMinutes ||
          left.roomIssueCount - right.roomIssueCount ||
          left.roomChangeCount - right.roomChangeCount ||
          left.plan.startTime.localeCompare(right.plan.startTime),
      )[0] ?? null
    );
  }

  private hasValidPhase(input: OptimizeHiringPlanInput): boolean {
    return (
      this.windowService.phaseSlots(
        input.operatingPhase,
        input.operatingPhase.slotDurationMinutes,
      ).length > 0
    );
  }

  private groupOrder(
    groups: WeekDay[][],
    assignmentDays: SchedulingNewTeacherHiringAssignment['daysOfWeek'],
  ): number {
    return groups.findIndex(
      (group) => group.join('-') === assignmentDays.join('-'),
    );
  }
}

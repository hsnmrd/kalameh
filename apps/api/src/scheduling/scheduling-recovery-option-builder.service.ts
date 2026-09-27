import { Injectable } from '@nestjs/common';
import {
  type SchedulingEngineSettingsSnapshot,
  type SchedulingFeasibleCandidate,
  type SchedulingRecoveryOption,
  type WeekDay,
} from '@workspace/types';

export type SchedulingRecoveryPlanProposal = {
  id: string;
  title: string;
  courseId: string;
  branchId?: string | null;
  teacherId: string;
  classroomId?: string | null;
  deliveryMode: 'IN_PERSON' | 'ONLINE';
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  isLocked: boolean;
  classroom?: { id: string; name: string; capacity: number } | null;
};

type CandidateGroup = {
  candidate: SchedulingFeasibleCandidate;
  assignments: SchedulingFeasibleCandidate[];
};

type BuildRecoveryOptionsInput = {
  requirementId: string;
  baseCandidates: SchedulingFeasibleCandidate[];
  currentCandidates: SchedulingFeasibleCandidate[];
  proposals: SchedulingRecoveryPlanProposal[];
  settings: SchedulingEngineSettingsSnapshot;
  teacherById: Map<string, { id: string; firstName: string; lastName: string }>;
  classroomById: Map<string, { id: string; name: string; capacity: number }>;
};

@Injectable()
export class SchedulingRecoveryOptionBuilderService {
  build(input: BuildRecoveryOptionsInput): {
    options: SchedulingRecoveryOption[];
    busyTeacherIds: Set<string>;
  } {
    const baseGroups = this.groupCandidates(input.baseCandidates);
    const currentGroups = this.groupCandidates(input.currentCandidates);
    const options: SchedulingRecoveryOption[] = [];
    const busyTeacherIds = new Set<string>();

    for (const group of baseGroups.values()) {
      if (group.candidate.requirementId !== input.requirementId) continue;
      const teacher = input.teacherById.get(group.candidate.teacherId);
      if (!teacher) continue;
      const current = currentGroups.get(group.candidate.key);
      const blockingClasses = current
        ? []
        : this.blockingClasses(group, input.proposals, input.settings);
      if (
        blockingClasses.some(({ conflictTypes }) =>
          conflictTypes.includes('TEACHER'),
        )
      ) {
        busyTeacherIds.add(group.candidate.teacherId);
        continue;
      }
      const availableClassrooms = (current?.assignments ?? group.assignments)
        .filter(
          ({ classroomId }) =>
            classroomId !== null &&
            !blockingClasses.some(
              (blocking) =>
                blocking.conflictTypes.includes('CLASSROOM') &&
                input.proposals.find(({ id }) => id === blocking.id)
                  ?.classroomId === classroomId,
            ),
        )
        .map(({ classroomId }) => input.classroomById.get(classroomId!))
        .filter((room): room is NonNullable<typeof room> => room !== undefined);

      options.push({
        key: group.candidate.key,
        status: current ? 'AVAILABLE_NOW' : 'REQUIRES_PLAN_CHANGE',
        deliveryMode: group.candidate.deliveryMode,
        daysOfWeek: this.candidateDays(
          group.candidate.timeGroup,
          input.settings,
        ),
        startTime: group.candidate.startTime,
        endTime: group.candidate.endTime,
        teacher,
        availableClassrooms: this.uniqueById(availableClassrooms),
        blockingClasses,
      });
    }

    return {
      options: options.sort(
        (left, right) =>
          left.status.localeCompare(right.status) ||
          left.blockingClasses.length - right.blockingClasses.length ||
          left.startTime.localeCompare(right.startTime) ||
          left.key.localeCompare(right.key),
      ),
      busyTeacherIds,
    };
  }

  private groupCandidates(
    candidates: SchedulingFeasibleCandidate[],
  ): Map<string, CandidateGroup> {
    const groups = new Map<string, CandidateGroup>();
    for (const candidate of candidates) {
      const group = groups.get(candidate.key);
      if (group) group.assignments.push(candidate);
      else groups.set(candidate.key, { candidate, assignments: [candidate] });
    }
    return groups;
  }

  private blockingClasses(
    group: CandidateGroup,
    proposals: SchedulingRecoveryPlanProposal[],
    settings: SchedulingEngineSettingsSnapshot,
  ): SchedulingRecoveryOption['blockingClasses'] {
    const days = this.candidateDays(group.candidate.timeGroup, settings);
    const classroomIds = new Set(
      group.assignments.flatMap(({ classroomId }) =>
        classroomId === null ? [] : [classroomId],
      ),
    );
    return proposals.flatMap((proposal) => {
      if (!this.overlaps(days, group.candidate, proposal)) return [];
      const conflictTypes: Array<'TEACHER' | 'CLASSROOM'> = [];
      if (proposal.teacherId === group.candidate.teacherId) {
        conflictTypes.push('TEACHER');
      }
      if (proposal.classroomId && classroomIds.has(proposal.classroomId)) {
        conflictTypes.push('CLASSROOM');
      }
      return conflictTypes.length === 0
        ? []
        : [
            {
              id: proposal.id,
              title: proposal.title,
              conflictTypes,
              classroom: proposal.classroom ?? null,
            },
          ];
    });
  }

  private overlaps(
    days: WeekDay[],
    candidate: SchedulingFeasibleCandidate,
    proposal: SchedulingRecoveryPlanProposal,
  ): boolean {
    return (
      days.some((day) => proposal.daysOfWeek.includes(day)) &&
      candidate.startTime < proposal.endTime &&
      proposal.startTime < candidate.endTime
    );
  }

  private candidateDays(
    timeGroup: SchedulingFeasibleCandidate['timeGroup'],
    settings: SchedulingEngineSettingsSnapshot,
  ): WeekDay[] {
    if (timeGroup.startsWith('EVEN')) return [...settings.timeGroups.evenDays];
    if (timeGroup.startsWith('ODD')) return [...settings.timeGroups.oddDays];
    return [...settings.timeGroups.neutralDays];
  }

  private uniqueById<T extends { id: string }>(items: T[]): T[] {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }
}

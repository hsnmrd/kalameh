import { Injectable } from '@nestjs/common';
import {
  type SchedulingEngineInputSnapshot,
  type SchedulingEngineSettingsSnapshot,
  type SchedulingFeasibleCandidate,
  type WeekDay,
} from '@workspace/types';
import type { SchedulingRecoveryPlanProposal } from './scheduling-recovery-option-builder.service';

export type TeacherReassignmentAnalysisInput = {
  requirementId: string;
  candidates: SchedulingFeasibleCandidate[];
  snapshot: SchedulingEngineInputSnapshot;
  settings: SchedulingEngineSettingsSnapshot;
  proposals: SchedulingRecoveryPlanProposal[];
  teacherById: Map<string, { id: string; firstName: string; lastName: string }>;
  classroomById: Map<string, { id: string; name: string; capacity: number }>;
};

export type TeacherReassignmentSearchState = {
  assignments: Map<string, string>;
  movedProposalIds: string[];
};

type Schedule = {
  courseId: string;
  branchId: string | null;
  daysOfWeek: readonly WeekDay[];
  startTime: string;
  endTime: string;
};

@Injectable()
export class SchedulingTeacherReassignmentValidatorService {
  qualifiedTeacherIds(
    proposal: SchedulingRecoveryPlanProposal,
    input: TeacherReassignmentAnalysisInput,
  ): string[] {
    const schedule = this.proposalSchedule(proposal);
    return Array.from(
      new Set(
        input.snapshot.teachers
          .filter(({ courseId }) => courseId === proposal.courseId)
          .map(({ teacherProfile }) => teacherProfile.userId)
          .filter((teacherId) => this.isEligible(teacherId, schedule, input)),
      ),
    ).sort();
  }

  isTargetEligible(
    target: SchedulingFeasibleCandidate,
    daysOfWeek: WeekDay[],
    input: TeacherReassignmentAnalysisInput,
  ): boolean {
    return this.isEligible(
      target.teacherId,
      {
        courseId: target.courseId,
        branchId: target.branchId,
        daysOfWeek,
        startTime: target.startTime,
        endTime: target.endTime,
      },
      input,
    );
  }

  validate(
    state: TeacherReassignmentSearchState,
    target: SchedulingFeasibleCandidate,
    targetDays: WeekDay[],
    input: TeacherReassignmentAnalysisInput,
    proposalsById: Map<string, SchedulingRecoveryPlanProposal>,
  ): boolean {
    if (state.movedProposalIds.length === 0) return false;
    for (const proposalId of state.movedProposalIds) {
      const proposal = proposalsById.get(proposalId);
      const teacherId = state.assignments.get(proposalId);
      if (
        !proposal ||
        !teacherId ||
        !this.isEligible(teacherId, this.proposalSchedule(proposal), input)
      ) {
        return false;
      }
    }

    const affected = new Set(state.movedProposalIds);
    for (let index = 0; index < input.proposals.length; index += 1) {
      const left = input.proposals[index];
      for (
        let otherIndex = index + 1;
        otherIndex < input.proposals.length;
        otherIndex += 1
      ) {
        const right = input.proposals[otherIndex];
        if (!affected.has(left.id) && !affected.has(right.id)) continue;
        if (
          state.assignments.get(left.id) === state.assignments.get(right.id) &&
          this.overlaps(left.daysOfWeek as WeekDay[], left, right)
        ) {
          return false;
        }
      }
    }

    return !input.proposals.some(
      (proposal) =>
        state.assignments.get(proposal.id) === target.teacherId &&
        this.overlaps(targetDays, target, proposal),
    );
  }

  hasRoomConflict(
    target: SchedulingFeasibleCandidate,
    days: WeekDay[],
    proposals: SchedulingRecoveryPlanProposal[],
  ): boolean {
    return (
      target.classroomId !== null &&
      proposals.some(
        (proposal) =>
          proposal.classroomId === target.classroomId &&
          this.overlaps(days, target, proposal),
      )
    );
  }

  conflictsWithTarget(
    teacherId: string,
    proposal: SchedulingRecoveryPlanProposal,
    target: SchedulingFeasibleCandidate,
    targetDays: WeekDay[],
  ): boolean {
    return (
      teacherId === target.teacherId &&
      this.overlaps(targetDays, target, proposal)
    );
  }

  overlaps(
    days: readonly WeekDay[],
    left: { startTime: string; endTime: string },
    right: { daysOfWeek: string[]; startTime: string; endTime: string },
  ): boolean {
    return (
      days.some((day) => right.daysOfWeek.includes(day)) &&
      left.startTime < right.endTime &&
      right.startTime < left.endTime
    );
  }

  candidateDays(
    candidate: SchedulingFeasibleCandidate,
    settings: SchedulingEngineSettingsSnapshot,
  ): WeekDay[] {
    if (candidate.timeGroup.startsWith('EVEN')) {
      return [...settings.timeGroups.evenDays];
    }
    if (candidate.timeGroup.startsWith('ODD')) {
      return [...settings.timeGroups.oddDays];
    }
    return [...settings.timeGroups.neutralDays];
  }

  private isEligible(
    teacherId: string,
    schedule: Schedule,
    input: TeacherReassignmentAnalysisInput,
  ): boolean {
    const qualification = input.snapshot.teachers.find(
      (item) =>
        item.courseId === schedule.courseId &&
        item.teacherProfile.userId === teacherId,
    );
    if (!qualification) return false;
    const teacher = qualification.teacherProfile.user;
    if (
      !teacher.isActive ||
      teacher.role !== 'TEACHER' ||
      (schedule.branchId !== null &&
        teacher.branchId !== null &&
        teacher.branchId !== schedule.branchId)
    ) {
      return false;
    }
    const availableEveryDay = schedule.daysOfWeek.every((dayOfWeek) =>
      qualification.teacherProfile.availabilities.some(
        (availability) =>
          availability.dayOfWeek === dayOfWeek &&
          availability.startTime <= schedule.startTime &&
          availability.endTime >= schedule.endTime,
      ),
    );
    return (
      availableEveryDay &&
      !input.snapshot.existingClasses.some(
        (existingClass) =>
          existingClass.teacherId === teacherId &&
          this.overlapsExisting(schedule, existingClass),
      )
    );
  }

  private proposalSchedule(proposal: SchedulingRecoveryPlanProposal): Schedule {
    return {
      courseId: proposal.courseId,
      branchId: proposal.branchId ?? null,
      daysOfWeek: proposal.daysOfWeek as WeekDay[],
      startTime: proposal.startTime,
      endTime: proposal.endTime,
    };
  }

  private overlapsExisting(
    schedule: Schedule,
    existingClass: SchedulingEngineInputSnapshot['existingClasses'][number],
  ): boolean {
    if (!existingClass.startTime || !existingClass.endTime) return false;
    return (
      schedule.startTime < existingClass.endTime &&
      existingClass.startTime < schedule.endTime &&
      schedule.daysOfWeek.some(
        (day) =>
          existingClass.daysOfWeek.includes(day) ||
          existingClass.sessionDates.some(
            (date) => this.dayOfWeek(date) === day,
          ),
      )
    );
  }

  private dayOfWeek(value: string): WeekDay | null {
    const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
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
}

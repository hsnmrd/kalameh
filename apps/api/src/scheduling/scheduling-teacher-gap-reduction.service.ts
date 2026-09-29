import { Injectable } from '@nestjs/common';
import type {
  SchedulingCandidateCoverage,
  SchedulingFeasibleCandidate,
  SchedulingSelectedAssignment,
  SchedulingSelectionReason,
} from '@workspace/types';
import { DEFAULT_SCHEDULING_SETTINGS } from '@workspace/types';

export type ReduceTeacherGapsInput = {
  selected: SchedulingSelectedAssignment[];
  eligibleCandidates: SchedulingFeasibleCandidate[];
  coverageByAssignmentKey: Map<string, SchedulingCandidateCoverage>;
};

@Injectable()
export class SchedulingTeacherGapReductionService {
  candidateGapDelta(
    candidate: SchedulingFeasibleCandidate,
    selectedCandidates: SchedulingFeasibleCandidate[],
  ): number {
    const track = this.dayTrack(candidate);
    const beforeGaps = this.teacherTrackGaps(
      selectedCandidates,
      candidate.teacherId,
      track,
    );
    const afterGaps = this.teacherTrackGaps(
      [...selectedCandidates, candidate],
      candidate.teacherId,
      track,
    );
    return afterGaps - beforeGaps;
  }

  reduceGaps(input: ReduceTeacherGapsInput): SchedulingSelectedAssignment[] {
    const result = input.selected.map((item) => ({ ...item }));
    const selectedKeys = new Set(result.map(({ candidate }) => candidate.key));

    let improved = true;
    while (improved) {
      improved =
        this.applySingleStepReassignment(result, selectedKeys, input) ||
        this.applyTwoStepInSlotRotation(result, selectedKeys, input);
    }

    return result;
  }

  teacherTrackGaps(
    candidates: SchedulingFeasibleCandidate[],
    teacherId: string,
    track: string,
  ): number {
    const teacherClasses = candidates
      .filter(
        (candidate) =>
          candidate.teacherId === teacherId &&
          this.dayTrack(candidate) === track,
      )
      .sort((left, right) => left.startTime.localeCompare(right.startTime));

    if (teacherClasses.length <= 1) return 0;

    let gaps = 0;
    for (let index = 0; index < teacherClasses.length - 1; index += 1) {
      const current = teacherClasses[index];
      const next = teacherClasses[index + 1];
      const gapMinutes =
        this.toMinutes(next.startTime) - this.toMinutes(current.endTime);
      const slotDuration = Math.max(
        1,
        Math.min(current.durationMinutes, next.durationMinutes),
      );
      if (gapMinutes >= slotDuration) {
        gaps += Math.floor(gapMinutes / slotDuration);
      }
    }
    return gaps;
  }

  private applySingleStepReassignment(
    result: SchedulingSelectedAssignment[],
    selectedKeys: Set<string>,
    input: ReduceTeacherGapsInput,
  ): boolean {
    const currentCandidates = result.map(({ candidate }) => candidate);
    let bestMove: {
      index: number;
      replacement: SchedulingFeasibleCandidate;
      gapReduction: number;
    } | null = null;

    for (let index = 0; index < result.length; index += 1) {
      const current = result[index].candidate;
      const track = this.dayTrack(current);
      const beforeFromGaps = this.teacherTrackGaps(
        currentCandidates,
        current.teacherId,
        track,
      );

      for (const replacement of this.findMatchingReplacements(
        current,
        input.eligibleCandidates,
        selectedKeys,
        input.coverageByAssignmentKey,
      )) {
        if (this.conflictsWithOthers(replacement, currentCandidates, [index])) {
          continue;
        }
        const beforeToGaps = this.teacherTrackGaps(
          currentCandidates,
          replacement.teacherId,
          track,
        );
        const nextCandidates = currentCandidates.map((item, idx) =>
          idx === index ? replacement : item,
        );
        const afterFromGaps = this.teacherTrackGaps(
          nextCandidates,
          current.teacherId,
          track,
        );
        const afterToGaps = this.teacherTrackGaps(
          nextCandidates,
          replacement.teacherId,
          track,
        );
        const gapReduction =
          beforeFromGaps + beforeToGaps - (afterFromGaps + afterToGaps);

        if (
          gapReduction <= 0 ||
          afterFromGaps > beforeFromGaps ||
          afterToGaps > beforeToGaps
        ) {
          continue;
        }

        if (
          !bestMove ||
          gapReduction > bestMove.gapReduction ||
          (gapReduction === bestMove.gapReduction &&
            replacement.assignmentKey.localeCompare(
              bestMove.replacement.assignmentKey,
            ) < 0)
        ) {
          bestMove = { index, replacement, gapReduction };
        }
      }
    }

    if (!bestMove) return false;

    this.replaceAssignment(
      result,
      selectedKeys,
      bestMove.index,
      bestMove.replacement,
    );
    return true;
  }

  private applyTwoStepInSlotRotation(
    result: SchedulingSelectedAssignment[],
    selectedKeys: Set<string>,
    input: ReduceTeacherGapsInput,
  ): boolean {
    const currentCandidates = result.map(({ candidate }) => candidate);

    for (let firstIndex = 0; firstIndex < result.length; firstIndex += 1) {
      const first = result[firstIndex].candidate;
      const track = this.dayTrack(first);
      const midTeacherId = first.teacherId;

      for (const toTeacherCandidate of this.findMatchingReplacements(
        first,
        input.eligibleCandidates,
        selectedKeys,
        input.coverageByAssignmentKey,
      )) {
        const toTeacherId = toTeacherCandidate.teacherId;
        if (
          this.conflictsWithOthers(toTeacherCandidate, currentCandidates, [
            firstIndex,
          ])
        ) {
          continue;
        }
        const beforeToGaps = this.teacherTrackGaps(
          currentCandidates,
          toTeacherId,
          track,
        );
        const projectedToCandidates = currentCandidates.map((item, idx) =>
          idx === firstIndex ? toTeacherCandidate : item,
        );
        const afterToGaps = this.teacherTrackGaps(
          projectedToCandidates,
          toTeacherId,
          track,
        );
        if (afterToGaps >= beforeToGaps) continue;

        for (
          let secondIndex = 0;
          secondIndex < result.length;
          secondIndex += 1
        ) {
          if (secondIndex === firstIndex) continue;
          const second = result[secondIndex].candidate;
          if (
            this.dayTrack(second) !== track ||
            second.startTime !== first.startTime ||
            second.endTime !== first.endTime ||
            second.teacherId === midTeacherId ||
            second.teacherId === toTeacherId
          ) {
            continue;
          }
          const fromTeacherId = second.teacherId;
          const beforeFromGaps = this.teacherTrackGaps(
            currentCandidates,
            fromTeacherId,
            track,
          );
          const midReplacement = this.findMatchingReplacements(
            second,
            input.eligibleCandidates,
            selectedKeys,
            input.coverageByAssignmentKey,
          ).find((candidate) => candidate.teacherId === midTeacherId);

          if (
            !midReplacement ||
            midReplacement.key === toTeacherCandidate.key ||
            this.conflictsWithOthers(midReplacement, currentCandidates, [
              firstIndex,
              secondIndex,
            ])
          ) {
            continue;
          }

          const nextCandidates = currentCandidates.map((item, idx) => {
            if (idx === firstIndex) return toTeacherCandidate;
            if (idx === secondIndex) return midReplacement;
            return item;
          });
          const afterFromGaps = this.teacherTrackGaps(
            nextCandidates,
            fromTeacherId,
            track,
          );
          if (
            afterFromGaps <= beforeFromGaps &&
            afterFromGaps + afterToGaps < beforeFromGaps + beforeToGaps
          ) {
            this.replaceAssignment(
              result,
              selectedKeys,
              firstIndex,
              toTeacherCandidate,
            );
            this.replaceAssignment(
              result,
              selectedKeys,
              secondIndex,
              midReplacement,
            );
            return true;
          }
        }
      }
    }

    return false;
  }

  private findMatchingReplacements(
    current: SchedulingFeasibleCandidate,
    eligibleCandidates: SchedulingFeasibleCandidate[],
    selectedKeys: Set<string>,
    coverageByAssignmentKey: Map<string, SchedulingCandidateCoverage>,
  ): SchedulingFeasibleCandidate[] {
    return eligibleCandidates
      .filter(
        (candidate) =>
          candidate.requirementId === current.requirementId &&
          candidate.teacherId !== current.teacherId &&
          candidate.timeGroup === current.timeGroup &&
          candidate.startTime === current.startTime &&
          candidate.endTime === current.endTime &&
          candidate.classroomId === current.classroomId &&
          !selectedKeys.has(candidate.key) &&
          this.hasSameCoverage(current, candidate, coverageByAssignmentKey),
      )
      .sort((left, right) =>
        left.assignmentKey.localeCompare(right.assignmentKey),
      );
  }

  private hasSameCoverage(
    left: SchedulingFeasibleCandidate,
    right: SchedulingFeasibleCandidate,
    coverageByAssignmentKey: Map<string, SchedulingCandidateCoverage>,
  ): boolean {
    const leftCoverage = coverageByAssignmentKey.get(left.assignmentKey);
    const rightCoverage = coverageByAssignmentKey.get(right.assignmentKey);
    if (!leftCoverage || !rightCoverage) return false;
    if (
      leftCoverage.coveredStudentIds.length !==
      rightCoverage.coveredStudentIds.length
    ) {
      return false;
    }
    const rightIds = new Set(rightCoverage.coveredStudentIds);
    return leftCoverage.coveredStudentIds.every((id) => rightIds.has(id));
  }

  private replaceAssignment(
    result: SchedulingSelectedAssignment[],
    selectedKeys: Set<string>,
    index: number,
    replacement: SchedulingFeasibleCandidate,
  ): void {
    const existing = result[index];
    selectedKeys.delete(existing.candidate.key);
    selectedKeys.add(replacement.key);
    result[index] = {
      ...existing,
      candidate: replacement,
      selectionReasons: this.updateSelectionReasons(
        existing.selectionReasons,
        replacement,
      ),
    };
  }

  private updateSelectionReasons(
    reasons: SchedulingSelectionReason[],
    replacement: SchedulingFeasibleCandidate,
  ): SchedulingSelectionReason[] {
    return reasons.map((reason) => {
      if (reason.code === 'MATCHES_TEACHER_QUALIFICATION') {
        return {
          code: 'MATCHES_TEACHER_QUALIFICATION',
          evidence: { qualificationId: replacement.qualificationId },
        };
      }
      if (reason.code === 'MATCHES_TEACHER_AVAILABILITY') {
        return {
          code: 'MATCHES_TEACHER_AVAILABILITY',
          evidence: { availabilityId: replacement.availabilityId },
        };
      }
      return reason;
    });
  }

  private conflictsWithOthers(
    candidate: SchedulingFeasibleCandidate,
    selectedCandidates: SchedulingFeasibleCandidate[],
    ignoredIndices: number[],
  ): boolean {
    const ignored = new Set(ignoredIndices);
    return selectedCandidates.some(
      (chosen, idx) =>
        !ignored.has(idx) && this.hasResourceConflict(candidate, chosen),
    );
  }

  private hasResourceConflict(
    left: SchedulingFeasibleCandidate,
    right: SchedulingFeasibleCandidate,
  ): boolean {
    if (left.startTime >= right.endTime || right.startTime >= left.endTime) {
      return false;
    }
    if (
      left.teacherId !== right.teacherId &&
      (left.classroomId === null || left.classroomId !== right.classroomId)
    ) {
      return false;
    }
    const rightDays = new Set(this.candidateDays(right));
    return this.candidateDays(left).some((day) => rightDays.has(day));
  }

  private candidateDays(
    candidate: SchedulingFeasibleCandidate,
  ): readonly string[] {
    if (candidate.timeGroup.startsWith('EVEN')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.evenDays;
    }
    if (candidate.timeGroup.startsWith('ODD')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.oddDays;
    }
    if (candidate.timeGroup.startsWith('NEUTRAL')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.neutralDays;
    }
    return [candidate.dayOfWeek];
  }

  private dayTrack(candidate: SchedulingFeasibleCandidate): string {
    if (candidate.timeGroup.startsWith('EVEN')) return 'EVEN';
    if (candidate.timeGroup.startsWith('ODD')) return 'ODD';
    if (candidate.timeGroup.startsWith('NEUTRAL')) return 'NEUTRAL';
    return candidate.dayOfWeek;
  }

  private toMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

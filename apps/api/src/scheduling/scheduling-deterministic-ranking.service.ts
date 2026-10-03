import { Injectable } from '@nestjs/common';
import {
  SchedulingDeterministicPlanCandidateSchema,
  SchedulingDeterministicRankingSchema,
  WEEK_DAYS,
  type SchedulingDeterministicAssignment,
  type SchedulingDeterministicPlanCandidate,
  type SchedulingDeterministicRanking,
} from '@workspace/types';

const RECOMMENDATION_COVERAGE_BAND = 5;

@Injectable()
export class SchedulingDeterministicRankingService {
  rank(
    planCandidates: SchedulingDeterministicPlanCandidate[],
  ): SchedulingDeterministicRanking {
    const candidates = planCandidates.map((candidate) =>
      SchedulingDeterministicPlanCandidateSchema.parse(candidate),
    );
    this.assertUniquePlanKeys(candidates);

    const availableCoverage = candidates.flatMap(({ coveragePercent }) =>
      coveragePercent === null ? [] : [coveragePercent],
    );
    const bestCoveragePercent =
      availableCoverage.length === 0 ? null : Math.max(...availableCoverage);
    const recommendationCoverageFloor =
      bestCoveragePercent === null
        ? null
        : Math.max(0, bestCoveragePercent - RECOMMENDATION_COVERAGE_BAND);
    const withinCoverageBand = new Map(
      candidates.map((candidate) => [
        candidate.planKey,
        recommendationCoverageFloor === null
          ? true
          : candidate.coveragePercent !== null &&
            candidate.coveragePercent >= recommendationCoverageFloor,
      ]),
    );

    const sorted = [...candidates].sort(
      (left, right) =>
        Number(withinCoverageBand.get(right.planKey)) -
          Number(withinCoverageBand.get(left.planKey)) ||
        this.compareDescending(
          this.roundToTwo(left.earnedWeightedPoints),
          this.roundToTwo(right.earnedWeightedPoints),
        ) ||
        this.compareNullableDescending(
          left.coveragePercent,
          right.coveragePercent,
        ) ||
        this.compareNullableDescending(
          left.minimumCourseCoveragePercent,
          right.minimumCourseCoveragePercent,
        ) ||
        left.uncoveredStudentCount - right.uncoveredStudentCount ||
        this.compareDescending(
          left.timeDiversityScore,
          right.timeDiversityScore,
        ) ||
        left.maximumTeacherLoadRatio - right.maximumTeacherLoadRatio ||
        left.warningCount - right.warningCount ||
        this.stableTieBreakerKey(left).localeCompare(
          this.stableTieBreakerKey(right),
        ) ||
        left.planKey.localeCompare(right.planKey),
    );

    return SchedulingDeterministicRankingSchema.parse({
      plans: sorted.map((candidate, index) => ({
        candidate: {
          ...candidate,
          assignments: this.sortedAssignments(candidate.assignments),
        },
        rank: index + 1,
        isRecommended: index === 0,
        isWithinCoverageBand:
          withinCoverageBand.get(candidate.planKey) ?? false,
        stableTieBreakerKey: this.stableTieBreakerKey(candidate),
      })),
      summary: {
        planCount: sorted.length,
        recommendationCandidateCount: Array.from(
          withinCoverageBand.values(),
        ).filter(Boolean).length,
        bestCoveragePercent,
        recommendationCoverageFloor,
      },
    });
  }

  private assertUniquePlanKeys(
    candidates: SchedulingDeterministicPlanCandidate[],
  ): void {
    if (
      new Set(candidates.map(({ planKey }) => planKey)).size !==
      candidates.length
    ) {
      throw new RangeError('plan keys must be unique');
    }
  }

  private compareNullableDescending(
    left: number | null,
    right: number | null,
  ): number {
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return right - left;
  }

  private compareDescending(left: number, right: number): number {
    return right - left;
  }

  private roundToTwo(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private stableTieBreakerKey(
    candidate: SchedulingDeterministicPlanCandidate,
  ): string {
    const key = this.sortedAssignments(candidate.assignments)
      .map(
        (assignment) =>
          `${assignment.teacherId}:${assignment.courseId}:${this.slotKey(assignment)}:${assignment.classroomId ?? 'ONLINE'}:${assignment.assignmentKey}`,
      )
      .join('|');
    return key || 'NO_ASSIGNMENTS';
  }

  private sortedAssignments(
    assignments: SchedulingDeterministicAssignment[],
  ): SchedulingDeterministicAssignment[] {
    return [...assignments].sort(
      (left, right) =>
        left.teacherId.localeCompare(right.teacherId) ||
        left.courseId.localeCompare(right.courseId) ||
        this.slotKey(left).localeCompare(this.slotKey(right)) ||
        (left.classroomId ?? 'ONLINE').localeCompare(
          right.classroomId ?? 'ONLINE',
        ) ||
        left.assignmentKey.localeCompare(right.assignmentKey),
    );
  }

  private slotKey(
    assignment: Pick<
      SchedulingDeterministicAssignment,
      'dayOfWeek' | 'startTime' | 'endTime'
    >,
  ): string {
    return `${String(WEEK_DAYS.indexOf(assignment.dayOfWeek)).padStart(2, '0')}:${assignment.startTime}:${assignment.endTime}`;
  }
}

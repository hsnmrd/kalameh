import type {
  SchedulingCandidateCoverage,
  SchedulingCoverageEvaluation,
  SchedulingFeasibleCandidate,
} from '@workspace/types';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';
import { SchedulingPlanCompositionService } from './scheduling-plan-composition.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

describe('MVP-024 SchedulingAlternativePlanService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const requirement = {
    id: uuid(1),
    courseId: uuid(2),
    requiredClassCount: 1,
  };
  const studentIds = [uuid(3), uuid(4)];
  const candidate = (
    index: number,
    dayOfWeek: SchedulingFeasibleCandidate['dayOfWeek'],
    timeGroup: SchedulingFeasibleCandidate['timeGroup'],
  ): SchedulingFeasibleCandidate => {
    const key = `${requirement.id}:${uuid(10 + index)}:${dayOfWeek}:09:00:10:30`;
    return {
      key,
      assignmentKey: `${key}:ONLINE`,
      requirementId: requirement.id,
      courseId: requirement.courseId,
      branchId: null,
      teacherId: uuid(10 + index),
      qualificationId: uuid(20 + index),
      availabilityId: uuid(30 + index),
      classroomId: null,
      deliveryMode: 'ONLINE',
      capacity: 12,
      dayOfWeek,
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      timeGroup,
    };
  };
  const coverage = (
    item: SchedulingFeasibleCandidate,
    coveredStudentIds: string[],
  ): SchedulingCandidateCoverage => {
    const uncoveredStudentIds = studentIds.filter(
      (studentId) => !coveredStudentIds.includes(studentId),
    );
    return {
      candidate: item,
      status: 'APPLICABLE',
      knownStudentCount: studentIds.length,
      unknownStudentCount: 0,
      coveredStudentIds,
      uncoveredStudentIds,
      coveragePercent: (coveredStudentIds.length / studentIds.length) * 100,
    };
  };
  const coverageEvaluation = (
    records: SchedulingCandidateCoverage[],
  ): SchedulingCoverageEvaluation => ({
    candidates: records,
    courses: [
      {
        courseId: requirement.courseId,
        status: 'APPLICABLE',
        knownStudentCount: studentIds.length,
        unknownStudentCount: 0,
        bestCoveredStudentCount: Math.max(
          0,
          ...records.map(({ coveredStudentIds }) => coveredStudentIds.length),
        ),
        bestCoveragePercent:
          Math.max(
            0,
            ...records.map(({ coveredStudentIds }) =>
              Math.round(
                (coveredStudentIds.length / studentIds.length) * 10000,
              ),
            ),
          ) / 100,
        candidateCount: records.length,
      },
    ],
    summary: {
      candidateCount: records.length,
      courseCount: 1,
      studentCount: studentIds.length,
      knownStudentCount: studentIds.length,
      unknownStudentCount: 0,
    },
  });
  let service: SchedulingAlternativePlanService;

  beforeEach(() => {
    service = new SchedulingAlternativePlanService(
      new SchedulingPlanCompositionService(
        new SchedulingTimeDistributionService(),
      ),
      new SchedulingDeterministicRankingService(),
    );
  });

  it('generates and ranks three distinct alternatives', () => {
    const first = candidate(1, 'SUNDAY', 'ODD_MORNING');
    const second = candidate(2, 'TUESDAY', 'EVEN_MORNING');
    const third = candidate(3, 'WEDNESDAY', 'EVEN_MORNING');
    const records = [
      coverage(first, studentIds),
      coverage(second, [studentIds[0]]),
      coverage(third, []),
    ];

    const result = service.generate({
      requirements: [requirement],
      feasibleCandidates: [third, first, second],
      coverageEvaluation: coverageEvaluation(records),
      alternativePlanCount: 3,
    });

    expect(result.plans).toHaveLength(3);
    expect(
      result.plans.map(
        ({ composition }) =>
          composition.assignments[0]?.candidate.assignmentKey,
      ),
    ).toEqual([first.assignmentKey, second.assignmentKey, third.assignmentKey]);
    expect(result.plans.map(({ rank }) => rank)).toEqual([1, 2, 3]);
    expect(result.plans[0]?.isRecommended).toBe(true);
    expect(result.summary).toMatchObject({
      requestedPlanCount: 3,
      generatedPlanCount: 3,
      searchAttemptCount: 3,
      searchLimitReached: false,
    });
  });

  it('produces identical alternatives for shuffled input', () => {
    const first = candidate(1, 'SUNDAY', 'ODD_MORNING');
    const second = candidate(2, 'TUESDAY', 'EVEN_MORNING');
    const records = [
      coverage(first, studentIds),
      coverage(second, [studentIds[0]]),
    ];
    const baseInput = {
      requirements: [requirement],
      alternativePlanCount: 2,
    };

    const forward = service.generate({
      ...baseInput,
      feasibleCandidates: [first, second],
      coverageEvaluation: coverageEvaluation(records),
    });
    const reversed = service.generate({
      ...baseInput,
      feasibleCandidates: [second, first],
      coverageEvaluation: coverageEvaluation([...records].reverse()),
    });

    expect(reversed).toEqual(forward);
  });

  it('returns fewer plans when no more distinct composition exists', () => {
    const result = service.generate({
      requirements: [requirement],
      feasibleCandidates: [],
      coverageEvaluation: coverageEvaluation([]),
      alternativePlanCount: 3,
    });

    expect(result.plans).toHaveLength(1);
    expect(result.plans[0]?.composition.assignments).toEqual([]);
    expect(result.summary.generatedPlanCount).toBe(1);
    expect(result.summary.searchLimitReached).toBe(false);
  });

  it.each([0, 4, 1.5])('rejects invalid plan count %s', (count) => {
    expect(() =>
      service.generate({
        requirements: [requirement],
        feasibleCandidates: [],
        coverageEvaluation: coverageEvaluation([]),
        alternativePlanCount: count,
      }),
    ).toThrow('alternative plan count must be from 1 to 3');
  });
});

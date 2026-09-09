import type {
  SchedulingDeterministicAssignment,
  SchedulingDeterministicPlanCandidate,
} from '@workspace/types';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';

describe('MVP-022 SchedulingDeterministicRankingService', () => {
  const ids = {
    teacherA: '00000000-0000-4000-8000-000000000001',
    teacherB: '00000000-0000-4000-8000-000000000002',
    course: '00000000-0000-4000-8000-000000000003',
    classroom: '00000000-0000-4000-8000-000000000004',
  };
  const assignment = (
    assignmentKey: string,
    teacherId = ids.teacherA,
  ): SchedulingDeterministicAssignment => ({
    assignmentKey,
    teacherId,
    courseId: ids.course,
    dayOfWeek: teacherId === ids.teacherA ? 'SUNDAY' : 'TUESDAY',
    startTime: '09:00',
    endTime: '10:30',
    classroomId: ids.classroom,
  });
  const candidate = (
    planKey: string,
    overrides: Partial<SchedulingDeterministicPlanCandidate> = {},
  ): SchedulingDeterministicPlanCandidate => ({
    planKey,
    earnedWeightedPoints: 80,
    coveragePercent: 90,
    minimumCourseCoveragePercent: 80,
    uncoveredStudentCount: 2,
    timeDiversityScore: 0.75,
    maximumTeacherLoadRatio: 0.7,
    warningCount: 1,
    assignments: [assignment(`${planKey}-assignment`)],
    ...overrides,
  });
  let service: SchedulingDeterministicRankingService;

  beforeEach(() => {
    service = new SchedulingDeterministicRankingService();
  });

  it('returns identical output for shuffled plans and assignments', () => {
    const first = candidate('plan-a', {
      assignments: [assignment('z', ids.teacherB), assignment('a')],
    });
    const second = candidate('plan-b', { earnedWeightedPoints: 75 });

    const forward = service.rank([first, second]);
    const reversed = service.rank([
      second,
      { ...first, assignments: [...first.assignments].reverse() },
    ]);

    expect(reversed).toEqual(forward);
    expect(
      forward.plans[0]?.candidate.assignments.map(
        ({ assignmentKey }) => assignmentKey,
      ),
    ).toEqual(['a', 'z']);
  });

  it('keeps a plan outside the five-point coverage band from recommendation', () => {
    const result = service.rank([
      candidate('high-score-low-coverage', {
        earnedWeightedPoints: 99,
        coveragePercent: 84.99,
      }),
      candidate('eligible', {
        earnedWeightedPoints: 70,
        coveragePercent: 90,
      }),
    ]);

    expect(result.plans.map(({ candidate: item }) => item.planKey)).toEqual([
      'eligible',
      'high-score-low-coverage',
    ]);
    expect(result.summary).toMatchObject({
      bestCoveragePercent: 90,
      recommendationCoverageFloor: 85,
      recommendationCandidateCount: 1,
    });
  });

  it('treats weighted scores equal to two decimals as a tie', () => {
    const result = service.rank([
      candidate('lower-coverage', {
        earnedWeightedPoints: 80.001,
        coveragePercent: 89,
      }),
      candidate('higher-coverage', {
        earnedWeightedPoints: 80.004,
        coveragePercent: 90,
      }),
    ]);

    expect(result.plans[0]?.candidate.planKey).toBe('higher-coverage');
  });

  it.each([
    [
      'minimum course coverage',
      { minimumCourseCoveragePercent: 81 },
      { minimumCourseCoveragePercent: 80 },
    ],
    [
      'uncovered students',
      { uncoveredStudentCount: 1 },
      { uncoveredStudentCount: 2 },
    ],
    [
      'time diversity',
      { timeDiversityScore: 0.8 },
      { timeDiversityScore: 0.7 },
    ],
    [
      'maximum teacher load',
      { maximumTeacherLoadRatio: 0.6 },
      { maximumTeacherLoadRatio: 0.7 },
    ],
    ['warning count', { warningCount: 0 }, { warningCount: 1 }],
  ] satisfies Array<
    [
      string,
      Partial<SchedulingDeterministicPlanCandidate>,
      Partial<SchedulingDeterministicPlanCandidate>,
    ]
  >)('uses %s as the next deterministic tie-breaker', (_, better, worse) => {
    const common = {
      earnedWeightedPoints: 80,
      coveragePercent: 90,
      minimumCourseCoveragePercent: 80,
      uncoveredStudentCount: 2,
      timeDiversityScore: 0.75,
      maximumTeacherLoadRatio: 0.7,
      warningCount: 1,
    };
    const result = service.rank([
      candidate('worse', { ...common, ...worse }),
      candidate('better', { ...common, ...better }),
    ]);

    expect(result.plans[0]?.candidate.planKey).toBe('better');
  });

  it('uses stable teacher, course, slot and classroom identifiers last', () => {
    const result = service.rank([
      candidate('teacher-b', {
        assignments: [assignment('b', ids.teacherB)],
      }),
      candidate('teacher-a', { assignments: [assignment('a')] }),
    ]);

    expect(result.plans[0]?.candidate.planKey).toBe('teacher-a');
  });

  it('handles unavailable coverage consistently', () => {
    const result = service.rank([
      candidate('b', { coveragePercent: null }),
      candidate('a', { coveragePercent: null }),
    ]);

    expect(result.summary).toMatchObject({
      bestCoveragePercent: null,
      recommendationCoverageFloor: null,
      recommendationCandidateCount: 2,
    });
    expect(
      result.plans.every(({ isWithinCoverageBand }) => isWithinCoverageBand),
    ).toBe(true);
  });

  it('rejects duplicate plan keys', () => {
    expect(() => service.rank([candidate('same'), candidate('same')])).toThrow(
      'plan keys must be unique',
    );
  });
});

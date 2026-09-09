import type {
  SchedulingCandidateCoverage,
  SchedulingCoverageEvaluation,
  SchedulingFeasibleCandidate,
} from '@workspace/types';
import { SchedulingPlanCompositionService } from './scheduling-plan-composition.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

describe('MVP-023 SchedulingPlanCompositionService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    requirementA: uuid(1),
    requirementB: uuid(2),
    courseA: uuid(3),
    courseB: uuid(4),
    teacherA: uuid(5),
    teacherB: uuid(6),
    studentA: uuid(7),
    studentB: uuid(8),
    studentC: uuid(9),
    studentD: uuid(10),
    classroomA: uuid(11),
  };
  const candidate = (
    index: number,
    overrides: Partial<SchedulingFeasibleCandidate> = {},
  ): SchedulingFeasibleCandidate => {
    const requirementId = overrides.requirementId ?? ids.requirementA;
    const courseId = overrides.courseId ?? ids.courseA;
    const teacherId = overrides.teacherId ?? ids.teacherA;
    const dayOfWeek = overrides.dayOfWeek ?? 'SUNDAY';
    const startTime = overrides.startTime ?? '09:00';
    const endTime = overrides.endTime ?? '10:30';
    const key = `${requirementId}:${teacherId}:${dayOfWeek}:${startTime}:${endTime}:${index}`;
    return {
      key,
      assignmentKey: `${key}:ONLINE`,
      requirementId,
      courseId,
      branchId: null,
      teacherId,
      qualificationId: uuid(100 + index),
      availabilityId: uuid(200 + index),
      classroomId: null,
      deliveryMode: 'ONLINE',
      capacity: 12,
      dayOfWeek,
      startTime,
      endTime,
      durationMinutes: 90,
      timeGroup: overrides.timeGroup ?? 'ODD_MORNING',
      ...overrides,
    };
  };
  const coverage = (
    item: SchedulingFeasibleCandidate,
    coveredStudentIds: string[],
    uncoveredStudentIds: string[],
    unknownStudentCount = 0,
  ): SchedulingCandidateCoverage => {
    const knownStudentCount =
      coveredStudentIds.length + uncoveredStudentIds.length;
    return {
      candidate: item,
      status: knownStudentCount === 0 ? 'NOT_APPLICABLE' : 'APPLICABLE',
      knownStudentCount,
      unknownStudentCount,
      coveredStudentIds,
      uncoveredStudentIds,
      coveragePercent:
        knownStudentCount === 0
          ? null
          : Math.round((coveredStudentIds.length / knownStudentCount) * 10000) /
            100,
    };
  };
  const requirements = [
    {
      id: ids.requirementA,
      courseId: ids.courseA,
      requiredClassCount: 2,
    },
  ];
  const coverageEvaluation = (
    records: SchedulingCandidateCoverage[],
    scopedRequirements = requirements,
    emptyCourseCounts: Record<
      string,
      { knownStudentCount: number; unknownStudentCount: number }
    > = {},
  ): SchedulingCoverageEvaluation => {
    const courses = Array.from(
      new Set(scopedRequirements.map(({ courseId }) => courseId)),
    )
      .sort()
      .map((courseId) => {
        const matching = records.filter(
          ({ candidate: item }) => item.courseId === courseId,
        );
        const counts = matching[0] ?? emptyCourseCounts[courseId];
        const knownStudentCount = counts?.knownStudentCount ?? 0;
        const unknownStudentCount = counts?.unknownStudentCount ?? 0;
        const bestCoveredStudentCount = Math.max(
          0,
          ...matching.map(({ coveredStudentIds }) => coveredStudentIds.length),
        );
        return {
          courseId,
          status:
            knownStudentCount === 0
              ? ('NOT_APPLICABLE' as const)
              : ('APPLICABLE' as const),
          knownStudentCount,
          unknownStudentCount,
          bestCoveredStudentCount,
          bestCoveragePercent:
            knownStudentCount === 0
              ? null
              : Math.round(
                  (bestCoveredStudentCount / knownStudentCount) * 10000,
                ) / 100,
          candidateCount: matching.length,
        };
      });
    const knownStudentCount = courses.reduce(
      (sum, course) => sum + course.knownStudentCount,
      0,
    );
    const unknownStudentCount = courses.reduce(
      (sum, course) => sum + course.unknownStudentCount,
      0,
    );
    return {
      candidates: records,
      courses,
      summary: {
        candidateCount: records.length,
        courseCount: courses.length,
        studentCount: knownStudentCount + unknownStudentCount,
        knownStudentCount,
        unknownStudentCount,
      },
    };
  };
  let service: SchedulingPlanCompositionService;

  beforeEach(() => {
    service = new SchedulingPlanCompositionService(
      new SchedulingTimeDistributionService(),
    );
  });

  it('combines unique student coverage with time diversity', () => {
    const sunday = candidate(1);
    const tuesday = candidate(2, {
      teacherId: ids.teacherB,
      dayOfWeek: 'TUESDAY',
      startTime: '17:00',
      endTime: '18:30',
      timeGroup: 'EVEN_EVENING',
    });
    const duplicateMorning = candidate(3, {
      teacherId: ids.teacherB,
      startTime: '11:00',
      endTime: '12:30',
    });
    const population = [ids.studentA, ids.studentB, ids.studentC, ids.studentD];

    const records = [
      coverage(sunday, population.slice(0, 2), population.slice(2)),
      coverage(tuesday, population.slice(2), population.slice(0, 2)),
      coverage(duplicateMorning, population.slice(0, 3), population.slice(3)),
    ];
    const result = service.compose({
      requirements,
      feasibleCandidates: [sunday, tuesday, duplicateMorning],
      coverageEvaluation: coverageEvaluation(records),
    });

    expect(
      result.assignments.map(({ candidate: item }) => item.assignmentKey),
    ).toEqual([duplicateMorning.assignmentKey, tuesday.assignmentKey].sort());
    expect(result.summary).toMatchObject({
      requiredClassCount: 2,
      scheduledClassCount: 2,
      missingClassCount: 0,
      coveredStudentCount: 4,
      coveragePercent: 100,
      timeDiversityScore: 1,
      earnedWeightedPoints: 75,
      applicableWeightedPoints: 75,
      qualityIndex: 100,
    });
  });

  it('schedules the scarcest requirement before a competing flexible one', () => {
    const scarce = candidate(1);
    const competing = candidate(2, {
      requirementId: ids.requirementB,
      courseId: ids.courseB,
    });
    const alternative = candidate(3, {
      requirementId: ids.requirementB,
      courseId: ids.courseB,
      teacherId: ids.teacherB,
      dayOfWeek: 'TUESDAY',
      timeGroup: 'EVEN_MORNING',
    });

    const scopedRequirements = [
      { ...requirements[0], requiredClassCount: 1 },
      {
        id: ids.requirementB,
        courseId: ids.courseB,
        requiredClassCount: 1,
      },
    ];
    const records = [
      coverage(scarce, [ids.studentA], []),
      coverage(competing, [ids.studentB], []),
      coverage(alternative, [], [ids.studentB]),
    ];
    const result = service.compose({
      requirements: scopedRequirements,
      feasibleCandidates: [competing, alternative, scarce],
      coverageEvaluation: coverageEvaluation(records, scopedRequirements),
    });

    expect(
      result.assignments.map(({ candidate: item }) => item.assignmentKey),
    ).toEqual([alternative.assignmentKey, scarce.assignmentKey].sort());
    expect(result.summary.scheduledClassCount).toBe(2);
  });

  it('prevents teacher and classroom conflicts inside the composed plan', () => {
    const first = candidate(1, {
      classroomId: ids.classroomA,
      deliveryMode: 'IN_PERSON',
    });
    const teacherConflict = candidate(2, {
      requirementId: ids.requirementB,
      courseId: ids.courseB,
      classroomId: uuid(12),
      deliveryMode: 'IN_PERSON',
    });
    const roomConflict = candidate(3, {
      requirementId: ids.requirementB,
      courseId: ids.courseB,
      teacherId: ids.teacherB,
      classroomId: ids.classroomA,
      deliveryMode: 'IN_PERSON',
    });

    const scopedRequirements = [
      { ...requirements[0], requiredClassCount: 1 },
      {
        id: ids.requirementB,
        courseId: ids.courseB,
        requiredClassCount: 1,
      },
    ];
    const records = [
      coverage(first, [ids.studentA], []),
      coverage(teacherConflict, [ids.studentB], []),
      coverage(roomConflict, [ids.studentB], []),
    ];
    const result = service.compose({
      requirements: scopedRequirements,
      feasibleCandidates: [first, teacherConflict, roomConflict],
      coverageEvaluation: coverageEvaluation(records, scopedRequirements),
    });

    expect(result.summary.scheduledClassCount).toBe(1);
    expect(result.summary.missingClassCount).toBe(1);
  });

  it('produces the same composition for shuffled inputs', () => {
    const first = candidate(1);
    const second = candidate(2, {
      teacherId: ids.teacherB,
      dayOfWeek: 'TUESDAY',
      timeGroup: 'EVEN_MORNING',
    });
    const records = [
      coverage(first, [ids.studentA], [ids.studentB]),
      coverage(second, [ids.studentB], [ids.studentA]),
    ];

    const forward = service.compose({
      requirements,
      feasibleCandidates: [first, second],
      coverageEvaluation: coverageEvaluation(records),
    });
    const reversed = service.compose({
      requirements: [...requirements].reverse(),
      feasibleCandidates: [second, first],
      coverageEvaluation: coverageEvaluation([...records].reverse()),
    });

    expect(reversed).toEqual(forward);
  });

  it('returns unresolved counts when there are no feasible candidates', () => {
    const result = service.compose({
      requirements,
      feasibleCandidates: [],
      coverageEvaluation: coverageEvaluation([], requirements, {
        [ids.courseA]: { knownStudentCount: 2, unknownStudentCount: 1 },
      }),
    });

    expect(result.assignments).toEqual([]);
    expect(result.summary).toMatchObject({
      requiredClassCount: 2,
      scheduledClassCount: 0,
      missingClassCount: 2,
      knownStudentCount: 2,
      unknownStudentCount: 1,
      coveredStudentCount: 0,
      coveragePercent: 0,
      minimumCourseCoveragePercent: 0,
    });
  });

  it('rejects inconsistent student populations for a course', () => {
    const first = candidate(1);
    const second = candidate(2, {
      teacherId: ids.teacherB,
      dayOfWeek: 'TUESDAY',
    });

    expect(() =>
      service.compose({
        requirements,
        feasibleCandidates: [first, second],
        coverageEvaluation: coverageEvaluation([
          coverage(first, [ids.studentA], [ids.studentB]),
          coverage(second, [ids.studentA], [ids.studentC]),
        ]),
      }),
    ).toThrow('candidate coverage population must be consistent per course');
  });

  it('rejects invalid combined weights', () => {
    expect(() =>
      service.compose({
        requirements,
        feasibleCandidates: [],
        coverageEvaluation: coverageEvaluation([]),
        weights: { studentCoverage: 80, timeDiversity: 30 },
      }),
    ).toThrow('combined maximum of 100');
  });
});

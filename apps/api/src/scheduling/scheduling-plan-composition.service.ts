import { Injectable } from '@nestjs/common';
import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingCandidateCoverageSchema,
  SchedulingCoverageEvaluationSchema,
  SchedulingFeasibleCandidateSchema,
  SchedulingPlanCompositionSchema,
  type SchedulingCandidateCoverage,
  type SchedulingCoverageEvaluation,
  type SchedulingFeasibleCandidate,
  type SchedulingPlanComposition,
  type SchedulingSelectedAssignment,
  type SchedulingSelectionReason,
} from '@workspace/types';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';

type CompositionRequirement = {
  id: string;
  courseId: string;
  requiredClassCount: number;
};

type CompositionWeights = {
  studentCoverage: number;
  timeDiversity: number;
};

export type ComposeSchedulingPlanInput = {
  requirements: CompositionRequirement[];
  feasibleCandidates: SchedulingFeasibleCandidate[];
  coverageEvaluation: SchedulingCoverageEvaluation;
  weights?: Partial<CompositionWeights>;
  excludedAssignmentKeys?: string[];
};

type RankedOption = {
  candidate: SchedulingFeasibleCandidate;
  coverage: SchedulingCandidateCoverage;
  feasibleCandidateCount: number;
  remainingClassCount: number;
  incrementalCoveredStudentCount: number;
  projectedCoveragePercent: number | null;
  projectedTimeDiversityScore: number;
  projectedWeightedPoints: number;
  selectionReasons: SchedulingSelectionReason[];
};

@Injectable()
export class SchedulingPlanCompositionService {
  constructor(
    private readonly timeDistributionService: SchedulingTimeDistributionService,
  ) {}

  compose(input: ComposeSchedulingPlanInput): SchedulingPlanComposition {
    const requirements = [...input.requirements].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    this.assertRequirements(requirements);
    const requirementById = new Map(
      requirements.map((requirement) => [requirement.id, requirement]),
    );
    const candidates = input.feasibleCandidates.map((candidate) =>
      SchedulingFeasibleCandidateSchema.parse(candidate),
    );
    const coverageEvaluation = SchedulingCoverageEvaluationSchema.parse(
      input.coverageEvaluation,
    );
    const coverageRecords = coverageEvaluation.candidates.map((coverage) =>
      SchedulingCandidateCoverageSchema.parse(coverage),
    );
    const weights = this.resolveWeights(input.weights);
    const coverageByAssignmentKey = this.validateInputs(
      candidates,
      coverageRecords,
      coverageEvaluation,
      requirementById,
    );
    const excludedAssignmentKeys = this.validateExclusions(
      input.excludedAssignmentKeys ?? [],
      candidates,
    );
    const eligibleCandidates = candidates.filter(
      ({ assignmentKey }) => !excludedAssignmentKeys.has(assignmentKey),
    );
    const { knownStudentCountByCourse, unknownStudentsByCourse } =
      this.studentPopulations(coverageRecords, coverageEvaluation);
    const selected: SchedulingSelectedAssignment[] = [];
    const selectedCandidateKeys = new Set<string>();
    const selectedCountByRequirement = new Map<string, number>();

    while (true) {
      const viable = eligibleCandidates.filter((candidate) => {
        const requirement = requirementById.get(candidate.requirementId);
        return (
          requirement !== undefined &&
          (selectedCountByRequirement.get(requirement.id) ?? 0) <
            requirement.requiredClassCount &&
          !selectedCandidateKeys.has(candidate.key) &&
          !selected.some(({ candidate: chosen }) =>
            this.hasResourceConflict(candidate, chosen),
          )
        );
      });
      if (viable.length === 0) break;

      const viableCountByRequirement = new Map<string, number>();
      for (const requirement of requirements) {
        viableCountByRequirement.set(
          requirement.id,
          new Set(
            viable
              .filter((candidate) => candidate.requirementId === requirement.id)
              .map((candidate) => candidate.key),
          ).size,
        );
      }
      const options = viable.map((candidate) => {
        const requirement = requirementById.get(candidate.requirementId)!;
        const coverage = coverageByAssignmentKey.get(candidate.assignmentKey)!;
        const requirementSelections = selected.filter(
          ({ candidate: chosen }) => chosen.requirementId === requirement.id,
        );
        const currentCoveredStudents = this.coveredStudentIds(
          requirementSelections.map(({ candidate: chosen }) =>
            coverageByAssignmentKey.get(chosen.assignmentKey)!,
          ),
        );
        const projectedCoveredStudents = new Set([
          ...currentCoveredStudents,
          ...coverage.coveredStudentIds,
        ]);
        const knownStudentCount =
          knownStudentCountByCourse.get(requirement.courseId) ?? 0;
        const projectedCoveragePercent =
          knownStudentCount === 0
            ? null
            : this.percent(projectedCoveredStudents.size, knownStudentCount);
        const currentTimeScore = this.timeDistributionService.score({
          requirementId: requirement.id,
          requiredClassCount: requirement.requiredClassCount,
          selectedTimeGroups: requirementSelections.map(
            ({ candidate: chosen }) => chosen.timeGroup,
          ),
          weight: weights.timeDiversity,
        });
        const projectedTimeScore = this.timeDistributionService.score({
          requirementId: requirement.id,
          requiredClassCount: requirement.requiredClassCount,
          selectedTimeGroups: [
            ...requirementSelections.map(
              ({ candidate: chosen }) => chosen.timeGroup,
            ),
            candidate.timeGroup,
          ],
          weight: weights.timeDiversity,
        });
        const incrementalCoveredStudentCount = Array.from(
          projectedCoveredStudents,
        ).filter((studentId) => !currentCoveredStudents.has(studentId)).length;
        const feasibleCandidateCount =
          viableCountByRequirement.get(requirement.id) ?? 0;
        const remainingClassCount =
          requirement.requiredClassCount - requirementSelections.length;
        const selectionReasons: SchedulingSelectionReason[] = [
          {
            code: 'MATCHES_TEACHER_QUALIFICATION',
            evidence: { qualificationId: candidate.qualificationId },
          },
          {
            code: 'MATCHES_TEACHER_AVAILABILITY',
            evidence: { availabilityId: candidate.availabilityId },
          },
        ];
        if (incrementalCoveredStudentCount > 0) {
          selectionReasons.unshift({
            code: 'MAXIMIZES_STUDENT_COVERAGE',
            evidence: { incrementalCoveredStudentCount },
          });
        }
        if (
          projectedTimeScore.criterion.normalizedScore! >
          currentTimeScore.criterion.normalizedScore!
        ) {
          selectionReasons.push({
            code: 'IMPROVES_TIME_DIVERSITY',
            evidence: {
              previousScore: currentTimeScore.criterion.normalizedScore,
              projectedScore: projectedTimeScore.criterion.normalizedScore,
            },
          });
        }
        if (feasibleCandidateCount <= remainingClassCount) {
          selectionReasons.push({
            code: 'ONLY_FEASIBLE_HARD_CONSTRAINT_OPTION',
            evidence: { feasibleCandidateCount, remainingClassCount },
          });
        }

        return {
          candidate,
          coverage,
          feasibleCandidateCount,
          remainingClassCount,
          incrementalCoveredStudentCount,
          projectedCoveragePercent,
          projectedTimeDiversityScore:
            projectedTimeScore.criterion.normalizedScore!,
          projectedWeightedPoints: this.round(
            (projectedCoveragePercent === null
              ? 0
              : (projectedCoveragePercent / 100) * weights.studentCoverage) +
              projectedTimeScore.criterion.weightedPoints!,
            2,
          ),
          selectionReasons,
        } satisfies RankedOption;
      });
      const chosen = options.sort((left, right) =>
        this.compareOptions(left, right),
      )[0];
      if (!chosen) break;

      selected.push({
        candidate: chosen.candidate,
        incrementalCoveredStudentCount: chosen.incrementalCoveredStudentCount,
        projectedCoveragePercent: chosen.projectedCoveragePercent,
        projectedTimeDiversityScore: chosen.projectedTimeDiversityScore,
        projectedWeightedPoints: chosen.projectedWeightedPoints,
        selectionReasons: chosen.selectionReasons,
      });
      selectedCandidateKeys.add(chosen.candidate.key);
      selectedCountByRequirement.set(
        chosen.candidate.requirementId,
        (selectedCountByRequirement.get(chosen.candidate.requirementId) ?? 0) +
          1,
      );
    }

    return this.buildComposition(
      requirements,
      selected,
      coverageByAssignmentKey,
      knownStudentCountByCourse,
      unknownStudentsByCourse,
      weights,
    );
  }

  private compareOptions(left: RankedOption, right: RankedOption): number {
    const scarcityComparison =
      left.feasibleCandidateCount * right.remainingClassCount -
      right.feasibleCandidateCount * left.remainingClassCount;
    return (
      scarcityComparison ||
      right.projectedWeightedPoints - left.projectedWeightedPoints ||
      right.incrementalCoveredStudentCount -
        left.incrementalCoveredStudentCount ||
      this.compareNullableDescending(
        left.projectedCoveragePercent,
        right.projectedCoveragePercent,
      ) ||
      right.projectedTimeDiversityScore - left.projectedTimeDiversityScore ||
      left.candidate.assignmentKey.localeCompare(right.candidate.assignmentKey)
    );
  }

  private buildComposition(
    requirements: CompositionRequirement[],
    selected: SchedulingSelectedAssignment[],
    coverageByAssignmentKey: Map<string, SchedulingCandidateCoverage>,
    knownStudentCountByCourse: Map<string, number>,
    unknownStudentsByCourse: Map<string, number>,
    weights: CompositionWeights,
  ): SchedulingPlanComposition {
    const sortedSelected = [...selected].sort((left, right) =>
      left.candidate.assignmentKey.localeCompare(right.candidate.assignmentKey),
    );
    const composedRequirements = requirements.map((requirement) => {
      const requirementSelections = sortedSelected.filter(
        ({ candidate }) => candidate.requirementId === requirement.id,
      );
      const coveredStudents = this.coveredStudentIds(
        requirementSelections.map(({ candidate }) =>
          coverageByAssignmentKey.get(candidate.assignmentKey)!,
        ),
      );
      const knownStudentCount =
        knownStudentCountByCourse.get(requirement.courseId) ?? 0;
      const scheduledClassCount = requirementSelections.length;

      return {
        requirementId: requirement.id,
        courseId: requirement.courseId,
        requiredClassCount: requirement.requiredClassCount,
        scheduledClassCount,
        missingClassCount: requirement.requiredClassCount - scheduledClassCount,
        knownStudentCount,
        coveredStudentCount: coveredStudents.size,
        coveragePercent:
          knownStudentCount === 0
            ? null
            : this.percent(coveredStudents.size, knownStudentCount),
        selectedAssignmentKeys: requirementSelections.map(
          ({ candidate }) => candidate.assignmentKey,
        ),
        timeDistribution: this.timeDistributionService.score({
          requirementId: requirement.id,
          requiredClassCount: requirement.requiredClassCount,
          selectedTimeGroups: requirementSelections.map(
            ({ candidate }) => candidate.timeGroup,
          ),
          weight: weights.timeDiversity,
        }),
      };
    });
    const requestedCourseIds = Array.from(
      new Set(requirements.map(({ courseId }) => courseId)),
    ).sort();
    const coveredByCourse = new Map(
      requestedCourseIds.map((courseId) => [courseId, new Set<string>()]),
    );
    for (const { candidate } of sortedSelected) {
      for (const studentId of coverageByAssignmentKey.get(
        candidate.assignmentKey,
      )!.coveredStudentIds) {
        coveredByCourse.get(candidate.courseId)?.add(studentId);
      }
    }
    const knownStudentCount = requestedCourseIds.reduce(
      (sum, courseId) => sum + (knownStudentCountByCourse.get(courseId) ?? 0),
      0,
    );
    const unknownStudentCount = requestedCourseIds.reduce(
      (sum, courseId) => sum + (unknownStudentsByCourse.get(courseId) ?? 0),
      0,
    );
    const coveredStudentCount = requestedCourseIds.reduce(
      (sum, courseId) => sum + (coveredByCourse.get(courseId)?.size ?? 0),
      0,
    );
    const courseCoverage = requestedCourseIds.flatMap((courseId) => {
      const known = knownStudentCountByCourse.get(courseId) ?? 0;
      return known === 0
        ? []
        : [this.percent(coveredByCourse.get(courseId)?.size ?? 0, known)];
    });
    const requiredClassCount = requirements.reduce(
      (sum, requirement) => sum + requirement.requiredClassCount,
      0,
    );
    const timeDiversityScore =
      requiredClassCount === 0
        ? 0
        : this.round(
            composedRequirements.reduce(
              (sum, requirement) =>
                sum +
                requirement.timeDistribution.criterion.normalizedScore! *
                  requirement.requiredClassCount,
              0,
            ) / requiredClassCount,
            4,
          );
    const coveragePercent =
      knownStudentCount === 0
        ? null
        : this.percent(coveredStudentCount, knownStudentCount);
    const earnedWeightedPoints = this.round(
      (coveragePercent === null
        ? 0
        : (coveragePercent / 100) * weights.studentCoverage) +
        timeDiversityScore * weights.timeDiversity,
      2,
    );
    const applicableWeightedPoints =
      (knownStudentCount === 0 ? 0 : weights.studentCoverage) +
      (requiredClassCount === 0 ? 0 : weights.timeDiversity);

    return SchedulingPlanCompositionSchema.parse({
      assignments: sortedSelected,
      requirements: composedRequirements,
      summary: {
        requiredClassCount,
        scheduledClassCount: sortedSelected.length,
        missingClassCount: requiredClassCount - sortedSelected.length,
        knownStudentCount,
        unknownStudentCount,
        coveredStudentCount,
        uncoveredStudentCount: knownStudentCount - coveredStudentCount,
        coveragePercent,
        minimumCourseCoveragePercent:
          courseCoverage.length === 0 ? null : Math.min(...courseCoverage),
        timeDiversityScore,
        earnedWeightedPoints,
        applicableWeightedPoints,
        qualityIndex:
          applicableWeightedPoints === 0
            ? null
            : this.round(
                (earnedWeightedPoints / applicableWeightedPoints) * 100,
                2,
              ),
      },
    });
  }

  private validateInputs(
    candidates: SchedulingFeasibleCandidate[],
    coverageRecords: SchedulingCandidateCoverage[],
    coverageEvaluation: SchedulingCoverageEvaluation,
    requirementById: Map<string, CompositionRequirement>,
  ): Map<string, SchedulingCandidateCoverage> {
    if (
      new Set(candidates.map(({ assignmentKey }) => assignmentKey)).size !==
      candidates.length
    ) {
      throw new RangeError('feasible assignment keys must be unique');
    }
    if (
      new Set(coverageRecords.map(({ candidate }) => candidate.assignmentKey))
        .size !== coverageRecords.length
    ) {
      throw new RangeError('candidate coverage keys must be unique');
    }
    const coverageByAssignmentKey = new Map(
      coverageRecords.map((coverage) => [
        coverage.candidate.assignmentKey,
        coverage,
      ]),
    );
    for (const candidate of candidates) {
      const requirement = requirementById.get(candidate.requirementId);
      const coverage = coverageByAssignmentKey.get(candidate.assignmentKey);
      if (
        !requirement ||
        requirement.courseId !== candidate.courseId ||
        !coverage ||
        !this.isSameCandidate(candidate, coverage.candidate)
      ) {
        throw new RangeError(
          'every feasible candidate must match a requirement and coverage record',
        );
      }
    }
    if (coverageRecords.length !== candidates.length) {
      throw new RangeError(
        'candidate coverage must contain exactly the feasible candidates',
      );
    }
    const requestedCourseIds = Array.from(
      new Set(
        Array.from(requirementById.values()).map(({ courseId }) => courseId),
      ),
    ).sort();
    const coverageCourseIds = coverageEvaluation.courses
      .map(({ courseId }) => courseId)
      .sort();
    if (requestedCourseIds.join('|') !== coverageCourseIds.join('|')) {
      throw new RangeError(
        'coverage evaluation must contain exactly the requested courses',
      );
    }
    return coverageByAssignmentKey;
  }

  private studentPopulations(
    coverageRecords: SchedulingCandidateCoverage[],
    coverageEvaluation: SchedulingCoverageEvaluation,
  ): {
    knownStudentCountByCourse: Map<string, number>;
    unknownStudentsByCourse: Map<string, number>;
  } {
    const knownStudentsByCourse = new Map<string, Set<string>>();
    const knownStudentCountByCourse = new Map(
      coverageEvaluation.courses.map((course) => [
        course.courseId,
        course.knownStudentCount,
      ]),
    );
    const unknownStudentsByCourse = new Map(
      coverageEvaluation.courses.map((course) => [
        course.courseId,
        course.unknownStudentCount,
      ]),
    );
    for (const coverage of [...coverageRecords].sort((left, right) =>
      left.candidate.assignmentKey.localeCompare(right.candidate.assignmentKey),
    )) {
      const population = new Set([
        ...coverage.coveredStudentIds,
        ...coverage.uncoveredStudentIds,
      ]);
      const existingPopulation = knownStudentsByCourse.get(
        coverage.candidate.courseId,
      );
      const existingUnknown = unknownStudentsByCourse.get(
        coverage.candidate.courseId,
      );
      if (
        population.size !==
          knownStudentCountByCourse.get(coverage.candidate.courseId) ||
        (existingPopulation &&
          [...existingPopulation].sort().join('|') !==
            [...population].sort().join('|')) ||
        (existingUnknown !== undefined &&
          existingUnknown !== coverage.unknownStudentCount)
      ) {
        throw new RangeError(
          'candidate coverage population must be consistent per course',
        );
      }
      knownStudentsByCourse.set(coverage.candidate.courseId, population);
    }
    return {
      knownStudentCountByCourse,
      unknownStudentsByCourse,
    };
  }

  private assertRequirements(requirements: CompositionRequirement[]): void {
    if (
      new Set(requirements.map(({ id }) => id)).size !== requirements.length ||
      requirements.some(
        ({ requiredClassCount }) =>
          !Number.isInteger(requiredClassCount) || requiredClassCount < 1,
      )
    ) {
      throw new RangeError(
        'requirements must have unique ids and positive class counts',
      );
    }
  }

  private validateExclusions(
    assignmentKeys: string[],
    candidates: SchedulingFeasibleCandidate[],
  ): Set<string> {
    const excluded = new Set(assignmentKeys);
    const feasibleKeys = new Set(
      candidates.map(({ assignmentKey }) => assignmentKey),
    );
    if (
      excluded.size !== assignmentKeys.length ||
      assignmentKeys.some((assignmentKey) => !feasibleKeys.has(assignmentKey))
    ) {
      throw new RangeError(
        'excluded assignment keys must be unique feasible assignments',
      );
    }
    return excluded;
  }

  private resolveWeights(
    overrides: Partial<CompositionWeights> | undefined,
  ): CompositionWeights {
    const weights = {
      studentCoverage:
        overrides?.studentCoverage ??
        DEFAULT_SCHEDULING_SETTINGS.weights.studentCoverage,
      timeDiversity:
        overrides?.timeDiversity ??
        DEFAULT_SCHEDULING_SETTINGS.weights.timeDiversity,
    };
    if (
      Object.values(weights).some(
        (weight) => !Number.isInteger(weight) || weight < 0 || weight > 100,
      ) ||
      weights.studentCoverage + weights.timeDiversity > 100
    ) {
      throw new RangeError(
        'composition weights must be integers with a combined maximum of 100',
      );
    }
    return weights;
  }

  private hasResourceConflict(
    left: SchedulingFeasibleCandidate,
    right: SchedulingFeasibleCandidate,
  ): boolean {
    if (
      left.dayOfWeek !== right.dayOfWeek ||
      left.startTime >= right.endTime ||
      right.startTime >= left.endTime
    ) {
      return false;
    }
    return (
      left.teacherId === right.teacherId ||
      (left.classroomId !== null && left.classroomId === right.classroomId)
    );
  }

  private isSameCandidate(
    left: SchedulingFeasibleCandidate,
    right: SchedulingFeasibleCandidate,
  ): boolean {
    return (
      left.key === right.key &&
      left.requirementId === right.requirementId &&
      left.courseId === right.courseId &&
      left.teacherId === right.teacherId &&
      left.classroomId === right.classroomId &&
      left.dayOfWeek === right.dayOfWeek &&
      left.startTime === right.startTime &&
      left.endTime === right.endTime
    );
  }

  private coveredStudentIds(
    coverageRecords: SchedulingCandidateCoverage[],
  ): Set<string> {
    return new Set(
      coverageRecords.flatMap(({ coveredStudentIds }) => coveredStudentIds),
    );
  }

  private compareNullableDescending(
    left: number | null,
    right: number | null,
  ): number {
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return right - left;
  }

  private percent(numerator: number, denominator: number): number {
    return this.round((numerator / denominator) * 100, 2);
  }

  private round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}

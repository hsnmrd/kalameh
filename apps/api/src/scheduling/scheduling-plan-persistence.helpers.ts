import type { Prisma } from '@workspace/database';
import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingUnresolvedEvaluationSchema,
  type SchedulingAlternativePlanGeneration,
  type SchedulingScoreCriterion,
  type SchedulingUnresolvedEvaluation,
  type SchedulingWarning,
} from '@workspace/types';

export type PersistenceWeights = {
  studentCoverage: number;
  timeDiversity: number;
};

export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function jsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

export function coverageCriterion(
  coveragePercent: number | null,
  weights: PersistenceWeights,
): SchedulingScoreCriterion {
  if (coveragePercent === null) {
    return {
      code: 'SC_STUDENT_COVERAGE',
      status: 'NOT_APPLICABLE',
      rawValue: null,
      normalizedScore: null,
      weight: weights.studentCoverage,
      weightedPoints: null,
      details: {},
    };
  }
  const normalizedScore = coveragePercent / 100;
  return {
    code: 'SC_STUDENT_COVERAGE',
    status: 'APPLICABLE',
    rawValue: normalizedScore,
    normalizedScore,
    weight: weights.studentCoverage,
    weightedPoints: round(normalizedScore * weights.studentCoverage, 2),
    details: { coveragePercent },
  };
}

export function timeCriterion(
  normalizedScore: number,
  weights: PersistenceWeights,
): SchedulingScoreCriterion {
  return {
    code: 'SC_TIME_PATTERN_DIVERSITY',
    status: 'APPLICABLE',
    rawValue: normalizedScore,
    normalizedScore,
    weight: weights.timeDiversity,
    weightedPoints: round(normalizedScore * weights.timeDiversity, 2),
    details: {},
  };
}

export function planScoreBreakdown(
  composition: SchedulingAlternativePlanGeneration['plans'][number]['composition'],
  weights: PersistenceWeights,
): {
  criteria: SchedulingScoreCriterion[];
  earnedWeightedPoints: number;
  applicableWeightedPoints: number;
  qualityIndex: number | null;
} {
  return {
    criteria: [
      coverageCriterion(composition.summary.coveragePercent, weights),
      timeCriterion(composition.summary.timeDiversityScore, weights),
    ],
    earnedWeightedPoints: composition.summary.earnedWeightedPoints,
    applicableWeightedPoints: composition.summary.applicableWeightedPoints,
    qualityIndex: composition.summary.qualityIndex,
  };
}

export function proposalScoreBreakdown(
  coveragePercent: number | null,
  timeDiversityScore: number,
  earnedWeightedPoints: number,
  weights: PersistenceWeights,
): {
  criteria: SchedulingScoreCriterion[];
  earnedWeightedPoints: number;
  applicableWeightedPoints: number;
  qualityIndex: number | null;
} {
  const applicableWeightedPoints =
    (coveragePercent === null ? 0 : weights.studentCoverage) +
    weights.timeDiversity;
  return {
    criteria: [
      coverageCriterion(coveragePercent, weights),
      timeCriterion(timeDiversityScore, weights),
    ],
    earnedWeightedPoints,
    applicableWeightedPoints,
    qualityIndex:
      applicableWeightedPoints === 0
        ? null
        : round((earnedWeightedPoints / applicableWeightedPoints) * 100, 2),
  };
}

export function planWarnings(
  requirements: SchedulingAlternativePlanGeneration['plans'][number]['composition']['requirements'],
): SchedulingWarning[] {
  const warnings = requirements.flatMap(
    ({ timeDistribution }) => timeDistribution.warnings,
  );
  return Array.from(
    new Map(
      warnings.map((warning) => [JSON.stringify(warning), warning]),
    ).values(),
  );
}

export function resolveProposalDaysOfWeek(
  candidateDayOfWeek: string,
  candidateTimeGroup: string | null,
  sessionsPerWeek: number | null | undefined,
  timeGroupsSnapshot: Prisma.JsonValue,
): string[] {
  const timeGroups = jsonRecord(timeGroupsSnapshot);
  const evenDays: string[] = Array.isArray(timeGroups.evenDays)
    ? (timeGroups.evenDays as string[])
    : ['SATURDAY', 'MONDAY', 'WEDNESDAY'];
  const oddDays: string[] = Array.isArray(timeGroups.oddDays)
    ? (timeGroups.oddDays as string[])
    : ['SUNDAY', 'TUESDAY', 'THURSDAY'];

  const isEven =
    candidateTimeGroup?.startsWith('EVEN') ||
    evenDays.includes(candidateDayOfWeek);
  const isOdd =
    candidateTimeGroup?.startsWith('ODD') ||
    oddDays.includes(candidateDayOfWeek);

  if (sessionsPerWeek === 3) {
    if (isEven) return ['SATURDAY', 'MONDAY', 'WEDNESDAY'];
    if (isOdd) return ['SUNDAY', 'TUESDAY', 'THURSDAY'];
  } else if (sessionsPerWeek === 2) {
    if (isEven) return ['SATURDAY', 'WEDNESDAY'];
    if (isOdd) return ['SUNDAY', 'TUESDAY'];
  }

  return [candidateDayOfWeek];
}

export function validateGenerationScope(
  generation: SchedulingAlternativePlanGeneration,
): void {
  const scopeSignatures = generation.plans.map(({ composition }) =>
    composition.requirements
      .map(
        ({ requirementId, courseId, requiredClassCount }) =>
          `${requirementId}:${courseId}:${requiredClassCount}`,
      )
      .sort()
      .join('|'),
  );
  if (
    scopeSignatures[0] === '' ||
    scopeSignatures.some((signature) => signature !== scopeSignatures[0])
  ) {
    throw new RangeError(
      'generated plans must share one non-empty requirement scope',
    );
  }
}

export function validateUnresolved(
  generation: SchedulingAlternativePlanGeneration,
  unresolvedInput: Record<string, SchedulingUnresolvedEvaluation>,
): Map<string, SchedulingUnresolvedEvaluation> {
  const expectedPlanKeys = generation.plans
    .map(({ planKey }) => planKey)
    .sort();
  const receivedPlanKeys = Object.keys(unresolvedInput).sort();
  if (expectedPlanKeys.join('|') !== receivedPlanKeys.join('|')) {
    throw new RangeError(
      'unresolved evaluations must match generated plan keys',
    );
  }
  return new Map(
    generation.plans.map((plan) => {
      const unresolved = SchedulingUnresolvedEvaluationSchema.parse(
        unresolvedInput[plan.planKey],
      );
      const summary = plan.composition.summary;
      if (
        unresolved.summary.requiredClassCount !== summary.requiredClassCount ||
        unresolved.summary.scheduledClassCount !==
          summary.scheduledClassCount ||
        unresolved.summary.missingClassCount !== summary.missingClassCount
      ) {
        throw new RangeError(
          'unresolved evaluation totals must match plan composition',
        );
      }
      return [plan.planKey, unresolved];
    }),
  );
}

export function resolveWeights(
  overrides: Partial<PersistenceWeights> | undefined,
): PersistenceWeights {
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
    throw new RangeError('persistence weights must match composition limits');
  }
  return weights;
}

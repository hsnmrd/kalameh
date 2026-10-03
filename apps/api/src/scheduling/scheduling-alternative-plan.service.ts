import { Injectable } from '@nestjs/common';
import {
  SchedulingAlternativePlanGenerationSchema,
  type SchedulingAlternativePlanGeneration,
  type SchedulingDeterministicPlanCandidate,
  type SchedulingPlanComposition,
} from '@workspace/types';
import {
  SchedulingPlanCompositionService,
  type ComposeSchedulingPlanInput,
} from './scheduling-plan-composition.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';

const MAX_SEARCH_ATTEMPTS = 100;

export type GenerateAlternativePlansInput = Omit<
  ComposeSchedulingPlanInput,
  'excludedAssignmentKeys'
> & {
  alternativePlanCount: number;
};

type GeneratedComposition = {
  planKey: string;
  excludedAssignmentKeys: string[];
  composition: SchedulingPlanComposition;
};

@Injectable()
export class SchedulingAlternativePlanService {
  constructor(
    private readonly compositionService: SchedulingPlanCompositionService,
    private readonly rankingService: SchedulingDeterministicRankingService,
  ) {}

  generate(
    input: GenerateAlternativePlansInput,
  ): SchedulingAlternativePlanGeneration {
    if (
      !Number.isInteger(input.alternativePlanCount) ||
      input.alternativePlanCount < 1 ||
      input.alternativePlanCount > 3
    ) {
      throw new RangeError('alternative plan count must be from 1 to 3');
    }

    const queue: string[][] = [[]];
    const queuedExclusions = new Set(['']);
    const generatedByPlanKey = new Map<string, GeneratedComposition>();
    let searchAttemptCount = 0;

    while (
      queue.length > 0 &&
      generatedByPlanKey.size < input.alternativePlanCount &&
      searchAttemptCount < MAX_SEARCH_ATTEMPTS
    ) {
      const excludedAssignmentKeys = queue.shift()!;
      searchAttemptCount += 1;
      const composition = this.compositionService.compose({
        requirements: input.requirements,
        feasibleCandidates: input.feasibleCandidates,
        coverageEvaluation: input.coverageEvaluation,
        weights: input.weights,
        excludedAssignmentKeys,
      });
      const planKey = this.planKey(composition);
      if (!generatedByPlanKey.has(planKey)) {
        generatedByPlanKey.set(planKey, {
          planKey,
          excludedAssignmentKeys,
          composition,
        });
      }

      for (const assignmentKey of composition.assignments
        .map(({ candidate }) => candidate.assignmentKey)
        .sort()) {
        const childExclusions = Array.from(
          new Set([...excludedAssignmentKeys, assignmentKey]),
        ).sort();
        const exclusionKey = childExclusions.join('|');
        if (!queuedExclusions.has(exclusionKey)) {
          queuedExclusions.add(exclusionKey);
          queue.push(childExclusions);
        }
      }
      queue.sort((left, right) =>
        left.join('|').localeCompare(right.join('|')),
      );
    }

    const generated = Array.from(generatedByPlanKey.values());
    const ranking = this.rankingService.rank(
      generated.map(({ planKey, composition }) =>
        this.toRankingCandidate(planKey, composition),
      ),
    );
    const generatedLookup = new Map(
      generated.map((item) => [item.planKey, item]),
    );

    return SchedulingAlternativePlanGenerationSchema.parse({
      plans: ranking.plans.map((ranked) => {
        const generatedPlan = generatedLookup.get(ranked.candidate.planKey)!;
        return {
          planKey: generatedPlan.planKey,
          rank: ranked.rank,
          isRecommended: ranked.isRecommended,
          isWithinCoverageBand: ranked.isWithinCoverageBand,
          excludedAssignmentKeys: generatedPlan.excludedAssignmentKeys,
          composition: generatedPlan.composition,
        };
      }),
      summary: {
        requestedPlanCount: input.alternativePlanCount,
        generatedPlanCount: generated.length,
        searchAttemptCount,
        searchLimitReached:
          searchAttemptCount === MAX_SEARCH_ATTEMPTS &&
          generated.length < input.alternativePlanCount,
      },
    });
  }

  private planKey(composition: SchedulingPlanComposition): string {
    const assignmentSignature = composition.assignments
      .map(({ candidate }) => candidate.assignmentKey)
      .sort()
      .join('|');
    return `PLAN::${assignmentSignature || 'EMPTY'}`;
  }

  private toRankingCandidate(
    planKey: string,
    composition: SchedulingPlanComposition,
  ): SchedulingDeterministicPlanCandidate {
    return {
      planKey,
      earnedWeightedPoints: composition.summary.earnedWeightedPoints,
      coveragePercent: composition.summary.coveragePercent,
      minimumCourseCoveragePercent:
        composition.summary.minimumCourseCoveragePercent,
      uncoveredStudentCount: composition.summary.uncoveredStudentCount,
      timeDiversityScore: composition.summary.timeDiversityScore,
      maximumTeacherLoadRatio: 0,
      warningCount: composition.requirements.reduce(
        (sum, requirement) =>
          sum + requirement.timeDistribution.warnings.length,
        0,
      ),
      assignments: composition.assignments.map(({ candidate }) => ({
        assignmentKey: candidate.assignmentKey,
        teacherId: candidate.teacherId,
        courseId: candidate.courseId,
        dayOfWeek: candidate.dayOfWeek,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        classroomId: candidate.classroomId,
      })),
    };
  }
}

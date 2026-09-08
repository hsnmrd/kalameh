import { Injectable } from '@nestjs/common';
import {
  SchedulingTimeDistributionScoreSchema,
  type SchedulingTimeDistributionScore,
  type SchedulingTimeGroup,
  type SchedulingWarning,
} from '@workspace/types';

const PRIMARY_GROUPS = [
  'ODD_MORNING',
  'ODD_EVENING',
  'EVEN_MORNING',
  'EVEN_EVENING',
] as const;

export type ScoreTimeDistributionInput = {
  requirementId: string;
  requiredClassCount: number;
  selectedTimeGroups: SchedulingTimeGroup[];
  weight?: number;
};

@Injectable()
export class SchedulingTimeDistributionService {
  score(input: ScoreTimeDistributionInput): SchedulingTimeDistributionScore {
    if (
      !Number.isInteger(input.requiredClassCount) ||
      input.requiredClassCount < 1
    ) {
      throw new RangeError('required class count must be a positive integer');
    }
    if (input.selectedTimeGroups.length > input.requiredClassCount) {
      throw new RangeError('scheduled classes cannot exceed required classes');
    }
    const weight = input.weight ?? 25;
    if (!Number.isInteger(weight) || weight < 0 || weight > 100) {
      throw new RangeError(
        'time distribution weight must be an integer from 0 to 100',
      );
    }

    const groupCounts = {
      ODD_MORNING: 0,
      ODD_EVENING: 0,
      EVEN_MORNING: 0,
      EVEN_EVENING: 0,
      NEUTRAL_MORNING: 0,
      NEUTRAL_EVENING: 0,
      MIXED_MORNING: 0,
      MIXED_EVENING: 0,
    };
    for (const group of input.selectedTimeGroups) groupCounts[group] += 1;

    const scheduledClassCount = input.selectedTimeGroups.length;
    const targetPrimaryGroupCount = Math.min(input.requiredClassCount, 4);
    const distinctPrimaryGroupCount = PRIMARY_GROUPS.filter(
      (group) => groupCounts[group] > 0,
    ).length;
    const mixedDistinctCount = [
      groupCounts.MIXED_MORNING,
      groupCounts.MIXED_EVENING,
    ].filter((count) => count > 0).length;
    const isSingleClassRequirement = input.requiredClassCount === 1;
    const hasAnyClass = scheduledClassCount > 0;
    const hasOdd = groupCounts.ODD_MORNING + groupCounts.ODD_EVENING > 0;
    const hasEven = groupCounts.EVEN_MORNING + groupCounts.EVEN_EVENING > 0;
    const hasMixed = mixedDistinctCount > 0;
    const hasMorning =
      groupCounts.ODD_MORNING +
        groupCounts.EVEN_MORNING +
        groupCounts.NEUTRAL_MORNING +
        groupCounts.MIXED_MORNING >
      0;
    const hasEvening =
      groupCounts.ODD_EVENING +
        groupCounts.EVEN_EVENING +
        groupCounts.NEUTRAL_EVENING +
        groupCounts.MIXED_EVENING >
      0;
    const dayAxisScore = isSingleClassRequirement
      ? hasAnyClass
        ? 1
        : 0
      : hasOdd && hasEven
        ? 1
        : hasOdd || hasEven || hasMixed
          ? 0.5
          : 0;
    const timeAxisScore = isSingleClassRequirement
      ? hasAnyClass
        ? 1
        : 0
      : Number(hasMorning) / 2 + Number(hasEvening) / 2;
    const effectiveDistinctGroupCount =
      distinctPrimaryGroupCount + mixedDistinctCount * 0.5;
    const groupDiversityScore = isSingleClassRequirement
      ? hasAnyClass
        ? 1
        : 0
      : Math.min(effectiveDistinctGroupCount / targetPrimaryGroupCount, 1);
    const primaryCounts = PRIMARY_GROUPS.map((group) => groupCounts[group]);
    const spread = Math.max(...primaryCounts) - Math.min(...primaryCounts);
    const balanceScore =
      input.requiredClassCount <= 4 || spread <= 1
        ? 1
        : Math.max(0, 1 - spread / input.requiredClassCount);
    const normalizedScore = this.round(
      (dayAxisScore * 0.6 + timeAxisScore * 0.4) *
        groupDiversityScore *
        balanceScore,
      4,
    );
    const warnings: SchedulingWarning[] = [];
    if (scheduledClassCount < input.requiredClassCount) {
      warnings.push({
        code: 'MISSING_SCHEDULED_CLASSES',
        severity: 'WARNING',
        scope: 'REQUIREMENT',
        context: {
          requiredClassCount: input.requiredClassCount,
          scheduledClassCount,
        },
      });
    }
    if (groupCounts.NEUTRAL_MORNING + groupCounts.NEUTRAL_EVENING > 0) {
      warnings.push({
        code: 'NEUTRAL_TIME_GROUP_USED',
        severity: 'INFO',
        scope: 'REQUIREMENT',
        context: {},
      });
    }
    if (normalizedScore < 1) {
      warnings.push({
        code: 'TIME_PATTERN_NOT_DIVERSE',
        severity: 'WARNING',
        scope: 'REQUIREMENT',
        context: {},
      });
    }
    if (input.requiredClassCount > 4 && balanceScore < 1) {
      warnings.push({
        code: 'TIME_GROUP_IMBALANCED',
        severity: 'WARNING',
        scope: 'REQUIREMENT',
        context: { spread },
      });
    }

    return SchedulingTimeDistributionScoreSchema.parse({
      requirementId: input.requirementId,
      requiredClassCount: input.requiredClassCount,
      scheduledClassCount,
      targetPrimaryGroupCount,
      distinctPrimaryGroupCount,
      groupCounts,
      dayAxisScore,
      timeAxisScore,
      groupDiversityScore,
      balanceScore,
      criterion: {
        code: 'SC_TIME_PATTERN_DIVERSITY',
        status: 'APPLICABLE',
        rawValue: normalizedScore,
        normalizedScore,
        weight,
        weightedPoints: this.round(normalizedScore * weight, 2),
        details: {
          dayAxisWeight: 0.6,
          timeAxisWeight: 0.4,
          targetPrimaryGroupCount,
          distinctPrimaryGroupCount,
        },
      },
      warnings,
    });
  }

  private round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }
}

import { z } from "zod"
import { SchedulingSelectedAssignmentSchema } from "./scheduling-selected-assignment.schema.js"
import { SchedulingTimeDistributionScoreSchema } from "./scheduling-time-distribution-score.schema.js"

export const SchedulingComposedRequirementSchema = z
  .object({
    requirementId: z.string().uuid(),
    courseId: z.string().uuid(),
    requiredClassCount: z.number().int().positive(),
    scheduledClassCount: z.number().int().nonnegative(),
    missingClassCount: z.number().int().nonnegative(),
    knownStudentCount: z.number().int().nonnegative(),
    coveredStudentCount: z.number().int().nonnegative(),
    coveragePercent: z.number().min(0).max(100).nullable(),
    selectedAssignmentKeys: z.array(z.string().trim().min(1)),
    timeDistribution: SchedulingTimeDistributionScoreSchema,
  })
  .superRefine((requirement, context) => {
    const expectedCoverage =
      requirement.knownStudentCount === 0
        ? null
        : Math.round(
            (requirement.coveredStudentCount / requirement.knownStudentCount) *
              10000
          ) / 100

    if (
      requirement.scheduledClassCount > requirement.requiredClassCount ||
      requirement.missingClassCount !==
        requirement.requiredClassCount - requirement.scheduledClassCount ||
      requirement.selectedAssignmentKeys.length !==
        requirement.scheduledClassCount ||
      new Set(requirement.selectedAssignmentKeys).size !==
        requirement.selectedAssignmentKeys.length ||
      requirement.coveredStudentCount > requirement.knownStudentCount ||
      requirement.coveragePercent !== expectedCoverage ||
      requirement.timeDistribution.requirementId !==
        requirement.requirementId ||
      requirement.timeDistribution.requiredClassCount !==
        requirement.requiredClassCount ||
      requirement.timeDistribution.scheduledClassCount !==
        requirement.scheduledClassCount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledClassCount"],
      })
    }
  })

export const SchedulingPlanCompositionSchema = z
  .object({
    assignments: z.array(SchedulingSelectedAssignmentSchema),
    requirements: z.array(SchedulingComposedRequirementSchema),
    summary: z.object({
      requiredClassCount: z.number().int().nonnegative(),
      scheduledClassCount: z.number().int().nonnegative(),
      missingClassCount: z.number().int().nonnegative(),
      knownStudentCount: z.number().int().nonnegative(),
      unknownStudentCount: z.number().int().nonnegative(),
      coveredStudentCount: z.number().int().nonnegative(),
      uncoveredStudentCount: z.number().int().nonnegative(),
      coveragePercent: z.number().min(0).max(100).nullable(),
      minimumCourseCoveragePercent: z.number().min(0).max(100).nullable(),
      timeDiversityScore: z.number().min(0).max(1),
      earnedWeightedPoints: z.number().min(0).max(100),
      applicableWeightedPoints: z.number().min(0).max(100),
      qualityIndex: z.number().min(0).max(100).nullable(),
    }),
  })
  .superRefine((composition, context) => {
    const requiredClassCount = composition.requirements.reduce(
      (sum, requirement) => sum + requirement.requiredClassCount,
      0
    )
    const scheduledClassCount = composition.requirements.reduce(
      (sum, requirement) => sum + requirement.scheduledClassCount,
      0
    )
    const assignmentKeys = composition.assignments.map(
      ({ candidate }) => candidate.assignmentKey
    )
    const candidateKeys = composition.assignments.map(
      ({ candidate }) => candidate.key
    )
    const referencedAssignmentKeys = composition.requirements.flatMap(
      ({ selectedAssignmentKeys }) => selectedAssignmentKeys
    )
    const expectedCoveragePercent =
      composition.summary.knownStudentCount === 0
        ? null
        : Math.round(
            (composition.summary.coveredStudentCount /
              composition.summary.knownStudentCount) *
              10000
          ) / 100
    const expectedTimeDiversityScore =
      requiredClassCount === 0
        ? 0
        : Math.round(
            (composition.requirements.reduce(
              (sum, requirement) =>
                sum +
                requirement.timeDistribution.criterion.normalizedScore! *
                  requirement.requiredClassCount,
              0
            ) /
              requiredClassCount) *
              10000
          ) / 10000
    const expectedQualityIndex =
      composition.summary.applicableWeightedPoints === 0
        ? null
        : Math.round(
            (composition.summary.earnedWeightedPoints /
              composition.summary.applicableWeightedPoints) *
              10000
          ) / 100

    if (
      new Set(
        composition.requirements.map(({ requirementId }) => requirementId)
      ).size !== composition.requirements.length ||
      new Set(assignmentKeys).size !== assignmentKeys.length ||
      new Set(candidateKeys).size !== candidateKeys.length ||
      [...assignmentKeys].sort().join("|") !==
        [...referencedAssignmentKeys].sort().join("|") ||
      composition.assignments.some(
        ({ candidate }) =>
          !composition.requirements.some(
            ({ requirementId, selectedAssignmentKeys }) =>
              requirementId === candidate.requirementId &&
              selectedAssignmentKeys.includes(candidate.assignmentKey)
          )
      ) ||
      composition.summary.requiredClassCount !== requiredClassCount ||
      composition.summary.scheduledClassCount !== scheduledClassCount ||
      composition.summary.scheduledClassCount !==
        composition.assignments.length ||
      composition.summary.missingClassCount !==
        requiredClassCount - scheduledClassCount ||
      composition.summary.coveredStudentCount >
        composition.summary.knownStudentCount ||
      composition.summary.uncoveredStudentCount !==
        composition.summary.knownStudentCount -
          composition.summary.coveredStudentCount ||
      composition.summary.coveragePercent !== expectedCoveragePercent ||
      composition.summary.timeDiversityScore !== expectedTimeDiversityScore ||
      composition.summary.qualityIndex !== expectedQualityIndex
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["summary"] })
    }
  })

export type SchedulingComposedRequirement = z.infer<
  typeof SchedulingComposedRequirementSchema
>
export type SchedulingPlanComposition = z.infer<
  typeof SchedulingPlanCompositionSchema
>

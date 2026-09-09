import { z } from "zod"
import { SchedulingFeasibleCandidateSchema } from "./scheduling-feasible-candidate.schema.js"
import { SchedulingSelectionReasonSchema } from "./scheduling-selection-reason.schema.js"

export const SchedulingSelectedAssignmentSchema = z.object({
  candidate: SchedulingFeasibleCandidateSchema,
  incrementalCoveredStudentCount: z.number().int().nonnegative(),
  projectedCoveragePercent: z.number().min(0).max(100).nullable(),
  projectedTimeDiversityScore: z.number().min(0).max(1),
  projectedWeightedPoints: z.number().min(0).max(100),
  selectionReasons: z.array(SchedulingSelectionReasonSchema).min(1),
})

export type SchedulingSelectedAssignment = z.infer<
  typeof SchedulingSelectedAssignmentSchema
>

import { z } from "zod"
import { SchedulingUnresolvedRequirementInputSchema } from "./scheduling-unresolved-requirement-input.schema.js"

export const SchedulingUnresolvedEvaluationSchema = z
  .object({
    items: z.array(SchedulingUnresolvedRequirementInputSchema),
    summary: z.object({
      requiredClassCount: z.number().int().nonnegative(),
      scheduledClassCount: z.number().int().nonnegative(),
      missingClassCount: z.number().int().nonnegative(),
      unresolvedRequirementCount: z.number().int().nonnegative(),
    }),
  })
  .superRefine((evaluation, context) => {
    const missingClassCount = evaluation.items.reduce(
      (sum, item) => sum + item.missingClassCount,
      0
    )

    if (
      evaluation.summary.requiredClassCount -
        evaluation.summary.scheduledClassCount !==
        evaluation.summary.missingClassCount ||
      evaluation.summary.missingClassCount !== missingClassCount ||
      evaluation.summary.unresolvedRequirementCount !==
        evaluation.items.length ||
      new Set(evaluation.items.map((item) => item.classRequirementId)).size !==
        evaluation.items.length
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["summary"] })
    }
  })

export type SchedulingUnresolvedEvaluation = z.infer<
  typeof SchedulingUnresolvedEvaluationSchema
>

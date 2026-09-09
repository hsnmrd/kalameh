import { z } from "zod"

export const SchedulingDispatchResultSchema = z
  .object({
    discoveredRunCount: z.number().int().nonnegative(),
    completedRunCount: z.number().int().nonnegative(),
    failedRunCount: z.number().int().nonnegative(),
    skippedRunCount: z.number().int().nonnegative(),
    requeuedStaleRunCount: z.number().int().nonnegative(),
  })
  .superRefine((result, context) => {
    const handledRunCount =
      result.completedRunCount + result.failedRunCount + result.skippedRunCount

    if (handledRunCount !== result.discoveredRunCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dispatch result counts must balance",
      })
    }
  })

export type SchedulingDispatchResult = z.infer<
  typeof SchedulingDispatchResultSchema
>

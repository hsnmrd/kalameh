import { z } from "zod"

export const SetSchedulingProposalLockSchema = z.object({
  isLocked: z.boolean(),
})

export type SetSchedulingProposalLockInput = z.infer<
  typeof SetSchedulingProposalLockSchema
>

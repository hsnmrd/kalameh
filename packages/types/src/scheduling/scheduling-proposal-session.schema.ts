import { z } from "zod"
import { SCHEDULING_TIME_REGEX } from "./scheduling.constants.js"

export const SchedulingProposalSessionSchema = z
  .object({
    id: z.string().uuid(),
    instituteId: z.string().uuid(),
    planId: z.string().uuid(),
    proposalId: z.string().uuid(),
    sessionDate: z.string().or(z.date()),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .superRefine((session, context) => {
    if (session.startTime >= session.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
      })
    }
  })

export type SchedulingProposalSessionDto = z.infer<
  typeof SchedulingProposalSessionSchema
>

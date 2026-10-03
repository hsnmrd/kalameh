import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"
import { SchedulingCandidateSlotSchema } from "./scheduling-candidate-slot.schema.js"

export const SchedulingFeasibleCandidateSchema = z
  .intersection(
    SchedulingCandidateSlotSchema,
    z.object({
      assignmentKey: z.string().trim().min(1),
      classroomId: z.string().uuid().nullable(),
      deliveryMode: z.enum(CLASS_DELIVERY_MODES),
      capacity: z.number().int().positive(),
    })
  )
  .superRefine((candidate, context) => {
    if (
      (candidate.deliveryMode === "IN_PERSON" && !candidate.classroomId) ||
      (candidate.deliveryMode === "ONLINE" && candidate.classroomId)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classroomId"],
      })
    }
  })

export type SchedulingFeasibleCandidate = z.infer<
  typeof SchedulingFeasibleCandidateSchema
>

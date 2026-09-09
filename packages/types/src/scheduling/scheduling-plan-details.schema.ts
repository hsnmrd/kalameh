import { z } from "zod"
import { SchedulingPlanSchema } from "./scheduling-plan.schema.js"
import { SchedulingProposalSchema } from "./scheduling-proposal.schema.js"
import { SchedulingUnresolvedRequirementSchema } from "./scheduling-unresolved-requirement.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_RUN_STATUSES,
} from "./scheduling.constants.js"

const SchedulingCourseReferenceSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
})

const SchedulingBranchReferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

const SchedulingClassroomReferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  capacity: z.number().int().positive(),
})

const SchedulingUserReferenceSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable().optional(),
})

const SchedulingRequirementReferenceSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  requiredClassCount: z.number().int().positive(),
  capacity: z.number().int().positive(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  course: SchedulingCourseReferenceSchema,
})

export const SchedulingProposalDetailsSchema = SchedulingProposalSchema.and(
  z.object({
    course: SchedulingCourseReferenceSchema,
    teacher: SchedulingUserReferenceSchema,
    branch: SchedulingBranchReferenceSchema.nullable(),
    classroom: SchedulingClassroomReferenceSchema.nullable(),
    classRequirement: SchedulingRequirementReferenceSchema.nullable(),
    lockedBy: SchedulingUserReferenceSchema.nullable(),
  })
)

export const SchedulingUnresolvedRequirementDetailsSchema =
  SchedulingUnresolvedRequirementSchema.extend({
    classRequirement: SchedulingRequirementReferenceSchema.nullable(),
  })

export const SchedulingPlanDetailsSchema = SchedulingPlanSchema.extend({
  proposals: z.array(SchedulingProposalDetailsSchema),
  unresolvedRequirements: z.array(SchedulingUnresolvedRequirementDetailsSchema),
  run: z.object({
    id: z.string().uuid(),
    status: z.enum(SCHEDULING_RUN_STATUSES),
    termId: z.string().uuid(),
    branchId: z.string().uuid().nullable(),
    term: z.object({
      id: z.string().uuid(),
      title: z.string(),
      startDate: z.string().or(z.date()),
      endDate: z.string().or(z.date()),
    }),
    branch: SchedulingBranchReferenceSchema.nullable(),
  }),
})

export type SchedulingPlanDetailsDto = z.infer<
  typeof SchedulingPlanDetailsSchema
>

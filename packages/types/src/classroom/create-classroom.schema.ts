import { z } from "zod"

export const createCreateClassroomSchema = (msg?: {
  nameMin?: string
  capacityMin?: string
}) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined),
    capacity: z
      .number({
        invalid_type_error: msg?.capacityMin,
      })
      .int()
      .min(1, msg?.capacityMin ? { message: msg.capacityMin } : undefined),
    branchId: z.string().uuid().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    instituteId: z.string().uuid().optional(),
    isActive: z.boolean().default(true).optional(),
  })

export const CreateClassroomSchema = createCreateClassroomSchema()
export type CreateClassroomInput = z.infer<typeof CreateClassroomSchema>

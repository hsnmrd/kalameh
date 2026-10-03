import { z } from "zod"

export const createUpdateClassroomSchema = (msg?: {
  nameMin?: string
  capacityMin?: string
}) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined)
      .optional(),
    capacity: z
      .number({
        invalid_type_error: msg?.capacityMin,
      })
      .int()
      .min(1, msg?.capacityMin ? { message: msg.capacityMin } : undefined)
      .optional(),
    branchId: z.string().uuid().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
  })

export const UpdateClassroomSchema = createUpdateClassroomSchema()
export type UpdateClassroomInput = z.infer<typeof UpdateClassroomSchema>

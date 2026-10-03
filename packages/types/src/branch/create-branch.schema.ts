import { z } from "zod"

export const createCreateBranchSchema = (msg?: { nameMin?: string }) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined),
    address: z.string().trim().optional().nullable(),
    phones: z
      .preprocess((val) => {
        if (typeof val === "string") return val ? [val] : []
        if (Array.isArray(val)) return val.filter(Boolean)
        return []
      }, z.array(z.string().trim()))
      .optional(),
    instituteId: z.string().uuid().optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .default(true)
      .optional(),
  })

export const CreateBranchSchema = createCreateBranchSchema()
export type CreateBranchInput = z.infer<typeof CreateBranchSchema>

import { z } from "zod"

export const createUpdateBranchSchema = (msg?: { nameMin?: string }) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined)
      .optional(),
    address: z.string().trim().optional().nullable(),
    phones: z
      .preprocess((val) => {
        if (typeof val === "string") return val ? [val] : []
        if (Array.isArray(val)) return val.filter(Boolean)
        return []
      }, z.array(z.string().trim()))
      .optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .optional(),
  })

export const UpdateBranchSchema = createUpdateBranchSchema()
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>

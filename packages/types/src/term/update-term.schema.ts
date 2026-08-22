import { z } from "zod"

export const createUpdateTermSchema = (msg?: { titleMin?: string }) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined)
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
  })

export const UpdateTermSchema = createUpdateTermSchema()
export type UpdateTermInput = z.infer<typeof UpdateTermSchema>

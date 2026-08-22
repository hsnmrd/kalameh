import { z } from "zod"

export const createUpdateCourseSchema = (msg?: {
  titleMin?: string
  baseFeeMin?: string
}) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined)
      .optional(),
    baseFee: z
      .number()
      .min(0, msg?.baseFeeMin ? { message: msg.baseFeeMin } : undefined)
      .optional(),
    prerequisiteId: z.string().uuid().optional().nullable(),
  })

export const UpdateCourseSchema = createUpdateCourseSchema()
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>

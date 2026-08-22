import { z } from "zod"

export const createCreateCourseSchema = (msg?: {
  titleMin?: string
  baseFeeMin?: string
}) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined),
    baseFee: z
      .number({
        invalid_type_error: msg?.baseFeeMin,
      })
      .min(0, msg?.baseFeeMin ? { message: msg.baseFeeMin } : undefined),
    prerequisiteId: z.string().uuid().optional().nullable(),
  })

export const CreateCourseSchema = createCreateCourseSchema()
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>

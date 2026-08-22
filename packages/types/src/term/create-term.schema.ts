import { z } from "zod"

export const createCreateTermSchema = (msg?: {
  titleMin?: string
  startDateRequired?: string
  endDateRequired?: string
}) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined),
    startDate: z
      .string()
      .min(
        1,
        msg?.startDateRequired ? { message: msg.startDateRequired } : undefined
      ),
    endDate: z
      .string()
      .min(
        1,
        msg?.endDateRequired ? { message: msg.endDateRequired } : undefined
      ),
    isActive: z.boolean().default(true),
  })

export const CreateTermSchema = createCreateTermSchema()
export type CreateTermInput = z.infer<typeof CreateTermSchema>

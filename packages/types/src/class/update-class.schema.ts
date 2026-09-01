import { z } from "zod"

export const createUpdateClassSchema = (msg?: {
  titleMin?: string
  capacityMin?: string
  feeMin?: string
}) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined)
      .optional(),
    termId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional().nullable(),
    capacity: z
      .number()
      .int()
      .min(1, msg?.capacityMin ? { message: msg.capacityMin } : undefined)
      .optional(),
    fee: z
      .number()
      .min(0, msg?.feeMin ? { message: msg.feeMin } : undefined)
      .optional(),
    teacherName: z.string().trim().optional().nullable(),
    schedule: z.string().trim().optional().nullable(),
    daysOfWeek: z.array(z.string()).optional(),
    sessionDates: z.array(z.string()).optional(),
    startTime: z.string().trim().optional().nullable(),
    endTime: z.string().trim().optional().nullable(),
  })

export const UpdateClassSchema = createUpdateClassSchema()
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>

import { z } from "zod"

export const createCreateClassSchema = (msg?: {
  titleMin?: string
  capacityMin?: string
  feeMin?: string
  termIdRequired?: string
  courseIdRequired?: string
}) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined),
    termId: z
      .string()
      .uuid(msg?.termIdRequired ? { message: msg.termIdRequired } : undefined),
    courseId: z
      .string()
      .uuid(
        msg?.courseIdRequired ? { message: msg.courseIdRequired } : undefined
      ),
    branchId: z.string().uuid().optional().nullable(),
    classroomId: z.string().uuid().optional().nullable(),
    capacity: z
      .number({
        invalid_type_error: msg?.capacityMin,
      })
      .int()
      .min(1, msg?.capacityMin ? { message: msg.capacityMin } : undefined),
    fee: z
      .number({
        invalid_type_error: msg?.feeMin,
      })
      .min(0, msg?.feeMin ? { message: msg.feeMin } : undefined),
    teacherName: z.string().trim().optional().nullable(),
    schedule: z.string().trim().optional().nullable(),
    daysOfWeek: z.array(z.string()).default([]).optional(),
    sessionDates: z.array(z.string()).default([]).optional(),
    startTime: z.string().trim().optional().nullable(),
    endTime: z.string().trim().optional().nullable(),
    instituteId: z.string().uuid().optional(),
  })

export const CreateClassSchema = createCreateClassSchema()
export type CreateClassInput = z.infer<typeof CreateClassSchema>

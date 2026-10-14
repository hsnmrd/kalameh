import { z } from "zod"

export const CourseNamingFormatEnum = z.enum(["INDEX", "PART", "TERM"])
export type CourseNamingFormat = z.infer<typeof CourseNamingFormatEnum>

export const createGenerateCoursesFromBookSchema = (msg?: {
  termsCountMin?: string
  termsCountMax?: string
  baseFeeMin?: string
}) =>
  z.object({
    bookId: z.string(),
    termsCount: z
      .number({
        invalid_type_error: msg?.termsCountMin,
      })
      .int()
      .min(1, msg?.termsCountMin ? { message: msg.termsCountMin } : undefined)
      .max(20, msg?.termsCountMax ? { message: msg.termsCountMax } : undefined),
    baseFee: z
      .number({
        invalid_type_error: msg?.baseFeeMin,
      })
      .min(0, msg?.baseFeeMin ? { message: msg.baseFeeMin } : undefined),
    startingPrerequisiteId: z.string().optional().nullable(),
    namingFormat: CourseNamingFormatEnum.default("INDEX").optional(),
    instituteId: z.string().optional(),
  })

export const GenerateCoursesFromBookSchema =
  createGenerateCoursesFromBookSchema()
export type GenerateCoursesFromBookInput = z.infer<
  typeof GenerateCoursesFromBookSchema
>

export const BatchGenerateBookItemSchema = z.object({
  bookId: z.string(),
  termsCount: z.number().int().min(1).max(20),
  baseFee: z.number().min(0),
  startingPrerequisiteId: z.string().optional().nullable(),
  namingFormat: CourseNamingFormatEnum.default("INDEX").optional(),
})
export type BatchGenerateBookItem = z.infer<typeof BatchGenerateBookItemSchema>

export const BatchGenerateCoursesSchema = z.object({
  items: z.array(BatchGenerateBookItemSchema).min(1),
  instituteId: z.string().optional(),
})
export type BatchGenerateCoursesInput = z.infer<
  typeof BatchGenerateCoursesSchema
>

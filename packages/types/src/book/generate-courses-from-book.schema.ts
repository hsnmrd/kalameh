import { z } from "zod"

export const CourseNamingFormatEnum = z.enum(["PART", "TERM"])
export type CourseNamingFormat = z.infer<typeof CourseNamingFormatEnum>

export const createGenerateCoursesFromBookSchema = (msg?: {
  termsCountMin?: string
  termsCountMax?: string
  baseFeeMin?: string
}) =>
  z.object({
    bookId: z.string().uuid(),
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
    startingPrerequisiteId: z.string().uuid().optional().nullable(),
    namingFormat: CourseNamingFormatEnum.default("PART").optional(),
    instituteId: z.string().uuid().optional(),
  })

export const GenerateCoursesFromBookSchema =
  createGenerateCoursesFromBookSchema()
export type GenerateCoursesFromBookInput = z.infer<
  typeof GenerateCoursesFromBookSchema
>

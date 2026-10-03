import { z } from "zod"

export const InstituteCustomOffDaySchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Date must be in YYYY-MM-DD format",
    }),
  title: z.string().min(1).max(100),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type InstituteCustomOffDay = z.infer<typeof InstituteCustomOffDaySchema>

export const createCreateInstituteCustomOffDaySchema = (msg?: {
  titleMin?: string
  dateInvalid?: string
  rangeInvalid?: string
}) =>
  z
    .object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
          message: msg?.dateInvalid ?? "Date must be in YYYY-MM-DD format",
        })
        .optional(),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
          message:
            msg?.dateInvalid ?? "Start date must be in YYYY-MM-DD format",
        })
        .optional(),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
          message: msg?.dateInvalid ?? "End date must be in YYYY-MM-DD format",
        })
        .optional(),
      title: z
        .string()
        .trim()
        .min(
          1,
          msg?.titleMin
            ? { message: msg.titleMin }
            : { message: "Title is required" }
        )
        .max(100),
    })
    .refine((data) => Boolean(data.date || data.startDate), {
      message: msg?.dateInvalid ?? "Date or start date is required",
      path: ["startDate"],
    })
    .refine(
      (data) => {
        const start = data.startDate || data.date
        const end = data.endDate || start
        if (!start || !end) return true
        return start <= end
      },
      {
        message:
          msg?.rangeInvalid ?? "End date must be after or equal to start date",
        path: ["endDate"],
      }
    )

export const CreateInstituteCustomOffDaySchema =
  createCreateInstituteCustomOffDaySchema()

export type CreateInstituteCustomOffDayInput = z.infer<
  typeof CreateInstituteCustomOffDaySchema
>

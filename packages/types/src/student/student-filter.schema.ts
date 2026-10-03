import { z } from "zod"

const StudentStatusFilterSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value
  if (value === "true" || value === "ACTIVE") return true
  if (value === "false" || value === "INACTIVE") return false
  if (value === undefined || value === "" || value === "ALL") return undefined
  return value
}, z.boolean().optional())

export const StudentFilterSchema = z.object({
  search: z.string().trim().optional(),
  courseId: z.string().uuid().optional(),
  isActive: StudentStatusFilterSchema,
  instituteId: z.string().uuid().optional(),
})

export type StudentFilterInput = z.infer<typeof StudentFilterSchema>

import { z } from "zod"

const parseCourseIds = (value: unknown): unknown => {
  if (value === undefined || Array.isArray(value)) return value
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : value
  } catch {
    return [value]
  }
}

export const TeacherCourseIdsInputSchema = z.preprocess(
  parseCourseIds,
  z
    .array(z.string().uuid())
    .transform((courseIds) => Array.from(new Set(courseIds)))
)

export const TeacherCourseQualificationSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  teacherProfileId: z.string().uuid(),
  courseId: z.string().uuid(),
  course: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
    })
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type TeacherCourseQualification = z.infer<
  typeof TeacherCourseQualificationSchema
>

import { z } from "zod"
import { RoleEnum } from "../roles/index.js"
import { TeacherProfileSchema } from "./teacher-profile.schema.js"

export const TeacherDtoSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  role: RoleEnum.default("TEACHER"),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  nationalCode: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  isActive: z.boolean(),
  teacherProfile: TeacherProfileSchema.nullable().optional(),
  classesCount: z.number().optional(),
  teachingClasses: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        schedule: z.string().nullable().optional(),
        term: z
          .object({
            id: z.string().uuid(),
            title: z.string(),
            isActive: z.boolean().optional(),
            startDate: z.string().or(z.date()).optional(),
            endDate: z.string().or(z.date()).optional(),
          })
          .optional(),
        course: z
          .object({
            id: z.string().uuid(),
            title: z.string(),
          })
          .optional(),
        enrolledCount: z.number().optional(),
      })
    )
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type TeacherDto = z.infer<typeof TeacherDtoSchema>

export const TeacherLookupResponseSchema = z.object({
  found: z.boolean(),
  teacher: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      nationalCode: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
      bio: z.string().nullable().optional(),
      degree: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type TeacherLookupResponse = z.infer<typeof TeacherLookupResponseSchema>

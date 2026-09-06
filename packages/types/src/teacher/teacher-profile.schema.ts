import { z } from "zod"
import { TeacherAvailabilitySchema } from "./teacher-availability.schema.js"

export const TeacherProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bio: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  specialties: z.array(z.string()).default([]),
  availabilities: z.array(TeacherAvailabilitySchema).default([]),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type TeacherProfile = z.infer<typeof TeacherProfileSchema>

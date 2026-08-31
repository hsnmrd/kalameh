import { z } from "zod"
import { StudentNoteSchema } from "./student-note.schema.js"

export const StudentProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  fatherName: z.string().trim().nullable().optional(),
  birthDate: z.date().or(z.string()).nullable().optional(),
  gender: z.string().nullable().optional(),
  emergencyPhone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  notes: z.array(StudentNoteSchema).optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})

export type StudentProfileDto = z.infer<typeof StudentProfileSchema>

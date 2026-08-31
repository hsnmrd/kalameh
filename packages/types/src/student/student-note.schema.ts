import { z } from "zod"

export const StudentNoteSchema = z.object({
  id: z.string().uuid(),
  studentProfileId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
  content: z.string().trim(),
  createdBy: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export const AddStudentNoteSchema = z.object({
  content: z.string().trim().min(1),
})

export type StudentNoteDto = z.infer<typeof StudentNoteSchema>
export type AddStudentNoteInput = z.infer<typeof AddStudentNoteSchema>

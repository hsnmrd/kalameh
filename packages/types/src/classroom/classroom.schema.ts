import { z } from "zod"

export const ClassroomSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  name: z.string(),
  capacity: z.number(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  branch: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  classesCount: z.number().default(0).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type Classroom = z.infer<typeof ClassroomSchema>
export type ClassroomDto = Classroom

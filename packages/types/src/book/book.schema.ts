import { z } from "zod"

export const BookSchema = z.object({
  id: z.string(),
  instituteId: z.string().nullable().optional(),
  title: z.string(),
  author: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isGlobal: z.boolean().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  coursesCount: z.number().optional(),
})

export type BookDto = z.infer<typeof BookSchema>

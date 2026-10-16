import { z } from "zod"

export const createCreateBookSchema = (msg?: { titleMin?: string }) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined),
    author: z.string().trim().optional().nullable(),
    publisher: z.string().trim().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    instituteId: z.string().uuid().optional(),
  })

export const CreateBookSchema = createCreateBookSchema()
export type CreateBookInput = z.infer<typeof CreateBookSchema>

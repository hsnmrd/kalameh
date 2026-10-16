import { z } from "zod"

export const createUpdateBookSchema = (msg?: { titleMin?: string }) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined)
      .optional(),
    author: z.string().trim().optional().nullable(),
    publisher: z.string().trim().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  })

export const UpdateBookSchema = createUpdateBookSchema()
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>

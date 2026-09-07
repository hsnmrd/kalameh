import { z } from "zod"

export const CreateTransactionSchema = z.object({
  receipt: z.any().optional().nullable(),
  amount: z.coerce.number().int().positive(),
  trackingCode: z.string().trim().min(1).max(100),
  paymentDate: z.string().datetime().optional(),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

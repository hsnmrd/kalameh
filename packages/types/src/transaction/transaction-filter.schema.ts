import { z } from "zod"
import { TransactionStatusSchema } from "./transaction.schema.js"

export const TransactionFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: TransactionStatusSchema.optional(),
  instituteId: z.string().uuid().optional(),
})

export type TransactionFilterInput = z.infer<typeof TransactionFilterSchema>

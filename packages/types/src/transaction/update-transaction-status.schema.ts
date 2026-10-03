import { z } from "zod"
import { TransactionStatusSchema } from "./transaction.schema.js"

export const UpdateTransactionStatusSchema = z.object({
  status: TransactionStatusSchema,
})

export type UpdateTransactionStatusInput = z.infer<
  typeof UpdateTransactionStatusSchema
>

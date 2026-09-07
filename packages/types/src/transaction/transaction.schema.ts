import { z } from "zod"

export const TRANSACTION_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export const TransactionStatusSchema = z.enum([
  TRANSACTION_STATUSES.PENDING,
  TRANSACTION_STATUSES.APPROVED,
  TRANSACTION_STATUSES.REJECTED,
])

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>

export const TransactionStudentSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable().optional(),
})

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  studentId: z.string().uuid(),
  amount: z.number().int().positive(),
  trackingCode: z.string(),
  receiptImageUrl: z.string(),
  status: TransactionStatusSchema,
  paymentDate: z.string().or(z.date()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  student: TransactionStudentSchema,
})

export type TransactionDto = z.infer<typeof TransactionSchema>

import { z } from "zod"

export const ENROLLMENT_STATUSES = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ENROLLED: "ENROLLED",
  REJECTED: "REJECTED",
  WAITLISTED: "WAITLISTED",
} as const

export const EnrollmentStatusSchema = z.enum([
  ENROLLMENT_STATUSES.PENDING_PAYMENT,
  ENROLLMENT_STATUSES.PENDING_APPROVAL,
  ENROLLMENT_STATUSES.ENROLLED,
  ENROLLMENT_STATUSES.REJECTED,
  ENROLLMENT_STATUSES.WAITLISTED,
])

export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>

export const BankInfoSchema = z.object({
  bankCardNumber: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankShaba: z.string().nullable().optional(),
})

export type BankInfoDto = z.infer<typeof BankInfoSchema>

export const ReserveClassSchema = z.object({
  classId: z.string().uuid(),
})

export type ReserveClassInput = z.infer<typeof ReserveClassSchema>

export const WaitlistClassSchema = z.object({
  classId: z.string().uuid(),
})

export type WaitlistClassInput = z.infer<typeof WaitlistClassSchema>

export const ReservationResponseSchema = z.object({
  classId: z.string().uuid(),
  classTitle: z.string(),
  tuition: z.number().int().nonnegative(),
  reservedUntil: z.string().or(z.date()),
  remainingSeconds: z.number().int().nonnegative(),
  bankInfo: BankInfoSchema,
  status: EnrollmentStatusSchema,
})

export type ReservationResponseDto = z.infer<typeof ReservationResponseSchema>

export const EnrollmentClassSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  fee: z.number().int().nonnegative(),
  capacity: z.number().int().positive(),
  schedule: z.string().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  term: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      startDate: z.string().or(z.date()).optional(),
      endDate: z.string().or(z.date()).optional(),
    })
    .optional()
    .nullable(),
})

export const EnrollmentStudentSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable().optional(),
})

export const EnrollmentTransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().positive(),
  trackingCode: z.string(),
  receiptImageUrl: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  paymentDate: z.string().or(z.date()),
})

export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  status: EnrollmentStatusSchema,
  finalScore: z.number().nullable().optional(),
  isPassed: z.boolean().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  class: EnrollmentClassSchema.optional(),
  student: EnrollmentStudentSchema.optional(),
  transaction: EnrollmentTransactionSchema.nullable().optional(),
  remainingReservationSeconds: z.number().optional(),
})

export type EnrollmentDto = z.infer<typeof EnrollmentSchema>

export const PromoteWaitlistSchema = z.object({
  status: z
    .enum([ENROLLMENT_STATUSES.PENDING_PAYMENT, ENROLLMENT_STATUSES.ENROLLED])
    .default(ENROLLMENT_STATUSES.PENDING_PAYMENT),
})

export type PromoteWaitlistInput = z.infer<typeof PromoteWaitlistSchema>

export const EnrollmentFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: EnrollmentStatusSchema.optional(),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
})

export type EnrollmentFilterInput = z.infer<typeof EnrollmentFilterSchema>

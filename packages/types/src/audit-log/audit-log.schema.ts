import { z } from "zod"
import type { Role } from "../roles/roles.constant.js"

export const AuditLogUserSummarySchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  role: z.string() as z.ZodType<Role>,
  avatarUrl: z.string().nullable().optional(),
})
export type AuditLogUserSummary = z.infer<typeof AuditLogUserSummarySchema>

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  userId: z.string().uuid(),
  module: z.string(),
  entityId: z.string(),
  action: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  user: AuditLogUserSummarySchema.optional(),
})
export type AuditLogDto = z.infer<typeof AuditLogSchema>

export const AuditLogFilterSchema = z.object({
  instituteId: z.string().uuid().optional(),
  module: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
})
export type AuditLogFilter = z.infer<typeof AuditLogFilterSchema>

export interface CreateAuditLogInput {
  instituteId: string
  userId: string
  module: string
  entityId: string
  action: string
  description?: string | null
  metadata?: Record<string, unknown> | null
}

import { z } from "zod"

export const BranchSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable().optional(),
  phones: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})
export type Branch = z.infer<typeof BranchSchema>

export const BranchWithStatsSchema = BranchSchema.extend({
  classesCount: z.number().default(0),
  usersCount: z.number().default(0),
})
export type BranchWithStats = z.infer<typeof BranchWithStatsSchema>
export type BranchDto = BranchWithStats

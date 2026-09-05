import { z } from "zod"

export const CheckClassConflictsSchema = z.object({
  termId: z.string().uuid(),
  classroomId: z.string().uuid().optional().nullable(),
  teacherName: z.string().trim().optional().nullable(),
  startTime: z.string().trim().optional().nullable(),
  endTime: z.string().trim().optional().nullable(),
  daysOfWeek: z.array(z.string()).default([]).optional(),
  sessionDates: z.array(z.string()).default([]).optional(),
  excludeClassId: z.string().uuid().optional().nullable(),
  instituteId: z.string().uuid().optional(),
})

export type CheckClassConflictsInput = z.infer<typeof CheckClassConflictsSchema>

export interface ClassConflictItem {
  type: "CLASSROOM" | "TEACHER"
  conflictingClassTitle: string
  conflictingClassId?: string
  message: string
  startTime?: string | null
  endTime?: string | null
  teacherName?: string | null
  classroomName?: string | null
  conflictingDates: string[]
}

export interface ClassConflictResult {
  hasConflict: boolean
  conflictingDates: string[]
  conflicts: ClassConflictItem[]
}

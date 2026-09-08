export const STUDENT_SCHEDULE_STATUSES = ["INCOMPLETE", "COMPLETE"] as const

export const STUDENT_TIME_CONSTRAINT_KINDS = [
  "UNAVAILABLE",
  "PREFERRED",
] as const

export const STUDENT_TIME_CONSTRAINT_SOURCES = [
  "SCHOOL",
  "UNIVERSITY",
  "WORK",
  "PERSONAL",
  "OTHER",
] as const

export type StudentScheduleStatus = (typeof STUDENT_SCHEDULE_STATUSES)[number]
export type StudentTimeConstraintKind =
  (typeof STUDENT_TIME_CONSTRAINT_KINDS)[number]
export type StudentTimeConstraintSource =
  (typeof STUDENT_TIME_CONSTRAINT_SOURCES)[number]

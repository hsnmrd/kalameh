export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  INSTITUTE_ADMIN: "INSTITUTE_ADMIN",
  CLERK: "CLERK",
  STUDENT: "STUDENT",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

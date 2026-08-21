import { ROLES, type Role } from "./roles.constant.js"

export const PERMISSIONS = {
  // Institutes
  MANAGE_INSTITUTES: "institutes:manage",
  VIEW_INSTITUTES: "institutes:view",
  // Courses & Classes
  MANAGE_COURSES: "courses:manage",
  VIEW_COURSES: "courses:view",
  MANAGE_CLASSES: "classes:manage",
  VIEW_CLASSES: "classes:view",
  // Terms
  MANAGE_TERMS: "terms:manage",
  VIEW_TERMS: "terms:view",
  // Users & Students
  MANAGE_USERS: "users:manage",
  VIEW_USERS: "users:view",
  // Financial & Transactions
  MANAGE_TRANSACTIONS: "transactions:manage",
  VIEW_TRANSACTIONS: "transactions:view",
  SUBMIT_RECEIPT: "transactions:submit_receipt",
  // Student Enrollment
  ENROLL_COURSE: "enrollment:create",
  VIEW_OWN_ENROLLMENTS: "enrollment:view_own",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.INSTITUTE_ADMIN]: [
    PERMISSIONS.VIEW_INSTITUTES,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_TERMS,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],
  [ROLES.CLERK]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.SUBMIT_RECEIPT,
    PERMISSIONS.ENROLL_COURSE,
    PERMISSIONS.VIEW_OWN_ENROLLMENTS,
  ],
} as const satisfies Record<Role, readonly Permission[]>

export type RolePermissions = typeof ROLE_PERMISSIONS

export const hasPermission = (role: Role, permission: Permission): boolean => {
  const allowed = (ROLE_PERMISSIONS[role] as readonly Permission[]) || []
  return allowed.includes(permission)
}

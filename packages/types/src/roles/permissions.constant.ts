import { ROLES, type Role } from "./roles.constant.js"

// ─── All Permissions ────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: "dashboard:view",

  // Institutes
  MANAGE_INSTITUTES: "institutes:manage",
  VIEW_INSTITUTES: "institutes:view",
  MANAGE_INSTITUTE_SETTINGS: "institutes:settings",

  // Branches
  MANAGE_BRANCHES: "branches:manage",
  VIEW_BRANCHES: "branches:view",

  // Terms
  MANAGE_TERMS: "terms:manage",
  VIEW_TERMS: "terms:view",

  // Courses
  MANAGE_COURSES: "courses:manage",
  VIEW_COURSES: "courses:view",

  // Classes
  MANAGE_CLASSES: "classes:manage",
  VIEW_CLASSES: "classes:view",

  // Users & Staff
  MANAGE_USERS: "users:manage",
  VIEW_USERS: "users:view",

  // Students
  MANAGE_STUDENTS: "students:manage",
  VIEW_STUDENTS: "students:view",

  // Enrollments
  MANAGE_ENROLLMENTS: "enrollments:manage",
  VIEW_ENROLLMENTS: "enrollments:view",
  ENROLL_SELF: "enrollments:enroll_self",
  VIEW_OWN_ENROLLMENTS: "enrollments:view_own",

  // Grades
  MANAGE_GRADES: "grades:manage",
  VIEW_GRADES: "grades:view",
  VIEW_OWN_GRADES: "grades:view_own",

  // Financial & Transactions
  MANAGE_TRANSACTIONS: "transactions:manage",
  VIEW_TRANSACTIONS: "transactions:view",
  SUBMIT_RECEIPT: "transactions:submit_receipt",

  // Role & Permission Management
  MANAGE_ROLE_PERMISSIONS: "role_permissions:manage",
  VIEW_ROLE_PERMISSIONS: "role_permissions:view",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ─── Permissions Grouped by Module (for UI) ─────────────────────────────────

export interface PermissionModuleItem {
  key: string
  permission: Permission
}

export interface PermissionModule {
  id: string
  permissions: PermissionModuleItem[]
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    permissions: [
      { key: "VIEW_DASHBOARD", permission: PERMISSIONS.VIEW_DASHBOARD },
    ],
  },
  {
    id: "institutes",
    permissions: [
      { key: "MANAGE_INSTITUTES", permission: PERMISSIONS.MANAGE_INSTITUTES },
      { key: "VIEW_INSTITUTES", permission: PERMISSIONS.VIEW_INSTITUTES },
      {
        key: "MANAGE_INSTITUTE_SETTINGS",
        permission: PERMISSIONS.MANAGE_INSTITUTE_SETTINGS,
      },
    ],
  },
  {
    id: "branches",
    permissions: [
      { key: "MANAGE_BRANCHES", permission: PERMISSIONS.MANAGE_BRANCHES },
      { key: "VIEW_BRANCHES", permission: PERMISSIONS.VIEW_BRANCHES },
    ],
  },
  {
    id: "terms",
    permissions: [
      { key: "MANAGE_TERMS", permission: PERMISSIONS.MANAGE_TERMS },
      { key: "VIEW_TERMS", permission: PERMISSIONS.VIEW_TERMS },
    ],
  },
  {
    id: "courses",
    permissions: [
      { key: "MANAGE_COURSES", permission: PERMISSIONS.MANAGE_COURSES },
      { key: "VIEW_COURSES", permission: PERMISSIONS.VIEW_COURSES },
    ],
  },
  {
    id: "classes",
    permissions: [
      { key: "MANAGE_CLASSES", permission: PERMISSIONS.MANAGE_CLASSES },
      { key: "VIEW_CLASSES", permission: PERMISSIONS.VIEW_CLASSES },
    ],
  },
  {
    id: "users",
    permissions: [
      { key: "MANAGE_USERS", permission: PERMISSIONS.MANAGE_USERS },
      { key: "VIEW_USERS", permission: PERMISSIONS.VIEW_USERS },
    ],
  },
  {
    id: "students",
    permissions: [
      { key: "MANAGE_STUDENTS", permission: PERMISSIONS.MANAGE_STUDENTS },
      { key: "VIEW_STUDENTS", permission: PERMISSIONS.VIEW_STUDENTS },
    ],
  },
  {
    id: "enrollments",
    permissions: [
      {
        key: "MANAGE_ENROLLMENTS",
        permission: PERMISSIONS.MANAGE_ENROLLMENTS,
      },
      { key: "VIEW_ENROLLMENTS", permission: PERMISSIONS.VIEW_ENROLLMENTS },
      { key: "ENROLL_SELF", permission: PERMISSIONS.ENROLL_SELF },
      {
        key: "VIEW_OWN_ENROLLMENTS",
        permission: PERMISSIONS.VIEW_OWN_ENROLLMENTS,
      },
    ],
  },
  {
    id: "grades",
    permissions: [
      { key: "MANAGE_GRADES", permission: PERMISSIONS.MANAGE_GRADES },
      { key: "VIEW_GRADES", permission: PERMISSIONS.VIEW_GRADES },
      { key: "VIEW_OWN_GRADES", permission: PERMISSIONS.VIEW_OWN_GRADES },
    ],
  },
  {
    id: "transactions",
    permissions: [
      {
        key: "MANAGE_TRANSACTIONS",
        permission: PERMISSIONS.MANAGE_TRANSACTIONS,
      },
      { key: "VIEW_TRANSACTIONS", permission: PERMISSIONS.VIEW_TRANSACTIONS },
      { key: "SUBMIT_RECEIPT", permission: PERMISSIONS.SUBMIT_RECEIPT },
    ],
  },
  {
    id: "role_permissions",
    permissions: [
      {
        key: "MANAGE_ROLE_PERMISSIONS",
        permission: PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
      },
      {
        key: "VIEW_ROLE_PERMISSIONS",
        permission: PERMISSIONS.VIEW_ROLE_PERMISSIONS,
      },
    ],
  },
]

// ─── Roles Whose Permissions Can Be Customized Per-Institute ─────────────────

export const CONFIGURABLE_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.ASSISTANT,
  ROLES.SUPERVISOR,
  ROLES.SUPER_CLERK,
  ROLES.CLERK,
  ROLES.TEACHER,
  ROLES.SUPER_STUDENT,
  ROLES.STUDENT,
]

// ─── Default Role-Permission Mapping (Static Fallback) ──────────────────────

export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_INSTITUTES,
    PERMISSIONS.MANAGE_INSTITUTE_SETTINGS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.MANAGE_TERMS,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.VIEW_ROLE_PERMISSIONS,
  ],

  [ROLES.ASSISTANT]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_INSTITUTES,
    PERMISSIONS.MANAGE_INSTITUTE_SETTINGS,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.MANAGE_TERMS,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [ROLES.SUPERVISOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_INSTITUTES,
    PERMISSIONS.MANAGE_BRANCHES,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.MANAGE_TERMS,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [ROLES.SUPER_CLERK]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [ROLES.CLERK]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.MANAGE_TRANSACTIONS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [ROLES.TEACHER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_BRANCHES,
    PERMISSIONS.VIEW_TERMS,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.VIEW_GRADES,
  ],

  [ROLES.SUPER_STUDENT]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.ENROLL_SELF,
    PERMISSIONS.VIEW_OWN_ENROLLMENTS,
    PERMISSIONS.VIEW_OWN_GRADES,
    PERMISSIONS.SUBMIT_RECEIPT,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.ENROLL_SELF,
    PERMISSIONS.VIEW_OWN_ENROLLMENTS,
    PERMISSIONS.VIEW_OWN_GRADES,
    PERMISSIONS.SUBMIT_RECEIPT,
  ],
} as const satisfies Record<Role, readonly Permission[]>

export type RolePermissions = typeof DEFAULT_ROLE_PERMISSIONS

// ─── Permission Checker ─────────────────────────────────────────────────────

/**
 * Check if a permission is present.
 * Accepts either a role (uses DEFAULT_ROLE_PERMISSIONS) or an explicit permissions array.
 */
export function hasPermission(
  roleOrPermissions: Role | readonly string[],
  permission: Permission
): boolean {
  if (Array.isArray(roleOrPermissions)) {
    return (roleOrPermissions as readonly string[]).includes(permission)
  }

  const role = roleOrPermissions as Role
  if (role === ROLES.SUPER_ADMIN) return true

  const allowed =
    (DEFAULT_ROLE_PERMISSIONS[role] as readonly Permission[]) || []
  return allowed.includes(permission)
}

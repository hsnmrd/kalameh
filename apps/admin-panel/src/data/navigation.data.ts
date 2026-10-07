import {
  LayoutDashboard,
  Layers,
  Building2,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  CreditCard,
  Landmark,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Clock,
  CalendarDays,
} from "lucide-react"
import { PERMISSIONS, APP_MODULES } from "@workspace/types"
import type { NavItem } from "@/components/admin-base-layout/nav-list"

export const DASHBOARD_NAV_ITEM: NavItem = {
  key: "dashboard",
  href: "/",
  icon: LayoutDashboard,
  permission: PERMISSIONS.VIEW_DASHBOARD,
}

export const PLATFORM_DASHBOARD_NAV_ITEM: NavItem = {
  key: "platformDashboard",
  href: "/",
  icon: LayoutDashboard,
  permission: PERMISSIONS.VIEW_DASHBOARD,
}

export const INSTITUTE_DASHBOARD_NAV_ITEM: NavItem = {
  key: "instituteDashboard",
  href: "/overview",
  icon: LayoutDashboard,
  permission: PERMISSIONS.VIEW_DASHBOARD,
}

export const SUPER_ADMIN_PLATFORM_NAV: NavItem[] = [
  PLATFORM_DASHBOARD_NAV_ITEM,
  {
    key: "institutes",
    href: "/institutes",
    icon: Landmark,
    permission: PERMISSIONS.VIEW_INSTITUTES,
  },
]

/**
 * 1. Academic Lifecycle (چرخه آموزشی):
 * Direct system workflow:
 * - Step 1: Operating phases & Annual calendar (Off-Days)
 * - Step 2: Terms creation
 * - Steps 4 & 5: Smart class calendar & Publishing classes
 */
export const ACADEMIC_CYCLE_NAV_ITEMS: NavItem[] = [
  {
    key: "operatingPhases",
    href: "/operating-phases",
    icon: Clock,
    permission: PERMISSIONS.VIEW_OPERATING_PHASES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "calendar",
    href: "/calendar",
    icon: CalendarDays,
    permission: PERMISSIONS.MANAGE_INSTITUTE_SETTINGS,
  },
  {
    key: "terms",
    href: "/terms",
    icon: Calendar,
    permission: PERMISSIONS.VIEW_TERMS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "classes",
    href: "/classes",
    icon: Layers,
    permission: PERMISSIONS.VIEW_CLASSES,
    module: APP_MODULES.CLASSES_COURSES,
  },
]

/**
 * 2. People (افراد):
 * - Step 3: Student placement & evaluation
 * - Teachers
 */
export const PEOPLE_NAV_ITEMS: NavItem[] = [
  {
    key: "students",
    href: "/students",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_STUDENTS,
    module: APP_MODULES.STUDENTS,
  },
  {
    key: "teachers",
    href: "/teachers",
    icon: UserCheck,
    permission: PERMISSIONS.VIEW_TEACHERS,
    module: APP_MODULES.CLASSES_COURSES,
  },
]

/**
 * 3. Base Catalog & Facilities (تعاریف پایه و امکانات):
 * Structural building blocks for courses, rooms, and campuses
 */
export const FACILITIES_NAV_ITEMS: NavItem[] = [
  {
    key: "courses",
    href: "/courses",
    icon: BookOpen,
    permission: PERMISSIONS.VIEW_COURSES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "classrooms",
    href: "/classrooms",
    icon: DoorOpen,
    permission: PERMISSIONS.VIEW_CLASSROOMS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "branches",
    href: "/branches",
    icon: Building2,
    permission: PERMISSIONS.VIEW_BRANCHES,
    module: APP_MODULES.CLASSES_COURSES,
  },
]

/**
 * Preserved for backwards compatibility with legacy academic references
 */
export const ACADEMIC_NAV_ITEMS: NavItem[] = [
  ...ACADEMIC_CYCLE_NAV_ITEMS,
  ...FACILITIES_NAV_ITEMS,
]

/**
 * 4. Finance (امور مالی)
 */
export const FINANCE_NAV_ITEMS: NavItem[] = [
  {
    key: "finance",
    href: "/transactions",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_TRANSACTIONS,
    module: APP_MODULES.FINANCE,
  },
]

/**
 * 5. Administration (مدیریت و دسترسی)
 */
export const ADMINISTRATION_NAV_ITEMS: NavItem[] = [
  {
    key: "staff",
    href: "/users",
    icon: Users,
    permission: PERMISSIONS.VIEW_USERS,
    module: APP_MODULES.USERS_STAFF,
  },
  {
    key: "rolePermissions",
    href: "/role-permissions",
    icon: ShieldCheck,
    permission: PERMISSIONS.VIEW_ROLE_PERMISSIONS,
    module: APP_MODULES.USERS_STAFF,
  },
]

export const INSTITUTE_NAV_ITEMS: NavItem[] = [
  ...ACADEMIC_CYCLE_NAV_ITEMS,
  ...PEOPLE_NAV_ITEMS,
  ...FACILITIES_NAV_ITEMS,
  ...FINANCE_NAV_ITEMS,
  ...ADMINISTRATION_NAV_ITEMS,
]

export const ADMIN_NAV: NavItem[] = [DASHBOARD_NAV_ITEM, ...INSTITUTE_NAV_ITEMS]

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
  CalendarClock,
  Clock,
  CalendarOff,
} from "lucide-react"
import { PERMISSIONS, APP_MODULES } from "@workspace/types"
import type { NavItem } from "@/components/admin-base-layout/nav-list"

export const DASHBOARD_NAV_ITEM: NavItem = {
  key: "dashboard",
  href: "/",
  icon: LayoutDashboard,
  permission: PERMISSIONS.VIEW_DASHBOARD,
}

export const SUPER_ADMIN_PLATFORM_NAV: NavItem[] = [
  DASHBOARD_NAV_ITEM,
  {
    key: "institutes",
    href: "/institutes",
    icon: Landmark,
    permission: PERMISSIONS.VIEW_INSTITUTES,
  },
]

export const ACADEMIC_NAV_ITEMS: NavItem[] = [
  {
    key: "branches",
    href: "/branches",
    icon: Building2,
    permission: PERMISSIONS.VIEW_BRANCHES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "terms",
    href: "/terms",
    icon: Calendar,
    permission: PERMISSIONS.VIEW_TERMS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "courses",
    href: "/courses",
    icon: BookOpen,
    permission: PERMISSIONS.VIEW_COURSES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "classes",
    href: "/classes",
    icon: Layers,
    permission: PERMISSIONS.VIEW_CLASSES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "scheduling",
    href: "/scheduling",
    icon: CalendarClock,
    permission: PERMISSIONS.VIEW_CLASSES,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "operatingPhases",
    href: "/operating-phases",
    icon: Clock,
    permission: PERMISSIONS.VIEW_OPERATING_PHASES,
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
    key: "offDays",
    href: "/off-days",
    icon: CalendarOff,
    permission: PERMISSIONS.MANAGE_INSTITUTE_SETTINGS,
  },
]

export const PEOPLE_NAV_ITEMS: NavItem[] = [
  {
    key: "teachers",
    href: "/teachers",
    icon: UserCheck,
    permission: PERMISSIONS.VIEW_TEACHERS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "students",
    href: "/students",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_STUDENTS,
    module: APP_MODULES.STUDENTS,
  },
]

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

export const FINANCE_NAV_ITEMS: NavItem[] = [
  {
    key: "finance",
    href: "/transactions",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_TRANSACTIONS,
    module: APP_MODULES.FINANCE,
  },
]

export const INSTITUTE_NAV_ITEMS: NavItem[] = [
  ...ACADEMIC_NAV_ITEMS,
  ...PEOPLE_NAV_ITEMS,
  ...FINANCE_NAV_ITEMS,
  ...ADMINISTRATION_NAV_ITEMS,
]

export const ADMIN_NAV: NavItem[] = [DASHBOARD_NAV_ITEM, ...INSTITUTE_NAV_ITEMS]

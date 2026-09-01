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
} from "lucide-react"
import { PERMISSIONS, APP_MODULES } from "@workspace/types"
import type { NavItem } from "@/components/admin-base-layout/nav-list"

export const SUPER_ADMIN_PLATFORM_NAV: NavItem[] = [
  {
    key: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    key: "institutes",
    href: "/institutes",
    icon: Landmark,
    permission: PERMISSIONS.VIEW_INSTITUTES,
  },
]

export const INSTITUTE_NAV_ITEMS: NavItem[] = [
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
    key: "classrooms",
    href: "/classrooms",
    icon: DoorOpen,
    permission: PERMISSIONS.VIEW_CLASSROOMS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "students",
    href: "/students",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_STUDENTS,
    module: APP_MODULES.STUDENTS,
  },
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
  {
    key: "finance",
    href: "/transactions",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_TRANSACTIONS,
    module: APP_MODULES.FINANCE,
  },
]

export const ADMIN_NAV: NavItem[] = [
  {
    key: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  ...INSTITUTE_NAV_ITEMS,
]

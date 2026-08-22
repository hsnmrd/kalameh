"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Calendar,
  Users,
  CreditCard,
  ShieldAlert,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ROLES, type Role } from "@workspace/types"
import { authResource } from "@/lib/api"
import { usePathname, useRouter, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import { useActiveInstitute } from "@/lib/stores"
import { SidebarBrand } from "./sidebar-brand"
import { NavList, type NavItem } from "./nav-list"
import { SidebarFooter } from "./sidebar-footer"
import { MobileDrawer } from "./mobile-drawer"
import { AdminHeader } from "./admin-header"

export interface AdminBaseLayoutProps {
  children: React.ReactNode
  role?: Role
}

const INSTITUTE_NAV: NavItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "terms", href: "/terms", icon: Calendar },
  { key: "courses", href: "/courses", icon: BookOpen },
  { key: "classes", href: "/classes", icon: Layers },
  { key: "students", href: "/users", icon: Users },
  { key: "finance", href: "/transactions", icon: CreditCard },
]

const SUPER_ADMIN_GLOBAL_NAV: NavItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "institutes", href: "/institutes", icon: ShieldAlert },
]

const SUPER_ADMIN_INSTITUTE_NAV: NavItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "terms", href: "/terms", icon: Calendar },
  { key: "courses", href: "/courses", icon: BookOpen },
  { key: "classes", href: "/classes", icon: Layers },
  { key: "students", href: "/users", icon: Users },
  { key: "finance", href: "/transactions", icon: CreditCard },
  { key: "institutes", href: "/institutes", icon: ShieldAlert },
]

export function AdminBaseLayout({ children, role }: AdminBaseLayoutProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isRtl = useIsRtl()

  const { activeInstitute } = useActiveInstitute()

  const { data: user } = useQuery(authResource.me.toQuery())
  const effectiveRole = role ?? user?.role ?? ROLES.INSTITUTE_ADMIN

  const navItems = React.useMemo(() => {
    if (effectiveRole === ROLES.SUPER_ADMIN) {
      return activeInstitute
        ? SUPER_ADMIN_INSTITUTE_NAV
        : SUPER_ADMIN_GLOBAL_NAV
    }
    return INSTITUTE_NAV
  }, [effectiveRole, activeInstitute])

  const logoutMutation = useMutation({
    ...authResource.logout.toMutation(),
    onSettled: () => {
      queryClient.clear()
      router.push("/login")
    },
  })

  // Block student from accessing admin layout
  React.useEffect(() => {
    if (user && user.role === ROLES.STUDENT) {
      logoutMutation.mutate()
    }
  }, [user, logoutMutation])

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const handleLogout = () => logoutMutation.mutate()

  if (user?.role === ROLES.STUDENT) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Desktop Static Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-white p-6 lg:flex xl:w-72",
          isRtl ? "border-l border-slate-200" : "border-r border-slate-200"
        )}
      >
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <SidebarBrand role={effectiveRole} />
          </div>
          <NavList items={navItems} pathname={pathname} />
        </div>
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isRtl={isRtl}
        role={effectiveRole}
        navItems={navItems}
        pathname={pathname}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          role={effectiveRole}
          user={user}
          onToggleDrawer={() => setDrawerOpen(true)}
          onSwitchLanguage={handleSwitchLanguage}
          locale={locale}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

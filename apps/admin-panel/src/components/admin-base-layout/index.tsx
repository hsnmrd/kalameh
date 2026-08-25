"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ROLES, type Role } from "@workspace/types"
import { authResource } from "@/lib/api"
import { usePathname, useRouter, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import { useActiveInstitute } from "@/lib/stores"
import { SidebarBrand } from "./sidebar-brand"
import { NavList, type NavSection } from "./nav-list"
import { SidebarFooter } from "./sidebar-footer"
import { MobileDrawer } from "./mobile-drawer"
import { AdminHeader } from "./admin-header"
import {
  SUPER_ADMIN_PLATFORM_NAV,
  INSTITUTE_NAV_ITEMS,
  ADMIN_NAV,
} from "@/data"

export interface AdminBaseLayoutProps {
  children: React.ReactNode
  role?: Role
}

export function AdminBaseLayout({ children, role }: AdminBaseLayoutProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const t = useTranslations("common.nav")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isRtl = useIsRtl()

  const { activeInstitute } = useActiveInstitute()

  const { data: user } = useQuery(authResource.me.toQuery())
  const effectiveRole = role ?? user?.role ?? ROLES.ADMIN

  const navSections = React.useMemo<NavSection[]>(() => {
    if (effectiveRole === ROLES.SUPER_ADMIN) {
      if (activeInstitute) {
        return [
          {
            id: "super-admin-platform",
            title: t("superAdminSection"),
            items: SUPER_ADMIN_PLATFORM_NAV,
          },
          {
            id: `institute-${activeInstitute.id}`,
            title: activeInstitute.name,
            badge: activeInstitute.subdomain,
            items: INSTITUTE_NAV_ITEMS,
          },
        ]
      }

      return [
        {
          id: "super-admin-platform",
          title: t("superAdminSection"),
          items: SUPER_ADMIN_PLATFORM_NAV,
        },
      ]
    }

    return [
      {
        id: "institute-nav",
        items: ADMIN_NAV,
      },
    ]
  }, [effectiveRole, activeInstitute, t])

  const logoutMutation = useMutation({
    ...authResource.logout.toMutation(),
    onSettled: () => {
      queryClient.clear()
      router.push("/login")
    },
  })

  const logoutMutate = logoutMutation.mutate

  // Block student from accessing admin layout
  React.useEffect(() => {
    if (user?.role === ROLES.STUDENT) {
      logoutMutate()
    }
  }, [user?.role, logoutMutate])

  const handleSwitchLanguage = () => {
    const nextLocale = locale === "en" ? "fa" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  const handleLogout = () => logoutMutation.mutate()

  if (user?.role === ROLES.STUDENT) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      {/* Desktop Static Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-sidebar p-6 text-sidebar-foreground lg:flex xl:w-72",
          isRtl
            ? "border-l border-sidebar-border"
            : "border-r border-sidebar-border"
        )}
      >
        <div className="space-y-6">
          <div className="border-b border-sidebar-border/60 pb-4">
            <SidebarBrand role={effectiveRole} />
          </div>
          <NavList sections={navSections} pathname={pathname} />
        </div>
        <SidebarFooter
          onLogout={handleLogout}
          onSwitchLanguage={handleSwitchLanguage}
          locale={locale}
        />
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isRtl={isRtl}
        role={effectiveRole}
        sections={navSections}
        pathname={pathname}
        onLogout={handleLogout}
        onSwitchLanguage={handleSwitchLanguage}
        locale={locale}
      />

      {/* Main Content Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          role={effectiveRole}
          user={user}
          onToggleDrawer={() => setDrawerOpen(true)}
          onSwitchLanguage={handleSwitchLanguage}
          onLogout={handleLogout}
          locale={locale}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

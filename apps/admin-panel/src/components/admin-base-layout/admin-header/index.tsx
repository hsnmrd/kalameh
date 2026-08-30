"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { type Role, type AuthUser } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"
import { usePathname } from "@/i18n/routing"
import { useHeaderActions } from "../header-actions-context"
import { UserBadge } from "./user-badge"

export interface AdminHeaderProps {
  role?: Role
  user?: Partial<AuthUser> & {
    firstName?: string
    lastName?: string
    phone?: string
    role?: Role
    avatarUrl?: string | null
    isActive?: boolean
  }
  onSwitchLanguage?: () => void
  onLogout?: () => void
  locale?: string
}

function getPageTitle(pathname: string, t: (key: string) => string): string {
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return t("nav.dashboard")
  }
  if (pathname.startsWith("/institutes")) {
    return t("nav.institutes")
  }
  if (pathname.includes("/grades")) {
    return t("modules.items.GRADES_ASSESSMENTS.name")
  }
  if (pathname.startsWith("/classes")) {
    return t("nav.classes")
  }
  if (pathname.startsWith("/branches")) {
    return t("nav.branches")
  }
  if (pathname.startsWith("/terms")) {
    return t("nav.terms")
  }
  if (pathname.startsWith("/courses")) {
    return t("nav.courses")
  }
  if (pathname.startsWith("/students")) {
    return t("nav.students")
  }
  if (pathname.startsWith("/users")) {
    return t("nav.staff")
  }
  if (pathname.startsWith("/role-permissions")) {
    return t("nav.rolePermissions")
  }
  if (pathname.startsWith("/transactions")) {
    return t("nav.finance")
  }
  if (pathname.startsWith("/setting")) {
    return t("settings")
  }
  return t("nav.dashboard")
}

export function AdminHeader({ role, user, onLogout }: AdminHeaderProps) {
  const t = useTranslations("common")
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname, t)
  const { headerActions } = useHeaderActions()

  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between px-4 transition-all duration-200 sm:px-6 lg:px-8",
        isScrolled
          ? "border-b border-border bg-card/10 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        {headerActions}
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">
          {pageTitle}
        </h1>
      </div>

      {/* Right / End Section */}
      <div className="flex items-center gap-2.5">
        {/* User Card Info with Avatar Trigger & Popup */}
        <UserBadge user={user} role={role} onLogout={onLogout} />
      </div>
    </header>
  )
}

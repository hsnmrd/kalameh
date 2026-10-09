"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ROLES, type Role, type AuthUser } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Link, useIsRtl, usePathname } from "@/i18n/routing"
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
  className?: string
}

function getPageTitle(
  pathname: string,
  t: (key: string) => string,
  role?: Role
): string {
  if (pathname === "/overview") {
    return t("nav.instituteDashboard")
  }
  if (!pathname || pathname === "/" || pathname === "/dashboard") {
    return role === ROLES.SUPER_ADMIN
      ? t("nav.platformDashboard")
      : t("nav.dashboard")
  }
  if (pathname.startsWith("/institutes")) {
    return t("nav.institutes")
  }
  if (pathname.includes("/grades")) {
    return t("modules.items.GRADES_ASSESSMENTS.name")
  }
  if (pathname.includes("/scheduling")) {
    return t("nav.scheduling")
  }
  if (pathname.startsWith("/classes")) {
    return t("nav.classes")
  }
  if (pathname.startsWith("/branches")) {
    return t("nav.branches")
  }
  if (pathname.startsWith("/terms/generate")) {
    return t("nav.reviewPhaseTerms")
  }
  if (pathname.startsWith("/terms")) {
    return t("nav.terms")
  }
  if (pathname.startsWith("/courses")) {
    return t("nav.courses")
  }
  if (pathname.includes("/requirements")) {
    return t("nav.classRequirements")
  }
  if (pathname.startsWith("/operating-phases")) {
    return t("nav.operatingPhases")
  }
  if (pathname.startsWith("/classrooms")) {
    return t("nav.classrooms")
  }
  if (pathname.startsWith("/teachers/calendar")) {
    return t("nav.teachersCalendar")
  }
  if (pathname.startsWith("/teachers")) {
    return t("nav.teachers")
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
  if (
    pathname.startsWith("/calendar/custom") ||
    pathname.startsWith("/off-days/custom")
  ) {
    return t("nav.customOffDays")
  }
  if (pathname.startsWith("/calendar") || pathname.startsWith("/off-days")) {
    return t("nav.calendar")
  }
  if (pathname.startsWith("/setting")) {
    return t("settings")
  }
  return t("nav.dashboard")
}

export function AdminHeader({
  role,
  user,
  onLogout,
  className,
}: AdminHeaderProps) {
  const t = useTranslations("common")
  const pathname = usePathname()
  const effectiveRole = role ?? user?.role
  const pageTitle = getPageTitle(pathname, t, effectiveRole)
  const { headerActions, backNavigation } = useHeaderActions()
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

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
        "sticky top-0 z-30 w-full transition-all duration-200",
        isScrolled
          ? "border-b border-border bg-card/10 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {backNavigation && (
            <Button
              render={<Link href={backNavigation.backHref} />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              data-testid="admin-header-back-btn"
              className="size-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={backNavigation.backLabel ?? t("back")}
              title={backNavigation.backLabel ?? t("back")}
            >
              <BackIcon className="size-4" />
            </Button>
          )}
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
      </div>
    </header>
  )
}

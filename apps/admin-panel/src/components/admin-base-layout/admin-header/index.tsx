"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Languages } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { ROLES, type Role, type AuthUser } from "@workspace/types"
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
  onSwitchLanguage: () => void
  onLogout?: () => void
  locale: string
}

export function AdminHeader({
  role,
  user,
  onSwitchLanguage,
  onLogout,
  locale,
}: AdminHeaderProps) {
  const t = useTranslations("common")
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-foreground lg:hidden">
          {t("appName")}
        </span>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <span className="text-sm font-semibold text-foreground">
            {isSuperAdmin
              ? `${t("appName")} • ${t("superAdmin")}`
              : `${t("appName")} • ${t("adminPanel")}`}
          </span>
        </div>
      </div>

      {/* Right / End Section */}
      <div className="flex items-center gap-2.5">
        {/* Theme and Language Switcher (Desktop only; moved to drawer on mobile) */}
        <div className="hidden lg:flex lg:items-center lg:gap-2.5">
          <ThemeToggle />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchLanguage}
            className="h-8 cursor-pointer gap-1.5 border-border bg-background text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
          >
            <Languages className="size-3.5" />
            <span>{locale === "en" ? "FA" : "EN"}</span>
          </Button>
        </div>

        {/* User Card Info with Avatar Trigger & Popup */}
        <UserBadge user={user} role={role} onLogout={onLogout} />
      </div>
    </header>
  )
}

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, ShieldAlert, Menu, Languages } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { ROLES, type Role } from "@workspace/types"
import { UserBadge } from "./user-badge"
import { InstituteSwitcher } from "../institute-switcher"

export interface AdminHeaderProps {
  role?: Role
  user?: {
    firstName?: string
    lastName?: string
    phone?: string
    role?: Role
  }
  onToggleDrawer: () => void
  onSwitchLanguage: () => void
  locale: string
}

export function AdminHeader({
  role,
  user,
  onToggleDrawer,
  onSwitchLanguage,
  locale,
}: AdminHeaderProps) {
  const t = useTranslations("common")
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDrawer}
          className="cursor-pointer text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            {isSuperAdmin ? (
              <ShieldAlert className="size-4" />
            ) : (
              <Building2 className="size-4" />
            )}
          </div>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {isSuperAdmin ? t("superAdmin") : t("instituteAdmin")}
          </span>
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <span className="text-sm font-semibold text-foreground">
            {isSuperAdmin
              ? `${t("appName")} • ${t("superAdmin")}`
              : `${t("appName")} • ${t("adminPanel")}`}
          </span>
          {isSuperAdmin && <InstituteSwitcher />}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {isSuperAdmin && (
          <div className="lg:hidden">
            <InstituteSwitcher />
          </div>
        )}

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

        <UserBadge user={user} />
      </div>
    </header>
  )
}

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, ShieldAlert } from "lucide-react"
import { ROLES, type Role } from "@workspace/types"
import { useActiveInstitute } from "@/lib/stores"

export interface SidebarBrandProps {
  role?: Role
}

export function SidebarBrand({ role }: SidebarBrandProps) {
  const t = useTranslations("common")
  const { activeInstitute } = useActiveInstitute()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN

  const Icon = isSuperAdmin && !activeInstitute ? ShieldAlert : Building2
  const title =
    isSuperAdmin && activeInstitute
      ? activeInstitute.name
      : isSuperAdmin
        ? t("superAdmin")
        : t("instituteAdmin")
  const subtitle =
    isSuperAdmin && activeInstitute
      ? t("superAdminMode")
      : isSuperAdmin
        ? "Super Admin Panel"
        : t("adminPanel")

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

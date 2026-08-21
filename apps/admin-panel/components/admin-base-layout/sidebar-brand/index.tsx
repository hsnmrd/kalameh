"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, ShieldAlert } from "lucide-react"
import { ROLES, type Role } from "@workspace/types"

export interface SidebarBrandProps {
  role?: Role
}

export function SidebarBrand({ role }: SidebarBrandProps) {
  const t = useTranslations("common")
  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const Icon = isSuperAdmin ? ShieldAlert : Building2
  const title = isSuperAdmin ? t("superAdmin") : t("instituteAdmin")
  const subtitle = isSuperAdmin ? "Super Admin Panel" : t("adminPanel")

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

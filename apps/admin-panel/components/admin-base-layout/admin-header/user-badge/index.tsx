"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ROLES, type Role } from "@workspace/types"

export interface UserBadgeProps {
  user?: {
    firstName?: string
    lastName?: string
    phone?: string
    role?: Role
  }
}

export function UserBadge({ user }: UserBadgeProps) {
  const t = useTranslations("common")

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.phone ||
        (user?.role === ROLES.SUPER_ADMIN
          ? t("superAdmin")
          : t("instituteAdmin"))

  const initial = (user?.firstName?.[0] || user?.role?.[0] || "A").toUpperCase()

  const roleLabel =
    user?.role === ROLES.SUPER_ADMIN ? t("superAdmin") : t("instituteAdmin")

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-slate-900 shadow-2xs">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
        {initial}
      </div>
      <div className="hidden text-start sm:block">
        <p className="max-w-[140px] truncate text-xs leading-tight font-semibold text-slate-900">
          {fullName}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
          {roleLabel}
        </p>
      </div>
    </div>
  )
}

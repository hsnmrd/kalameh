"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Edit2, KeyRound } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { AuthUser } from "@workspace/types"
import { UserRoleBadge } from "../user-role-badge"
import { UserStatusBadge } from "../user-status-badge"

export interface UserCardProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
}

export function UserCard({ user, onEdit, onResetPassword }: UserCardProps) {
  const t = useTranslations("users")
  const locale = useLocale()

  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(user.createdAt)
      return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    } catch {
      return String(user.createdAt)
    }
  }, [user.createdAt, locale])

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </h3>
            <span className="font-mono text-xs text-slate-500">
              {user.phone}
            </span>
          </div>
        </div>

        <UserStatusBadge isActive={user.isActive} />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <UserRoleBadge role={user.role} />
        <span>{formattedDate}</span>
      </div>

      {user.nationalCode && (
        <div className="text-xs text-slate-500">
          <span>{t("table.nationalCode")}: </span>
          <span className="font-mono">{user.nationalCode}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(user)}
          className="gap-1.5 rounded-lg text-xs"
        >
          <Edit2 className="size-3" />
          <span>{t("actions.edit")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onResetPassword(user)}
          className="gap-1.5 rounded-lg text-xs"
        >
          <KeyRound className="size-3" />
          <span>{t("actions.resetPassword")}</span>
        </Button>
      </div>
    </div>
  )
}

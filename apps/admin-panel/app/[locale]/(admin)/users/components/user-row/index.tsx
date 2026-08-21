"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Edit2, KeyRound } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { AuthUser } from "@workspace/types"
import { UserRoleBadge } from "../user-role-badge"
import { UserStatusBadge } from "../user-status-badge"

export interface UserRowProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
}

export function UserRow({ user, onEdit, onResetPassword }: UserRowProps) {
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
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/75">
      {/* Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3.5 font-mono text-sm text-slate-600">
        {user.phone}
      </td>

      {/* National Code */}
      <td className="px-4 py-3.5 font-mono text-sm text-slate-500">
        {user.nationalCode || "—"}
      </td>

      {/* Role */}
      <td className="px-4 py-3.5">
        <UserRoleBadge role={user.role} />
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <UserStatusBadge isActive={user.isActive} />
      </td>

      {/* Created At */}
      <td className="px-4 py-3.5 text-xs text-slate-500">{formattedDate}</td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-end">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(user)}
            title={t("actions.edit")}
            className="cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Edit2 className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onResetPassword(user)}
            title={t("actions.resetPassword")}
            className="cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <KeyRound className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

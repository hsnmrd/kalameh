"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Edit2, KeyRound, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { UserRoleBadge } from "../user-role-badge"
import { UserStatusBadge } from "../user-status-badge"

export interface UserRowProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

export function UserRow({
  user,
  onEdit,
  onResetPassword,
  onDelete,
}: UserRowProps) {
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
    <tr className="border-b border-border/60 transition-colors hover:bg-muted/50">
      {/* Name */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3.5 font-mono text-sm text-foreground/80">
        {user.phone}
      </td>

      {/* National Code */}
      <td className="px-4 py-3.5 font-mono text-sm text-muted-foreground">
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
      <td className="px-4 py-3.5 text-xs text-muted-foreground">
        {formattedDate}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-end">
        <div className="flex items-center justify-end gap-1.5">
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="disable">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(user)}
              title={t("actions.edit")}
              className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Edit2 className="size-3.5" />
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="disable">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onResetPassword(user)}
              title={t("actions.resetPassword")}
              className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <KeyRound className="size-3.5" />
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.DELETE_USERS} mode="disable">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(user)}
              title={t("actions.delete")}
              className="cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </PermissionGuard>
        </div>
      </td>
    </tr>
  )
}

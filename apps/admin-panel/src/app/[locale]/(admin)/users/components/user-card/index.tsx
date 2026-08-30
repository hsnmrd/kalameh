"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Edit2, KeyRound, Trash2, Eye } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { UserRoleBadge } from "../user-role-badge"
import { UserStatusBadge } from "../user-status-badge"

export interface UserCardProps {
  user: AuthUser
  onViewProfile?: (user: AuthUser) => void
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

export function UserCard({
  user,
  onViewProfile,
  onEdit,
  onResetPassword,
  onDelete,
}: UserCardProps) {
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
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </h3>
            <span className="font-mono text-xs text-muted-foreground">
              {user.phone}
            </span>
          </div>
        </div>

        <UserStatusBadge isActive={user.isActive} />
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        <UserRoleBadge role={user.role} />
        <span>{formattedDate}</span>
      </div>

      {user.nationalCode && (
        <div className="text-xs text-muted-foreground">
          <span>{t("table.nationalCode")}: </span>
          <span className="font-mono">{user.nationalCode}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2.5">
        {onViewProfile && (
          <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="disable">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewProfile(user)}
              className="gap-1.5 rounded-lg text-xs"
            >
              <Eye className="size-3" />
              <span>{t("actions.viewProfile")}</span>
            </Button>
          </PermissionGuard>
        )}

        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="disable">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            className="gap-1.5 rounded-lg text-xs"
          >
            <Edit2 className="size-3" />
            <span>{t("actions.edit")}</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="disable">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(user)}
            className="gap-1.5 rounded-lg text-xs"
          >
            <KeyRound className="size-3" />
            <span>{t("actions.resetPassword")}</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.DELETE_USERS} mode="disable">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(user)}
            className="gap-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3" />
            <span>{t("actions.delete")}</span>
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}

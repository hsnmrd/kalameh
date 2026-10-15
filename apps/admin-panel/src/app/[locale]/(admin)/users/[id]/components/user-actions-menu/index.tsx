"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Edit2, KeyRound, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface UserActionsMenuProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

export function UserActionsMenu({
  user,
  onEdit,
  onResetPassword,
  onDelete,
}: UserActionsMenuProps) {
  const t = useTranslations("users")

  return (
    <div className="flex items-center gap-2">
      {/* Desktop direct action buttons */}
      <div className="hidden lg:flex lg:items-center lg:gap-2">
        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
            <span>{t("actions.edit")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(user)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>{t("actions.resetPassword")}</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(user)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Trash2 className="size-3.5" />
            <span>{t("actions.delete")}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Mobile action dropdown trigger button on top of square image */}
      <div className="lg:hidden">
        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md hover:bg-black/65"
                  aria-label={t("table.actions")}
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <KeyRound className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.resetPassword")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="me-2 size-4 text-destructive" />
                <span>{t("actions.delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      </div>
    </div>
  )
}

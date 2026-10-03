"use client"

import { useTranslations } from "next-intl"
import { Edit2, KeyRound, MoreVertical, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

interface ProfileActionsProps {
  user: AuthUser
  fullName: string
  onClose: () => void
  onEdit?: (user: AuthUser) => void
  onResetPassword?: (user: AuthUser) => void
  onDelete?: (user: AuthUser) => void
}

export function ProfileActions({
  user,
  fullName,
  onClose,
  onEdit,
  onResetPassword,
  onDelete,
}: ProfileActionsProps) {
  const t = useTranslations("users")

  if (!onResetPassword && !onEdit && !onDelete) return null

  const runAction = (action: (user: AuthUser) => void) => {
    onClose()
    action(user)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
        aria-label={t("actions.viewProfile")}
      >
        <MoreVertical className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        drawerTitle={fullName}
        className="min-w-48"
      >
        {onResetPassword && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
            <DropdownMenuItem onClick={() => runAction(onResetPassword)}>
              <KeyRound className="size-4 text-muted-foreground" />
              <span>{t("actions.resetPassword")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
        {onEdit && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
            <DropdownMenuItem onClick={() => runAction(onEdit)}>
              <Edit2 className="size-4 text-muted-foreground" />
              <span>{t("actions.edit")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
        {onDelete && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => runAction(onDelete)}
            >
              <Trash2 className="size-4 text-destructive" />
              <span>{t("actions.delete")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

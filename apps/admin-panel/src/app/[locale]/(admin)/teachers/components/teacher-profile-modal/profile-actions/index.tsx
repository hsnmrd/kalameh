"use client"

import { useTranslations } from "next-intl"
import { Edit2, KeyRound, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type TeacherDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

interface ProfileActionsProps {
  teacher: TeacherDto
  fullName: string
  onClose: () => void
  onEdit?: (teacher: TeacherDto) => void
  onResetPassword?: (teacher: TeacherDto) => void
}

export function ProfileActions(props: ProfileActionsProps) {
  const { teacher, fullName, onClose, onEdit, onResetPassword } = props
  const t = useTranslations("teachers")
  if (!onEdit && !onResetPassword) return null

  const runAction = (action: (teacher: TeacherDto) => void) => {
    onClose()
    action(teacher)
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
          <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
            <DropdownMenuItem onClick={() => runAction(onResetPassword)}>
              <KeyRound className="size-4 text-muted-foreground" />
              <span>{t("actions.resetPassword")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
        {onEdit && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
            <DropdownMenuItem onClick={() => runAction(onEdit)}>
              <Edit2 className="size-4 text-muted-foreground" />
              <span>{t("actions.edit")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

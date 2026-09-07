"use client"

import { useTranslations } from "next-intl"
import { Edit2, FileText, KeyRound, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

interface ProfileActionsProps {
  student: StudentDto
  fullName: string
  onClose: () => void
  onEdit?: (student: StudentDto) => void
  onAddNote?: (student: StudentDto) => void
  onResetPassword?: (student: StudentDto) => void
}

export function ProfileActions(props: ProfileActionsProps) {
  const { student, fullName, onClose, onEdit, onAddNote, onResetPassword } =
    props
  const t = useTranslations("students")

  if (!onAddNote && !onResetPassword && !onEdit) return null

  const runAction = (action: (student: StudentDto) => void) => {
    onClose()
    action(student)
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
        {onAddNote && (
          <PermissionGuard
            permission={PERMISSIONS.MANAGE_STUDENT_NOTES}
            mode="hide"
          >
            <DropdownMenuItem onClick={() => runAction(onAddNote)}>
              <FileText className="size-4 text-muted-foreground" />
              <span>{t("actions.addNote")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
        {onResetPassword && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
            <DropdownMenuItem onClick={() => runAction(onResetPassword)}>
              <KeyRound className="size-4 text-muted-foreground" />
              <span>{t("actions.resetPassword")}</span>
            </DropdownMenuItem>
          </PermissionGuard>
        )}
        {onEdit && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
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

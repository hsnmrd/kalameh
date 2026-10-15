"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Edit2, FileText, KeyRound, MoreVertical } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentActionsMenuProps {
  student: StudentDto
  onEdit: (student: StudentDto) => void
  onAvailability: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentActionsMenu({
  student,
  onEdit,
  onAvailability,
  onAddNote,
  onResetPassword,
}: StudentActionsMenuProps) {
  const t = useTranslations("students")

  return (
    <div className="flex items-center gap-2">
      {/* Desktop direct action buttons */}
      <div className="hidden lg:flex lg:items-center lg:gap-2">
        <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
            <span>{t("actions.edit")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAvailability(student)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{t("actions.availability")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddNote(student)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <FileText className="size-3.5 text-muted-foreground" />
            <span>{t("actions.addNote")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(student)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>{t("actions.resetPassword")}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Mobile action dropdown trigger button on top of square image */}
      <div className="lg:hidden">
        <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAvailability(student)}>
                <Clock className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.availability")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddNote(student)}>
                <FileText className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.addNote")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(student)}>
                <KeyRound className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.resetPassword")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      </div>
    </div>
  )
}

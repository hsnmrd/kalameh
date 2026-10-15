"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Edit2, KeyRound, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PERMISSIONS, type TeacherDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface TeacherActionsMenuProps {
  teacher: TeacherDto
  onEdit: (teacher: TeacherDto) => void
  onManageAvailability: (teacher: TeacherDto) => void
  onResetPassword: (teacher: TeacherDto) => void
  onDelete: (teacher: TeacherDto) => void
}

export function TeacherActionsMenu({
  teacher,
  onEdit,
  onManageAvailability,
  onResetPassword,
  onDelete,
}: TeacherActionsMenuProps) {
  const t = useTranslations("teachers")

  return (
    <div className="flex items-center gap-2">
      {/* Desktop direct action buttons */}
      <div className="hidden lg:flex lg:items-center lg:gap-2">
        <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(teacher)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
            <span>{t("actions.edit")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onManageAvailability(teacher)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{t("actions.manageAvailability")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(teacher)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>{t("actions.resetPassword")}</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(teacher)}
            className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
          >
            <Trash2 className="size-3.5" />
            <span>{t("actions.delete")}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Mobile action dropdown trigger button on top of square image */}
      <div className="lg:hidden">
        <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
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
              <DropdownMenuItem onClick={() => onEdit(teacher)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageAvailability(teacher)}>
                <Clock className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.manageAvailability")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(teacher)}>
                <KeyRound className="me-2 size-4 text-muted-foreground" />
                <span>{t("actions.resetPassword")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(teacher)}
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

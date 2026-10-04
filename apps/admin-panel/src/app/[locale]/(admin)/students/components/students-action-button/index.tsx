import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, Clock, Plus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@workspace/ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentsActionButtonProps {
  onAddClick?: () => void
  onSetAllAvailableClick?: () => void
  disabled?: boolean
}

export function StudentsActionButton({
  onAddClick,
  onSetAllAvailableClick,
  disabled = false,
}: StudentsActionButtonProps) {
  const t = useTranslations("students")

  if (!onAddClick && !onSetAllAvailableClick) return null

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
      <ButtonGroup className="shadow-xs">
        {/* Primary Action: Add Student (Direct Click) */}
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            disabled={disabled}
            className="h-14 cursor-pointer gap-2 rounded-s-2xl px-5 text-sm font-semibold"
          >
            <Plus className="size-5" />
            <span>{t("addStudent")}</span>
          </Button>
        )}

        {/* Separator between action buttons */}
        {onAddClick && onSetAllAvailableClick && (
          <ButtonGroupSeparator className="my-3 bg-primary-foreground/25" />
        )}

        {/* Action Dropdown for Additional Options */}
        {onSetAllAvailableClick && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  disabled={disabled}
                  className="h-14 w-12 cursor-pointer px-0"
                  aria-label={t("table.actions")}
                />
              }
            >
              <ChevronDown className="size-5 text-primary-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-60 p-1.5">
              {onAddClick && (
                <DropdownMenuItem
                  onClick={onAddClick}
                  disabled={disabled}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
                >
                  <Plus className="size-4.5" />
                  <span>{t("manualAdd")}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={onSetAllAvailableClick}
                disabled={disabled}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <Clock className="size-4.5" />
                <span>{t("setAllAvailable")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ButtonGroup>
    </PermissionGuard>
  )
}

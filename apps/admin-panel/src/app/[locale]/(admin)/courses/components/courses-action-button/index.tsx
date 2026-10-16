import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, Plus, Sparkles } from "lucide-react"
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

export interface CoursesActionButtonProps {
  onAddClick?: () => void
  onBatchClick?: () => void
}

export function CoursesActionButton({
  onAddClick,
  onBatchClick,
}: CoursesActionButtonProps) {
  const t = useTranslations("courses")

  if (!onAddClick && !onBatchClick) return null

  const hasMultipleActions = Boolean(onBatchClick && onAddClick)

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_COURSES} mode="hide">
      <ButtonGroup className="hidden shadow-xs lg:inline-flex">
        {/* Primary Action: Group Course Creation (Direct Click) */}
        {onBatchClick ? (
          <Button
            type="button"
            onClick={onBatchClick}
            className={`h-14 cursor-pointer gap-2 px-5 text-sm font-semibold ${
              hasMultipleActions ? "rounded-s-2xl" : "rounded-2xl"
            }`}
          >
            <Sparkles className="size-5" />
            <span>{t("createGroupCourses")}</span>
          </Button>
        ) : onAddClick ? (
          <Button
            type="button"
            onClick={onAddClick}
            className="h-14 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold"
          >
            <Plus className="size-5" />
            <span>{t("addSingleCourse")}</span>
          </Button>
        ) : null}

        {/* Separator between action buttons */}
        {hasMultipleActions && (
          <ButtonGroupSeparator className="my-3 bg-primary-foreground/25" />
        )}

        {/* Action Dropdown for Additional Options (e.g. Single Course Creation) */}
        {hasMultipleActions && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  className="h-14 w-12 cursor-pointer px-0"
                  aria-label={t("actions")}
                />
              }
            >
              <ChevronDown className="size-5 text-primary-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-56 p-1.5">
              <DropdownMenuItem
                onClick={onBatchClick}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <Sparkles className="size-4.5" />
                <span>{t("createGroupCourses")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onAddClick}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <Plus className="size-4.5" />
                <span>{t("addSingleCourse")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ButtonGroup>
    </PermissionGuard>
  )
}

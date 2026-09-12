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

export interface TermsActionButtonProps {
  onAddClick?: () => void
  onBatchClick?: () => void
}

export function TermsActionButton({
  onAddClick,
  onBatchClick,
}: TermsActionButtonProps) {
  const t = useTranslations("terms")

  if (!onAddClick && !onBatchClick) return null

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
      <ButtonGroup className="shadow-xs">
        {/* Primary Action: Add Term (Direct Click) */}
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            className="h-14 cursor-pointer gap-2 rounded-s-2xl px-5 text-sm font-semibold"
          >
            <Plus className="size-5" />
            <span>{t("addTerm")}</span>
          </Button>
        )}

        {/* Separator between action buttons */}
        {onAddClick && onBatchClick && (
          <ButtonGroupSeparator className="my-3 bg-primary-foreground/25" />
        )}

        {/* Action Dropdown for Additional Options (e.g. Smart Phase Terms) */}
        {onBatchClick && (
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
              {onAddClick && (
                <DropdownMenuItem
                  onClick={onAddClick}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
                >
                  <Plus className="size-4.5" />
                  <span>{t("manualAdd")}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={onBatchClick}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <Sparkles className="size-4.5" />
                <span>{t("generatePhaseTerms")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ButtonGroup>
    </PermissionGuard>
  )
}

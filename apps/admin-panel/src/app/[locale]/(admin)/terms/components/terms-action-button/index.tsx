import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, Plus, Settings, Sparkles } from "lucide-react"
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
  onSettingsClick?: () => void
}

export function TermsActionButton({
  onAddClick,
  onBatchClick,
  onSettingsClick,
}: TermsActionButtonProps) {
  const t = useTranslations("terms")

  if (!onAddClick && !onBatchClick && !onSettingsClick) return null

  const hasMultipleActions = Boolean(onBatchClick && onAddClick)

  return (
    <div className="flex items-center gap-2">
      {onSettingsClick && (
        <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onSettingsClick}
            className="size-14 rounded-2xl border-border/80 text-muted-foreground hover:text-foreground"
            aria-label={t("settingsModal.buttonLabel")}
            title={t("settingsModal.buttonLabel")}
          >
            <Settings className="size-5" />
          </Button>
        </PermissionGuard>
      )}

      {(onAddClick || onBatchClick) && (
        <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
          <ButtonGroup className="hidden shadow-xs lg:inline-flex">
            {/* Primary Action: Smart Term Creation (Direct Click) */}
            {onBatchClick ? (
              <Button
                type="button"
                onClick={onBatchClick}
                className={`h-14 cursor-pointer gap-2 px-5 text-sm font-semibold ${
                  hasMultipleActions ? "rounded-s-2xl" : "rounded-2xl"
                }`}
              >
                <Sparkles className="size-5" />
                <span>{t("generatePhaseTerms")}</span>
              </Button>
            ) : onAddClick ? (
              <Button
                type="button"
                onClick={onAddClick}
                className="h-14 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold"
              >
                <Plus className="size-5" />
                <span>{t("addTerm")}</span>
              </Button>
            ) : null}

            {/* Separator between action buttons */}
            {hasMultipleActions && (
              <ButtonGroupSeparator className="my-3 bg-primary-foreground/25" />
            )}

            {/* Action Dropdown for Additional Options (e.g. Manual Term Creation) */}
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
                    <span>{t("generatePhaseTerms")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={onAddClick}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
                  >
                    <Plus className="size-4.5" />
                    <span>{t("manualAdd")}</span>
                  </DropdownMenuItem>

                  {onSettingsClick && (
                    <DropdownMenuItem
                      onClick={onSettingsClick}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
                    >
                      <Settings className="size-4.5" />
                      <span>{t("settingsModal.buttonLabel")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ButtonGroup>
        </PermissionGuard>
      )}
    </div>
  )
}

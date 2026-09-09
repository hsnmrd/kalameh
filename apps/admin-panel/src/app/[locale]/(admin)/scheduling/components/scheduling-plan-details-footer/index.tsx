"use client"

import { useTranslations } from "next-intl"
import { MousePointerClick, ShieldCheck } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { ResponsiveDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { PermissionGuard } from "@/components/permission-guard"

interface SchedulingPlanDetailsFooterProps {
  canValidate: boolean
  canSelect: boolean
  hasValidationResult: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  isValidationPending: boolean
  onClose: () => void
  onSelect: () => void
  onValidate: () => void
}

export function SchedulingPlanDetailsFooter({
  canValidate,
  canSelect,
  hasValidationResult,
  isSelectionPending,
  isSelecting,
  isValidationPending,
  onClose,
  onSelect,
  onValidate,
}: SchedulingPlanDetailsFooterProps) {
  const t = useTranslations("scheduling.planDetails")

  return (
    <ResponsiveDialogFooter className="px-6 pb-6">
      <Button type="button" variant="outline" onClick={onClose}>
        {t("close")}
      </Button>
      <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
        {canValidate ? (
          <Button
            type="button"
            disabled={isValidationPending}
            onClick={onValidate}
          >
            {isValidationPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ShieldCheck aria-hidden data-icon="inline-start" />
            )}
            {isValidationPending
              ? t("validation.validating")
              : hasValidationResult
                ? t("validation.validateAgain")
                : t("validation.validate")}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSelectionPending || !canSelect}
            onClick={onSelect}
          >
            {isSelecting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <MousePointerClick aria-hidden data-icon="inline-start" />
            )}
            {isSelecting ? t("selection.selecting") : t("selection.select")}
          </Button>
        )}
      </PermissionGuard>
    </ResponsiveDialogFooter>
  )
}

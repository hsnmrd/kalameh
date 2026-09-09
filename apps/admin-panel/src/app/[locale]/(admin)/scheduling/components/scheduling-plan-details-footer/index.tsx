"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MousePointerClick, Send, ShieldCheck } from "lucide-react"
import {
  PERMISSIONS,
  type SchedulingPlanDetailsDto,
  type SchedulingPlanValidation,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { ResponsiveDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { PermissionGuard } from "@/components/permission-guard"
import { useSchedulingPlanPublication } from "../../hooks/use-scheduling-plan-publication"
import { SchedulingPlanPublicationDialog } from "../scheduling-plan-publication-dialog"

interface SchedulingPlanDetailsFooterProps {
  plan: SchedulingPlanDetailsDto
  validationResult?: SchedulingPlanValidation
  hasValidationResult: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  isValidationPending: boolean
  onClose: () => void
  onSelect: () => void
  onValidationBlocked: (validation: SchedulingPlanValidation) => void
  onValidate: () => void
}

export function SchedulingPlanDetailsFooter({
  plan,
  validationResult,
  hasValidationResult,
  isSelectionPending,
  isSelecting,
  isValidationPending,
  onClose,
  onSelect,
  onValidationBlocked,
  onValidate,
}: SchedulingPlanDetailsFooterProps) {
  const t = useTranslations("scheduling.planDetails")
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false)
  const publication = useSchedulingPlanPublication(plan, {
    onPublished: () => setIsConfirmationOpen(false),
    onValidationBlocked: (validation) => {
      setIsConfirmationOpen(false)
      onValidationBlocked(validation)
    },
  })
  const canValidate = plan.status === "SELECTED"
  const canSelect = ["DRAFT", "SELECTED"].includes(plan.status)
  const canPublish =
    canValidate && !isValidationPending && validationResult?.isValid === true

  return (
    <>
      <ResponsiveDialogFooter className="px-6 pb-6">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
        <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
          {canValidate ? (
            <>
              <Button
                type="button"
                variant={canPublish ? "outline" : "default"}
                disabled={isValidationPending || publication.isPending}
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
              {canPublish && (
                <Button
                  type="button"
                  disabled={publication.isPending}
                  onClick={() => setIsConfirmationOpen(true)}
                >
                  <Send aria-hidden data-icon="inline-start" />
                  {t("publication.publish")}
                </Button>
              )}
            </>
          ) : (
            plan.status === "DRAFT" && (
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
            )
          )}
        </PermissionGuard>
      </ResponsiveDialogFooter>

      <SchedulingPlanPublicationDialog
        open={isConfirmationOpen}
        plan={plan}
        isPending={publication.isPending}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={publication.publish}
      />
    </>
  )
}

"use client"

import { useLocale, useTranslations } from "next-intl"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { formatNumber } from "@workspace/ui/lib/utils"
import { useSchedulingPlanValidation } from "../../hooks/use-scheduling-plan-validation"
import { SchedulingPlanDetailsFooter } from "../scheduling-plan-details-footer"
import { Content } from "./content"

interface SchedulingPlanDetailsDialogProps {
  plan: SchedulingPlanDetailsDto
  isRecommended: boolean
  isSelected: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  onSelect: () => void
  onClose: () => void
}

export function SchedulingPlanDetailsDialog({
  plan,
  isRecommended,
  isSelected,
  isSelectionPending,
  isSelecting,
  onSelect,
  onClose,
}: SchedulingPlanDetailsDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const validation = useSchedulingPlanValidation(plan.id, plan.updatedAt)

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="lg:flex lg:max-h-[92dvh] lg:max-w-5xl lg:flex-col lg:overflow-hidden xl:max-w-6xl 2xl:max-w-7xl">
        <ResponsiveDialogHeader>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <ResponsiveDialogTitle>
                {t("title", { rank: formatNumber(plan.rank, locale) })}
              </ResponsiveDialogTitle>
              {isRecommended && (
                <Badge variant="success">{t("recommended")}</Badge>
              )}
              {isSelected && <Badge>{t("selected")}</Badge>}
              {plan.status === "PUBLISHED" && (
                <Badge variant="success">{t("published")}</Badge>
              )}
              {plan.status === "REJECTED" && (
                <Badge variant="secondary">{t("rejected")}</Badge>
              )}
            </div>
            <ResponsiveDialogDescription>
              {plan.status === "PUBLISHED"
                ? t("publishedDescription")
                : t("description")}
            </ResponsiveDialogDescription>
          </div>
          <ResponsiveDialogCloseButton aria-label={t("close")} />
        </ResponsiveDialogHeader>

        <Content
          plan={plan}
          isSelected={isSelected}
          validationResult={validation.result}
        />
        <SchedulingPlanDetailsFooter
          plan={plan}
          validationResult={validation.result}
          hasValidationResult={Boolean(validation.result)}
          isSelectionPending={isSelectionPending}
          isSelecting={isSelecting}
          isValidationPending={validation.isPending}
          onClose={onClose}
          onSelect={onSelect}
          onValidationBlocked={validation.setResult}
          onValidate={validation.validate}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

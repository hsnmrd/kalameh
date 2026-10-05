"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Link, useIsRtl } from "@/i18n/routing"
import type { SetupStep } from "../types"

export interface SetupCurrentActionBannerProps {
  currentStep?: SetupStep
  isAllCompleted: boolean
}

export function SetupCurrentActionBanner({
  currentStep,
  isAllCompleted,
}: SetupCurrentActionBannerProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  if (isAllCompleted || !currentStep) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-success-foreground">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <div className="text-sm font-medium text-foreground">
          {t("completedAll")}
        </div>
      </div>
    )
  }

  const stepTitle = t(`steps.${currentStep.id}.title`)
  const actionHint = t(`steps.${currentStep.id}.actionHint`)
  const actionLabel = t(`actions.${currentStep.actionLabelKey}`)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">
              {t("currentStepPrefix")}
            </span>
            <span className="text-sm font-bold text-foreground">
              {stepTitle}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{actionHint}</p>
        </div>
      </div>

      <Link href={currentStep.primaryHref}>
        <Button
          size="sm"
          className="h-9 w-full cursor-pointer gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <span>{actionLabel}</span>
          <ActionArrow className="size-3.5" />
        </Button>
      </Link>
    </div>
  )
}

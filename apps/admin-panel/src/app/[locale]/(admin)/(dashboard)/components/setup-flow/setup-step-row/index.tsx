"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, ArrowLeft, ArrowRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Link, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep } from "../types"

export interface SetupStepRowProps {
  step: SetupStep
}

export function SetupStepRow({ step }: SetupStepRowProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const title = t(`steps.${step.id}.title`)
  const actionLabel = t(`actions.${step.actionLabelKey}`)

  const isCompleted = step.status === "completed"
  const isCurrent = step.status === "current"
  const Icon = step.icon

  // 1. Completed State (Image 1 style: blue-tinted row, strikethrough blue text, blue checkmark)
  if (isCompleted) {
    return (
      <Link
        href={step.primaryHref}
        aria-label={`${title} (${t("actions.view")})`}
        className={cn(
          "group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-200 sm:min-h-13 sm:px-4.5 sm:py-3",
          "border-primary/25 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="size-5 shrink-0 text-primary" />
          <span className="truncate text-xs font-medium text-primary line-through sm:text-sm">
            {title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="sr-only">{t("actions.view")}</span>
          <Check className="size-4.5 shrink-0 text-primary" />
        </div>
      </Link>
    )
  }

  // 2. Current State (Image 1 style: prominent card row, normal text, current badge + CTA arrow)
  if (isCurrent) {
    return (
      <Link
        href={step.primaryHref}
        aria-label={`${title} - ${actionLabel}`}
        className={cn(
          "group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-200 sm:min-h-13 sm:px-4.5 sm:py-3",
          "border-primary/50 bg-card text-foreground shadow-xs hover:border-primary hover:bg-muted/30"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="size-5 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
            {title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant="default"
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          >
            {t("status.current")}
          </Badge>
          <span className="hidden items-center gap-1 text-xs font-semibold text-primary sm:inline-flex">
            <span>{actionLabel}</span>
            <ActionArrow className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </span>
          <ActionArrow className="size-4 text-primary sm:hidden" />
        </div>
      </Link>
    )
  }

  // 3. Pending State (Image 1 style: dark/subtle card row, muted icon and text, no checkmark)
  return (
    <div
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-200 sm:min-h-13 sm:px-4.5 sm:py-3",
        "border-border/50 bg-muted/30 text-muted-foreground"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-normal text-muted-foreground sm:text-sm">
          {title}
        </span>
      </div>
    </div>
  )
}

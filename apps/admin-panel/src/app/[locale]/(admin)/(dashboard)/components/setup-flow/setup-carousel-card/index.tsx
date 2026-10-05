"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, ArrowLeft, ArrowRight, Lock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Link, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep } from "../types"

export interface SetupCarouselCardProps {
  step: SetupStep
}

export function SetupCarouselCard({ step }: SetupCarouselCardProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const title = t(`steps.${step.id}.title`)
  const description = t(`steps.${step.id}.description`)
  const actionLabel = t(`actions.${step.actionLabelKey}`)

  const isCompleted = step.status === "completed"
  const isCurrent = step.status === "current"
  const Icon = step.icon

  // 1. Completed Card: Compact, subdued, minimal text
  if (isCompleted) {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border/40 bg-muted/20 p-3.5 opacity-75 transition-all duration-200 hover:border-border hover:opacity-100">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
              <Icon className="size-3.5" />
            </div>
            <Badge
              variant="success"
              className="gap-1 px-2 py-0.5 text-[10px] font-semibold"
            >
              <Check className="size-3" />
              <span>{t("status.completed")}</span>
            </Badge>
          </div>

          <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
            {title}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-end pt-1">
          <Link href={step.primaryHref}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 cursor-pointer gap-1 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>{t("actions.view")}</span>
              <ActionArrow className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 2. Current Card: Prominent, high-contrast, primary focus & CTA
  if (isCurrent) {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border-2 border-primary bg-card p-4 shadow-sm ring-4 ring-primary/10 transition-all duration-200">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Icon className="size-4.5" />
            </div>
            <Badge
              variant="default"
              className="animate-pulse px-2 py-0.5 text-[10px] font-bold"
            >
              {t("status.current")}
            </Badge>
          </div>

          <div>
            <h3 className="line-clamp-1 text-xs font-bold text-foreground sm:text-sm">
              {title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-1">
          <Link href={step.primaryHref} className="block w-full">
            <Button
              size="sm"
              className="h-8 w-full cursor-pointer gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <span>{actionLabel}</span>
              <ActionArrow className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 3. Pending Card (Not Done Item): NO border, soft muted background, minimal text
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-muted/30 p-3.5 opacity-60 transition-all duration-200 hover:opacity-80">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          <Badge
            variant="secondary"
            className="gap-1 px-2 py-0.5 text-[10px] font-normal text-muted-foreground"
          >
            <Lock className="size-2.5" />
            <span>{t("status.pending")}</span>
          </Badge>
        </div>

        <h3 className="line-clamp-1 text-xs font-semibold text-muted-foreground">
          {title}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-end pt-1">
        <Link href={step.primaryHref}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer gap-1 px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span>{t("actions.view")}</span>
            <ActionArrow className="size-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

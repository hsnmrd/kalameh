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

  // 1. Completed Card: Minimal, subdued, low attention
  if (isCompleted) {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl border border-border/40 bg-card p-4 shadow-2xs transition-all duration-200 sm:p-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-4.5" />
            </div>
            <span className="text-xs font-semibold text-success">✓</span>
          </div>

          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground/80 sm:text-base">
              {title}
            </h3>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Link href={step.primaryHref} className="block w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full cursor-pointer gap-1.5 rounded-2xl border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span>{t("actions.view")}</span>
              <ActionArrow className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 2. Current Card: Prominent, high-contrast, primary focus & CTA - NO border
  if (isCurrent) {
    return (
      <div className="flex h-full flex-col justify-between rounded-3xl bg-card p-4 shadow-sm transition-all duration-200 sm:p-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <Icon className="size-4.5" />
            </div>
            <Badge
              variant="default"
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            >
              {t("status.current")}
            </Badge>
          </div>

          <div>
            <h3 className="line-clamp-1 text-sm font-bold text-foreground sm:text-base">
              {title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Link href={step.primaryHref} className="block w-full">
            <Button className="h-10 w-full cursor-pointer gap-2 rounded-2xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <span>{actionLabel}</span>
              <ActionArrow className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 3. Pending Card (Not Done Item): Warning color accents, low opacity
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-warning/20 bg-warning/5 p-4 opacity-50 transition-all duration-200 hover:opacity-75 sm:p-5">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Icon className="size-4 text-warning" />
          </div>
          <Badge
            variant="warning"
            className="gap-1 rounded-full border-transparent bg-warning/15 px-2.5 py-0.5 text-[10px] font-normal text-warning"
          >
            <Lock className="size-2.5 text-warning" />
            <span>{t("status.pending")}</span>
          </Badge>
        </div>

        <div>
          <h3 className="line-clamp-1 text-xs font-semibold text-foreground/80 sm:text-sm">
            {title}
          </h3>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-end pt-1">
        <Link href={step.primaryHref} className="block w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full cursor-pointer gap-1 rounded-xl px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span>{t("actions.view")}</span>
            <ActionArrow className="size-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

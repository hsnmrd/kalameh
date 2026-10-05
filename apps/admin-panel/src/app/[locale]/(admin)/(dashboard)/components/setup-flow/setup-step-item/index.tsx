"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Link, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep } from "../types"
import { SchedulingSubsteps } from "../scheduling-substeps"

export interface SetupStepItemProps {
  step: SetupStep
  isLast: boolean
}

export function SetupStepItem({ step, isLast }: SetupStepItemProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const title = t(`steps.${step.id}.title`)
  const description = t(`steps.${step.id}.description`)
  const actionLabel = t(`actions.${step.actionLabelKey}`)

  const isCompleted = step.status === "completed"
  const isCurrent = step.status === "current"

  return (
    <div className="relative flex items-start gap-4 pb-6 last:pb-0">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute top-10 bottom-0 w-0.5",
            isRtl ? "right-4.5 -translate-x-1/2" : "left-4.5 -translate-x-1/2",
            isCompleted ? "bg-success/40" : "bg-border"
          )}
        />
      )}

      {/* Step Circle */}
      <div
        className={cn(
          "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
          isCompleted &&
            "bg-success text-success-foreground shadow-xs ring-4 ring-success/10",
          isCurrent &&
            "animate-pulse bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/20",
          step.status === "pending" &&
            "border border-border bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? <Check className="size-4" /> : step.stepNumber}
      </div>

      {/* Step Content */}
      <div
        className={cn(
          "flex-1 rounded-2xl border p-4.5 transition-all",
          isCurrent && "border-primary/40 bg-card shadow-xs",
          isCompleted && "border-border/80 bg-card/60",
          step.status === "pending" && "border-border/50 bg-muted/20 opacity-80"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                {title}
              </h3>
              <Badge
                variant={
                  isCompleted ? "success" : isCurrent ? "default" : "secondary"
                }
                className="text-[10px]"
              >
                {t(`status.${step.status}`)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link href={step.primaryHref}>
              <Button
                size="sm"
                variant={
                  isCurrent ? "default" : isCompleted ? "outline" : "ghost"
                }
                className={cn(
                  "h-9 cursor-pointer gap-1.5 rounded-xl px-4 text-xs font-semibold",
                  isCurrent &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  isCompleted && "border-border text-foreground hover:bg-muted"
                )}
              >
                <span>{actionLabel}</span>
                <ActionArrow className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Nested Sub-steps for Scheduling */}
        {step.substeps && step.substeps.length > 0 && (
          <SchedulingSubsteps substeps={step.substeps} />
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2, Circle, CircleAlert } from "lucide-react"
import type { SchedulingRunStatus } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingRunProgressProps {
  status: SchedulingRunStatus
  isFailed?: boolean
}

const STAGES = [
  { id: 1, key: "stage1", threshold: 20 },
  { id: 2, key: "stage2", threshold: 45 },
  { id: 3, key: "stage3", threshold: 70 },
  { id: 4, key: "stage4", threshold: 88 },
  { id: 5, key: "stage5", threshold: 100 },
] as const

export function SchedulingRunProgress({
  status,
  isFailed = false,
}: SchedulingRunProgressProps) {
  const t = useTranslations("scheduling.runStatus.progress")
  const locale = useLocale()
  const [currentStage, setCurrentStage] = React.useState(1)
  const [percent, setPercent] = React.useState(15)

  const isCompleted = status === "COMPLETED"
  const isGenerating = status === "GENERATING"
  const isQueued = status === "QUEUED"

  React.useEffect(() => {
    if (isCompleted) {
      setCurrentStage(5)
      setPercent(100)
      return
    }

    if (isFailed) {
      return
    }

    if (isQueued) {
      setCurrentStage(1)
      setPercent(10)
      return
    }

    if (isGenerating) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000

        if (elapsed < 1.2) {
          setCurrentStage(1)
          setPercent(20)
        } else if (elapsed < 2.5) {
          setCurrentStage(2)
          setPercent(45)
        } else if (elapsed < 4.5) {
          setCurrentStage(3)
          setPercent(70)
        } else if (elapsed < 7.0) {
          setCurrentStage(4)
          setPercent(88)
        } else {
          setCurrentStage(5)
          setPercent(95)
        }
      }, 300)

      return () => clearInterval(interval)
    }
  }, [isCompleted, isFailed, isGenerating, isQueued])

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:p-5"
      role="region"
      aria-label={t("title")}
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{t("title")}</span>
        <span className="font-mono">{formatNumber(percent, locale)}٪</span>
      </div>

      {/* Progress Track */}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isFailed
              ? "bg-destructive"
              : isCompleted
                ? "bg-success"
                : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stages Stepper */}
      <div className="flex flex-col gap-2.5 pt-1">
        {STAGES.map((stage) => {
          const isDone = isCompleted || (!isFailed && currentStage > stage.id)
          const isCurrent =
            !isCompleted && !isFailed && currentStage === stage.id
          const isStageFailed = isFailed && currentStage === stage.id

          return (
            <div
              key={stage.id}
              className="flex items-center gap-3 text-sm transition-colors"
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : isStageFailed ? (
                  <CircleAlert className="size-4 text-destructive" />
                ) : isCurrent ? (
                  <Spinner size="sm" className="size-3.5 text-primary" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground/40" />
                )}
              </span>

              <span
                className={`${
                  isDone
                    ? "font-medium text-foreground"
                    : isCurrent
                      ? "font-semibold text-primary"
                      : isStageFailed
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                }`}
              >
                {t(stage.key)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

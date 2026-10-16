"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface LongRunningAlertProps {
  onRestart: () => void
}

export function LongRunningAlert({ onRestart }: LongRunningAlertProps) {
  const t = useTranslations("scheduling.runStatus.longRunning")

  return (
    <div
      role="alert"
      className="flex flex-col gap-4 rounded-2xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <AlertCircle className="size-5 text-warning" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-foreground">{t("tip")}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRestart}
        className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl border-border px-5 text-sm font-semibold hover:bg-warning/10"
      >
        <RotateCcw className="size-5 shrink-0" aria-hidden />
        <span>{t("restart")}</span>
      </Button>
    </div>
  )
}

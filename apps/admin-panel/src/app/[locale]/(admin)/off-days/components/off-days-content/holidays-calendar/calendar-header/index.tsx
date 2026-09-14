"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarDays, Check, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"

export interface CalendarHeaderProps {
  hasChanges: boolean
  pendingChangesCount: number
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
}

export function CalendarHeader({
  hasChanges,
  pendingChangesCount,
  isSaving,
  onDiscard,
  onSave,
}: CalendarHeaderProps) {
  const t = useTranslations("setting.offDays")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {t("calendarTitle")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("calendarDescription")}
        </p>
      </div>

      {hasChanges && (
        <div className="hidden items-center gap-2 lg:flex">
          <Badge
            variant="outline"
            className="h-7 border-warning/50 bg-warning/10 px-2.5 text-xs font-medium text-warning"
          >
            {t("unsavedChanges", { count: pendingChangesCount })}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscard}
            disabled={isSaving}
            className="h-14 cursor-pointer rounded-2xl px-4 text-base text-muted-foreground hover:text-foreground"
          >
            <RotateCcw data-icon="inline-start" />
            <span>{t("discardChanges")}</span>
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-14 cursor-pointer rounded-2xl px-5 text-base font-medium shadow-xs"
          >
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Check data-icon="inline-start" />
            )}
            <span>{t("saveChanges")}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

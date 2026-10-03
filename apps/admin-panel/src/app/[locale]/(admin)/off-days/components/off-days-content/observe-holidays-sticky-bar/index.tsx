"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, RotateCcw } from "lucide-react"
import { Switch } from "@workspace/ui/components/switch"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"

export interface ObserveHolidaysStickyBarProps {
  observeOfficialHolidays: boolean
  onToggleObserve: (checked: boolean) => void
  isUpdatingSettings: boolean
  isLoadingInstitute: boolean
  hasChanges: boolean
  pendingChangesCount: number
  isSavingCalendar: boolean
  onDiscardCalendar: () => void
  onSaveCalendar: () => void
}

export function ObserveHolidaysStickyBar({
  observeOfficialHolidays,
  onToggleObserve,
  isUpdatingSettings,
  isLoadingInstitute,
  hasChanges,
  pendingChangesCount,
  isSavingCalendar,
  onDiscardCalendar,
  onSaveCalendar,
}: ObserveHolidaysStickyBarProps) {
  const t = useTranslations("setting.offDays")

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-lg backdrop-blur-md transition-all">
      {/* Settings Info & Switch */}
      <div className="flex items-center gap-4">
        <Switch
          checked={observeOfficialHolidays}
          onCheckedChange={onToggleObserve}
          disabled={isLoadingInstitute || isUpdatingSettings}
        />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {t("observeHolidaysTitle")}
            </span>
            {isUpdatingSettings && <Spinner className="size-3.5" />}
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {t("observeHolidaysDescription")}
          </p>
        </div>
      </div>

      {/* Unsaved Calendar Changes Controls */}
      {hasChanges && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-7 border-warning/50 bg-warning/10 px-2.5 text-xs font-medium text-warning"
          >
            {t("unsavedChanges", { count: pendingChangesCount })}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscardCalendar}
            disabled={isSavingCalendar}
            className="h-10 cursor-pointer rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("discardChanges")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSaveCalendar}
            disabled={isSavingCalendar}
            className="h-10 cursor-pointer rounded-xl px-4 text-xs font-medium shadow-xs"
          >
            {isSavingCalendar ? (
              <Spinner className="size-3.5" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>{t("saveChanges")}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

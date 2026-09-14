"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, RotateCcw, CalendarDays } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { Calendar } from "@workspace/ui/components/calendar"
import { toast } from "@workspace/ui/components/sonner"
import { isJalaliHoliday } from "@workspace/types"
import { institutesResource } from "@/lib/api"

export interface HolidaysCalendarProps {
  instituteId: string
  observeOfficialHolidays: boolean
  dismissedHolidays?: string[]
  customOffDays?: string[]
  onOpenAddModalWithDate?: (dateIso: string) => void
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function HolidaysCalendar({
  instituteId,
  observeOfficialHolidays,
  dismissedHolidays = [],
  customOffDays = [],
  onOpenAddModalWithDate,
}: HolidaysCalendarProps) {
  const t = useTranslations("setting.offDays")
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date())
  const [stagedDismissed, setStagedDismissed] = React.useState<Set<string>>(
    () => new Set(dismissedHolidays)
  )

  // Sync staged with prop when props change and no unsaved local changes exist
  const initialSet = React.useMemo(
    () => new Set(dismissedHolidays),
    [dismissedHolidays]
  )

  const propKey = (dismissedHolidays || []).join(",")
  const [lastPropKey, setLastPropKey] = React.useState(propKey)
  if (lastPropKey !== propKey) {
    setLastPropKey(propKey)
    setStagedDismissed(new Set(dismissedHolidays))
  }

  // Calculate differences / unsaved changes
  const hasChanges = React.useMemo(() => {
    if (stagedDismissed.size !== initialSet.size) return true
    for (const d of stagedDismissed) {
      if (!initialSet.has(d)) return true
    }
    return false
  }, [stagedDismissed, initialSet])

  const changesCount = React.useMemo(() => {
    let diff = 0
    for (const d of stagedDismissed) {
      if (!initialSet.has(d)) diff++
    }
    for (const d of initialSet) {
      if (!stagedDismissed.has(d)) diff++
    }
    return diff
  }, [stagedDismissed, initialSet])

  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("successUpdateCalendar"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
    },
  })

  const handleDayClick = (date: Date) => {
    const isoDate = toIsoDate(date)
    const holidayCheck = isJalaliHoliday(date)

    if (holidayCheck.isHoliday) {
      // Toggle dismissed status
      setStagedDismissed((prev) => {
        const next = new Set(prev)
        if (next.has(isoDate)) {
          next.delete(isoDate)
        } else {
          next.add(isoDate)
        }
        return next
      })
    } else {
      // Normal day or custom off day
      if (customOffDays.includes(isoDate)) {
        // Already a custom off day
        return
      }
      // If parent provided callback to open add modal with preselected date
      onOpenAddModalWithDate?.(isoDate)
    }
  }

  const handleSave = () => {
    if (!instituteId || !hasChanges) return
    updateMutation.mutate({
      id: instituteId,
      body: {
        dismissedHolidays: Array.from(stagedDismissed),
      },
    })
  }

  const handleDiscard = () => {
    setStagedDismissed(new Set(initialSet))
  }

  const stagedArray = React.useMemo(
    () => Array.from(stagedDismissed),
    [stagedDismissed]
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-background/60 p-4">
      {/* Calendar Header & Status */}
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
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-7 border-warning/50 bg-warning/10 px-2.5 text-xs font-medium text-warning"
            >
              {t("unsavedChanges", { count: changesCount })}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleDiscard}
              disabled={updateMutation.isPending}
              className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>{t("discardChanges")}</span>
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="h-8 cursor-pointer gap-1.5 rounded-lg px-3 text-xs font-medium shadow-xs"
            >
              {updateMutation.isPending ? (
                <Spinner className="size-3.5 text-foreground" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>{t("saveChanges")}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-destructive" />
          <span>{t("legendOfficialHoliday")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" />
          <span>{t("legendDismissedHoliday")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-warning" />
          <span>{t("legendCustomOff")}</span>
        </div>
      </div>

      {/* Interactive Calendar */}
      <div className="flex w-full justify-center overflow-x-auto p-1">
        <Calendar
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          showOffDays={true}
          observeOfficialHolidays={observeOfficialHolidays}
          offDays={customOffDays}
          dismissedHolidays={stagedArray}
          className="mx-auto w-fit border border-border bg-card shadow-xs"
        />
      </div>
    </div>
  )
}

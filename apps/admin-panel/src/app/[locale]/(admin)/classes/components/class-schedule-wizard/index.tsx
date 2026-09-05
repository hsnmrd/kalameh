"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { classesResource } from "@/lib/api"
import { cn } from "@workspace/ui/lib/utils"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Calendar } from "@workspace/ui/components/calendar"
import { Badge } from "@workspace/ui/components/badge"
import {
  WEEK_DAYS,
  type WeekDay,
  type TermDto,
  type ClassConflictResult,
} from "@workspace/types"
import { DAY_TO_JS_DAY, PRESETS } from "@/data"

export interface ClassScheduleWizardProps {
  open: boolean
  onClose: () => void
  term?: TermDto | null
  instituteId?: string | null
  classroomId?: string | null
  teacherName?: string | null
  excludeClassId?: string | null
  initialDaysOfWeek?: string[]
  initialSessionDates?: string[]
  initialStartTime?: string | null
  initialEndTime?: string | null
  onConfirm: (data: {
    daysOfWeek: string[]
    sessionDates: string[]
    startTime: string | null
    endTime: string | null
    formattedSchedule: string
  }) => void
}

const EMPTY_DAYS: string[] = []

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function ClassScheduleWizard({
  open,
  onClose,
  term,
  instituteId,
  classroomId,
  teacherName,
  excludeClassId,
  initialDaysOfWeek = EMPTY_DAYS,
  initialSessionDates = EMPTY_DAYS,
  initialStartTime = "17:00",
  initialEndTime = "18:30",
  onConfirm,
}: ClassScheduleWizardProps) {
  const t = useTranslations("classes.scheduleWizard")
  const locale = useLocale()

  const [conflictingDates, setConflictingDates] = React.useState<string[]>([])
  const [conflictMessage, setConflictMessage] = React.useState<string | null>(
    null
  )
  const [conflictResult, setConflictResult] =
    React.useState<ClassConflictResult | null>(null)

  const clearConflictState = React.useCallback(() => {
    setConflictingDates([])
    setConflictMessage(null)
    setConflictResult(null)
  }, [])

  const checkConflictsMutation = useMutation({
    ...classesResource.checkConflicts.toMutation(),
  })

  const computePatternKeys = React.useCallback(
    (days: WeekDay[]) => {
      if (!term?.startDate || !term?.endDate || days.length === 0) {
        return new Set<string>()
      }

      const start = new Date(term.startDate)
      const end = new Date(term.endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return new Set<string>()
      }

      const targetJsDays = new Set(days.map((d) => DAY_TO_JS_DAY[d]))
      const keys = new Set<string>()
      let currentMs = start.getTime()
      const endMs = end.getTime()
      const ONE_DAY_MS = 24 * 60 * 60 * 1000

      while (currentMs <= endMs) {
        const cur = new Date(currentMs)
        if (targetJsDays.has(cur.getDay())) {
          keys.add(toDateKey(cur))
        }
        currentMs += ONE_DAY_MS
      }

      return keys
    },
    [term?.startDate, term?.endDate]
  )

  const [selectedDays, setSelectedDays] = React.useState<WeekDay[]>(
    () =>
      initialDaysOfWeek.filter((d) =>
        WEEK_DAYS.includes(d as WeekDay)
      ) as WeekDay[]
  )
  const [sessionDateKeys, setSessionDateKeys] = React.useState<Set<string>>(
    () => {
      if (initialSessionDates && initialSessionDates.length > 0) {
        return new Set(initialSessionDates)
      }
      return computePatternKeys(
        initialDaysOfWeek.filter((d) =>
          WEEK_DAYS.includes(d as WeekDay)
        ) as WeekDay[]
      )
    }
  )
  const [startTime, setStartTime] = React.useState<string>(
    initialStartTime || "17:00"
  )
  const [endTime, setEndTime] = React.useState<string>(
    initialEndTime || "18:30"
  )

  const initialDaysKey = initialDaysOfWeek.join(",")
  const initialSessionDatesKey = initialSessionDates.join(",")

  // Reset state when modal opens with initial values
  React.useEffect(() => {
    if (open) {
      clearConflictState()
      const validInitialDays = initialDaysOfWeek.filter((d) =>
        WEEK_DAYS.includes(d as WeekDay)
      ) as WeekDay[]
      setSelectedDays(validInitialDays)
      if (initialSessionDates && initialSessionDates.length > 0) {
        setSessionDateKeys(new Set(initialSessionDates))
      } else {
        setSessionDateKeys(computePatternKeys(validInitialDays))
      }
      setStartTime(initialStartTime || "17:00")
      setEndTime(initialEndTime || "18:30")
    }
  }, [
    open,
    initialDaysKey,
    initialSessionDatesKey,
    initialStartTime,
    initialEndTime,
    computePatternKeys,
    clearConflictState,
  ])

  const toggleDay = (day: WeekDay) => {
    clearConflictState()
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    setSelectedDays(nextDays)
    setSessionDateKeys(computePatternKeys(nextDays))
  }

  const applyPreset = (presetDays: WeekDay[]) => {
    clearConflictState()
    setSelectedDays(presetDays)
    setSessionDateKeys(computePatternKeys(presetDays))
  }

  // Toggle individual calendar day (add/remove from session range)
  const handleDayClick = (clickedDate: Date) => {
    if (!term?.startDate || !term?.endDate) return

    const start = new Date(term.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(term.endDate)
    end.setHours(23, 59, 59, 999)

    // Ignore clicks outside the selected term's range
    if (clickedDate < start || clickedDate > end) return

    clearConflictState()

    const key = toDateKey(clickedDate)
    setSessionDateKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Check if date is outside term range
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (!term?.startDate || !term?.endDate) return true
      const start = new Date(term.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(term.endDate)
      end.setHours(23, 59, 59, 999)
      return date < start || date > end
    },
    [term?.startDate, term?.endDate]
  )

  // Active session dates
  const sessionDates = React.useMemo(() => {
    const dates: Date[] = []
    for (const key of sessionDateKeys) {
      const parts = key.split("-")
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      if (y && m && d) {
        dates.push(new Date(y, m - 1, d))
      }
    }
    return dates.sort((a, b) => a.getTime() - b.getTime())
  }, [sessionDateKeys])

  const initialMonth = React.useMemo(() => {
    const firstSession = sessionDates[0]
    if (firstSession) {
      return firstSession
    }
    if (term?.startDate) {
      const d = new Date(term.startDate)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  }, [sessionDates, term?.startDate])

  const initialMonthKey = initialMonth.toISOString().slice(0, 7)

  const handleConfirm = async () => {
    const sortedDays = WEEK_DAYS.filter((d) => selectedDays.includes(d))
    const sortedSessionDates = Array.from(sessionDateKeys).sort()

    // Conflict check service call
    if (
      term?.id &&
      (classroomId || teacherName?.trim()) &&
      startTime &&
      endTime
    ) {
      try {
        const result = await checkConflictsMutation.mutateAsync({
          termId: term.id,
          classroomId: classroomId === "NONE" ? null : classroomId || null,
          teacherName: teacherName?.trim() || null,
          startTime,
          endTime,
          daysOfWeek: sortedDays,
          sessionDates: sortedSessionDates,
          excludeClassId: excludeClassId || null,
          instituteId: instituteId || term.instituteId || undefined,
        })

        if (result.hasConflict) {
          setConflictingDates(result.conflictingDates)
          const firstMsg = result.conflicts[0]?.message || t("conflictDetected")
          setConflictMessage(firstMsg)
          setConflictResult(result)
          toast.error(firstMsg)
          return
        }
      } catch {
        return
      }
    }

    clearConflictState()

    const dayNames = sortedDays.map((d) => t(`days.${d}`)).join("، ")

    let formattedSchedule = ""
    if (sortedDays.length > 0) {
      if (startTime && endTime) {
        formattedSchedule = `${dayNames} (${startTime} - ${endTime})`
      } else if (startTime) {
        formattedSchedule = `${dayNames} (${startTime})`
      } else {
        formattedSchedule = dayNames
      }
    }

    onConfirm({
      daysOfWeek: sortedDays,
      sessionDates: sortedSessionDates,
      startTime: startTime || null,
      endTime: endTime || null,
      formattedSchedule,
    })
    onClose()
  }

  const conflictingDateObjects = React.useMemo(() => {
    const dates: Date[] = []
    for (const key of conflictingDates) {
      const parts = key.split("-")
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      if (y && m && d) {
        dates.push(new Date(y, m - 1, d))
      }
    }
    return dates
  }, [conflictingDates])

  const normalSessionDates = React.useMemo(() => {
    if (conflictingDates.length === 0) return sessionDates
    const conflictSet = new Set(conflictingDates)
    return sessionDates.filter((d) => !conflictSet.has(toDateKey(d)))
  }, [sessionDates, conflictingDates])

  const displayedConflicts = React.useMemo(() => {
    if (!conflictResult?.conflicts) return []
    const classroomConflictTitles = new Set(
      conflictResult.conflicts
        .filter((c) => c.type === "CLASSROOM")
        .map((c) => c.conflictingClassTitle)
    )
    return conflictResult.conflicts.filter((c) => {
      if (
        c.type === "TEACHER" &&
        classroomConflictTitles.has(c.conflictingClassTitle)
      ) {
        return false
      }
      return true
    })
  }, [conflictResult?.conflicts])

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-muted-foreground" />
              <span>{t("presets")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const isActive =
                  preset.days.length === selectedDays.length &&
                  preset.days.every((d) => selectedDays.includes(d))

                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(preset.days)}
                    className={cn(
                      "h-8 rounded-xl text-xs transition-colors",
                      isActive &&
                        "border-primary/50 bg-primary/10 font-medium text-primary"
                    )}
                  >
                    {isActive && <Check className="size-3 text-primary" />}
                    <span>{t(preset.titleKey as any)}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Weekday Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t("weekdays")}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
              {WEEK_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day)
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "h-10 rounded-xl text-xs font-normal transition-all",
                      isSelected && "font-semibold shadow-xs"
                    )}
                  >
                    {t(`days.${day}` as any)}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{t("timeRange")}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel className="text-xs">{t("startTime")}</FieldLabel>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    clearConflictState()
                  }}
                  className="text-center font-mono"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">{t("endTime")}</FieldLabel>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    clearConflictState()
                  }}
                  className="text-center font-mono"
                />
              </Field>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {t("calendarPreview")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {conflictingDates.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-6 rounded-lg bg-amber-500 px-2 text-xs font-medium text-white shadow-xs hover:bg-amber-600"
                  >
                    {t("conflictDaysCount", { count: conflictingDates.length })}
                  </Badge>
                )}
                {term && sessionDates.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-6 rounded-lg px-2 text-xs font-medium"
                  >
                    {t("calculatedSessions", { count: sessionDates.length })}
                  </Badge>
                )}
              </div>
            </div>

            {/* Conflict Warning - Clean & Compact */}
            {conflictResult &&
            conflictResult.hasConflict &&
            displayedConflicts.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                      <span>{t("conflictBannerTitle")}</span>
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                        {t("conflictDaysCount", {
                          count: conflictResult.conflictingDates.length,
                        })}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      {displayedConflicts.map((conflict, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-foreground"
                        >
                          <span className="font-medium text-amber-800 dark:text-amber-300">
                            {conflict.type === "CLASSROOM"
                              ? t("conflictTypeClassroom")
                              : t("conflictTypeTeacher")}
                            :
                          </span>
                          <span className="font-semibold">
                            {conflict.conflictingClassTitle}
                          </span>
                          {conflict.startTime && conflict.endTime && (
                            <span className="font-mono text-muted-foreground">
                              ({conflict.startTime} - {conflict.endTime})
                            </span>
                          )}
                          {conflict.classroomName && (
                            <span className="text-muted-foreground">
                              • {conflict.classroomName}
                            </span>
                          )}
                          {conflict.teacherName && (
                            <span className="text-muted-foreground">
                              • {conflict.teacherName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : conflictMessage ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{conflictMessage}</span>
              </div>
            ) : null}

            {!term ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("noTermSelectedHint")}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center overflow-x-auto py-1">
                  <Calendar
                    key={initialMonthKey}
                    defaultMonth={initialMonth}
                    onDayClick={handleDayClick}
                    disabled={isDateDisabled}
                    modifiers={{
                      session: normalSessionDates,
                      conflict: conflictingDateObjects,
                    }}
                    modifiersClassNames={{
                      session:
                        "!bg-primary !text-primary-foreground rounded-xl font-semibold shadow-xs hover:!bg-primary/90",
                      conflict:
                        "!bg-amber-500 hover:!bg-amber-600 !text-white rounded-xl font-semibold shadow-xs",
                    }}
                    locale={locale === "fa" ? "fa" : "en"}
                    className="rounded-xl border border-border bg-card shadow-2xs"
                  />
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  {t("clickToToggleHint")}
                </p>
              </div>
            )}
          </div>
        </div>

        <FormDialogFooter className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={
              sessionDates.length === 0 || checkConflictsMutation.isPending
            }
            className="gap-2"
          >
            {checkConflictsMutation.isPending && (
              <Spinner className="size-3.5" />
            )}
            <span>{t("confirm")}</span>
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}

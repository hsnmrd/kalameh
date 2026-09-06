"use client"

import * as React from "react"
import { WEEK_DAYS, type WeekDay, type TermDto } from "@workspace/types"
import { DAY_TO_JS_DAY } from "@/data"

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export interface UseClassScheduleStateOptions {
  open: boolean
  term?: TermDto | null
  initialDaysOfWeek?: string[]
  initialSessionDates?: string[]
  initialStartTime?: string | null
  initialEndTime?: string | null
  onClearConflict?: () => void
}

export function useClassScheduleState({
  open,
  term,
  initialDaysOfWeek = [],
  initialSessionDates = [],
  initialStartTime = "17:00",
  initialEndTime = "18:30",
  onClearConflict,
}: UseClassScheduleStateOptions) {
  const termStartDate = term?.startDate
  const termEndDate = term?.endDate

  const computePatternKeys = React.useCallback(
    (days: WeekDay[]) => {
      if (!termStartDate || !termEndDate || days.length === 0) {
        return new Set<string>()
      }
      const start = new Date(termStartDate)
      const end = new Date(termEndDate)
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
    [termStartDate, termEndDate]
  )

  const [prevOpen, setPrevOpen] = React.useState(open)
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

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      const validDays = initialDaysOfWeek.filter((d) =>
        WEEK_DAYS.includes(d as WeekDay)
      ) as WeekDay[]
      setSelectedDays(validDays)
      if (initialSessionDates && initialSessionDates.length > 0) {
        setSessionDateKeys(new Set(initialSessionDates))
      } else {
        setSessionDateKeys(computePatternKeys(validDays))
      }
      setStartTime(initialStartTime || "17:00")
      setEndTime(initialEndTime || "18:30")
    }
  }

  React.useEffect(() => {
    if (open) {
      onClearConflict?.()
    }
  }, [open, onClearConflict])

  const toggleDay = (day: WeekDay) => {
    onClearConflict?.()
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    setSelectedDays(nextDays)
    setSessionDateKeys(computePatternKeys(nextDays))
  }

  const applyPreset = (presetDays: WeekDay[]) => {
    onClearConflict?.()
    setSelectedDays(presetDays)
    setSessionDateKeys(computePatternKeys(presetDays))
  }

  const handleDayClick = (clickedDate: Date) => {
    if (!termStartDate || !termEndDate) return
    const start = new Date(termStartDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(termEndDate)
    end.setHours(23, 59, 59, 999)
    if (clickedDate < start || clickedDate > end) return

    onClearConflict?.()
    const key = toDateKey(clickedDate)
    setSessionDateKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (!termStartDate || !termEndDate) return true
      const start = new Date(termStartDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(termEndDate)
      end.setHours(23, 59, 59, 999)
      return date < start || date > end
    },
    [termStartDate, termEndDate]
  )

  const sessionDates = React.useMemo(() => {
    const dates: Date[] = []
    for (const key of sessionDateKeys) {
      const parts = key.split("-")
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      if (y && m && d) dates.push(new Date(y, m - 1, d))
    }
    return dates.sort((a, b) => a.getTime() - b.getTime())
  }, [sessionDateKeys])

  const initialMonth = React.useMemo(() => {
    if (sessionDates[0]) return sessionDates[0]
    if (termStartDate) {
      const d = new Date(termStartDate)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  }, [sessionDates, termStartDate])

  return {
    selectedDays,
    sessionDateKeys,
    sessionDates,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    initialMonth,
    toggleDay,
    applyPreset,
    handleDayClick,
    isDateDisabled,
  }
}

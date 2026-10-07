"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { parseTimeString, formatTimeString, toPersianDigits } from "./helpers"
import { WheelColumn } from "./wheel-column"
import { WheelPicker } from "./wheel-picker"
import type { TimeWheelPickerProps, WheelItem } from "./types"

export type { TimeWheelPickerProps }

export function TimeWheelPicker({
  value,
  defaultValue,
  onChange,
  locale = "fa",
  minuteStep = 1,
  minTime,
  maxTime,
  showLabels = false,
  className,
  itemHeight = 40,
  visibleCount = 5,
}: TimeWheelPickerProps) {
  const isFa = locale === "fa"

  const parsedValue = React.useMemo(() => {
    return (
      parseTimeString(value) ||
      parseTimeString(defaultValue) || { hour: 12, minute: 0 }
    )
  }, [value, defaultValue])

  const [prevValue, setPrevValue] = React.useState(value)
  const [currentHour, setCurrentHour] = React.useState(parsedValue.hour)
  const [currentMinute, setCurrentMinute] = React.useState(parsedValue.minute)

  if (value !== prevValue) {
    setPrevValue(value)
    if (value) {
      const parsed = parseTimeString(value)
      if (parsed) {
        setCurrentHour(parsed.hour)
        setCurrentMinute(parsed.minute)
      }
    }
  }

  const parsedMin = React.useMemo(() => parseTimeString(minTime), [minTime])
  const parsedMax = React.useMemo(() => parseTimeString(maxTime), [maxTime])

  // Build hours 00-23
  const hourItems: WheelItem<number>[] = React.useMemo(() => {
    const list: WheelItem<number>[] = []
    for (let h = 0; h < 24; h++) {
      let disabled = false
      if (parsedMin && h < parsedMin.hour) disabled = true
      if (parsedMax && h > parsedMax.hour) disabled = true

      const padded = String(h).padStart(2, "0")
      list.push({
        value: h,
        label: isFa ? toPersianDigits(padded) : padded,
        disabled,
      })
    }
    return list
  }, [parsedMin, parsedMax, isFa])

  // Build minutes 00-59 with minuteStep
  const minuteItems: WheelItem<number>[] = React.useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep))
    const rawMinutes: number[] = []
    for (let m = 0; m < 60; m += step) {
      rawMinutes.push(m)
    }

    // Ensure currentMinute is present if not aligned with step
    if (!rawMinutes.includes(currentMinute)) {
      rawMinutes.push(currentMinute)
      rawMinutes.sort((a, b) => a - b)
    }

    return rawMinutes.map((m) => {
      let disabled = false
      if (parsedMin && currentHour === parsedMin.hour && m < parsedMin.minute) {
        disabled = true
      }
      if (parsedMax && currentHour === parsedMax.hour && m > parsedMax.minute) {
        disabled = true
      }

      const padded = String(m).padStart(2, "0")
      return {
        value: m,
        label: isFa ? toPersianDigits(padded) : padded,
        disabled,
      }
    })
  }, [minuteStep, currentMinute, parsedMin, parsedMax, currentHour, isFa])

  const handleHourChange = (newHour: number) => {
    setCurrentHour(newHour)
    const formatted = formatTimeString(newHour, currentMinute)
    onChange?.(formatted)
  }

  const handleMinuteChange = (newMinute: number) => {
    setCurrentMinute(newMinute)
    const formatted = formatTimeString(currentHour, newMinute)
    onChange?.(formatted)
  }

  return (
    <div
      className={cn("flex w-full flex-col items-center", className)}
      dir="ltr"
    >
      {showLabels && (
        <div className="flex w-full items-center justify-around pb-1 text-xs font-medium text-muted-foreground">
          <span className="flex-1 text-center">{isFa ? "ساعت" : "Hour"}</span>
          <span className="w-6 shrink-0 text-center select-none" />
          <span className="flex-1 text-center">
            {isFa ? "دقیقه" : "Minute"}
          </span>
        </div>
      )}

      <WheelPicker itemHeight={itemHeight} visibleCount={visibleCount}>
        <div className="min-w-0 flex-1">
          <WheelColumn
            items={hourItems}
            value={currentHour}
            onChange={handleHourChange}
            itemHeight={itemHeight}
            visibleCount={visibleCount}
            ariaLabel={isFa ? "انتخاب ساعت" : "Select hour"}
            className={isFa ? "font-sans" : "font-mono"}
          />
        </div>

        <div className="flex w-6 shrink-0 items-center justify-center">
          <span className="pb-0.5 text-2xl font-bold text-foreground/70 select-none">
            :
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <WheelColumn
            items={minuteItems}
            value={currentMinute}
            onChange={handleMinuteChange}
            itemHeight={itemHeight}
            visibleCount={visibleCount}
            ariaLabel={isFa ? "انتخاب دقیقه" : "Select minute"}
            className={isFa ? "font-sans" : "font-mono"}
          />
        </div>
      </WheelPicker>
    </div>
  )
}

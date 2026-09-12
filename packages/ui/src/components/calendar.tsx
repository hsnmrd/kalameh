"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import * as dateFns from "date-fns"
import * as dateFnsJalali from "date-fns-jalali"
import { faIR } from "date-fns-jalali/locale"
import { enUS } from "date-fns/locale"
import { isJalaliHoliday } from "@workspace/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type CalendarLocale = "fa" | "en"

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never

export type CalendarProps = DistributiveOmit<DayPickerProps, "locale"> & {
  locale?: CalendarLocale
  calendarType?: "jalali" | "gregorian"
  showOffDays?: boolean
  isOffDay?: (date: Date) => boolean
  offDays?: (Date | string)[]
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = "fa",
  calendarType,
  dir,
  showOffDays = false,
  isOffDay: customIsOffDay,
  offDays,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"
  const resolvedDir = dir || (isJalali ? "rtl" : "ltr")
  const dateLib = isJalali ? (dateFnsJalali as any) : (dateFns as any)
  const activeLocale = isJalali ? faIR : enUS

  const defaultIsOffDay = React.useCallback(
    (date: Date): boolean => {
      if (customIsOffDay) {
        return customIsOffDay(date)
      }
      if (offDays && offDays.length > 0) {
        const y = date.getFullYear()
        const m = (date.getMonth() + 1).toString().padStart(2, "0")
        const d = date.getDate().toString().padStart(2, "0")
        const dateStr = `${y}-${m}-${d}`
        return offDays.some((item) => {
          if (item instanceof Date) {
            const iy = item.getFullYear()
            const im = (item.getMonth() + 1).toString().padStart(2, "0")
            const id = item.getDate().toString().padStart(2, "0")
            return `${iy}-${im}-${id}` === dateStr
          }
          return item === dateStr || item.startsWith(dateStr)
        })
      }
      if (isJalali) {
        // Friday is weekly off-day in Iranian calendar
        if (date.getDay() === 5) return true
        // Official holidays in Iran
        return isJalaliHoliday(date).isHoliday
      }
      // In Gregorian calendar: Sunday (0) is weekly off-day
      return date.getDay() === 0
    },
    [customIsOffDay, offDays, isJalali]
  )

  const derivedDefaultMonth = React.useMemo(() => {
    if (props.defaultMonth || props.month) return undefined
    const sel = (props as any).selected
    if (!sel) return undefined
    if (sel instanceof Date && !isNaN(sel.getTime())) return sel
    if (
      Array.isArray(sel) &&
      sel[0] instanceof Date &&
      !isNaN(sel[0].getTime())
    )
      return sel[0]
    if (
      typeof sel === "object" &&
      sel.from instanceof Date &&
      !isNaN(sel.from.getTime())
    )
      return sel.from
    return undefined
  }, [props.defaultMonth, props.month, (props as any).selected])

  const combinedModifiers = React.useMemo(() => {
    const result: Record<string, any> = { ...modifiers }
    if (showOffDays) {
      result.offDay = defaultIsOffDay
    }
    return result
  }, [modifiers, showOffDays, defaultIsOffDay])

  const combinedModifiersClassNames = React.useMemo(() => {
    return {
      offDay:
        "[&>button]:!text-destructive [&>button]:font-semibold hover:[&>button]:!text-destructive hover:[&>button]:bg-destructive/10 data-[selected]:[&>button]:!bg-primary data-[selected]:[&>button]:!text-primary-foreground",
      ...modifiersClassNames,
    }
  }, [modifiersClassNames])

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      dir={resolvedDir}
      dateLib={dateLib}
      locale={activeLocale}
      defaultMonth={props.defaultMonth ?? derivedDefaultMonth}
      modifiers={combinedModifiers}
      modifiersClassNames={combinedModifiersClassNames}
      className={cn(
        "relative rounded-2xl border border-border bg-card p-4",
        className
      )}
      classNames={{
        months:
          "relative flex flex-col sm:flex-row gap-4 justify-center items-center",
        month: "relative flex flex-col gap-3 items-center w-full",
        month_caption: "relative flex h-8 items-center justify-center px-8",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center justify-between absolute inset-x-0 top-0.5 z-10 w-full pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" }),
          "pointer-events-auto size-7 rounded-lg border-border bg-card/80 p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" }),
          "pointer-events-auto size-7 rounded-lg border-border bg-card/80 p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        ),
        month_grid: "w-full border-separate border-spacing-y-1",
        weekdays: "grid grid-cols-7 gap-1 w-full justify-items-center mb-1",
        weekday:
          "size-9 rounded-xl font-medium text-xs text-muted-foreground flex items-center justify-center select-none",
        weeks: "flex flex-col gap-1 w-full",
        week: "grid grid-cols-7 gap-1 w-full justify-items-center",
        day: "relative p-0 flex items-center justify-center size-9 text-center text-sm rounded-xl focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "aspect-square size-9 rounded-xl p-0 text-sm font-medium transition-all select-none",
          "hover:bg-muted hover:text-foreground active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        ),
        selected:
          "!bg-primary !text-primary-foreground rounded-xl font-semibold shadow-xs hover:!bg-primary hover:!text-primary-foreground",
        today: "border border-primary/50 text-foreground font-bold rounded-xl",
        outside: "text-muted-foreground/35 opacity-40 hover:opacity-100",
        disabled:
          "text-muted-foreground/30 opacity-30 cursor-not-allowed pointer-events-none bg-muted/20 rounded-xl",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return resolvedDir === "rtl" ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )
          }
          return resolvedDir === "rtl" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )
        },
      }}
      {...(props as any)}
    />
  )
}

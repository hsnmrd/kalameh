"use client"

import * as React from "react"
import {
  DayPicker,
  DayButton,
  type DayPickerProps,
  type DayButtonProps,
} from "react-day-picker"
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
  observeOfficialHolidays?: boolean
  isOffDay?: (date: Date) => boolean
  offDays?: (Date | string)[]
  dismissedHolidays?: (Date | string)[]
  compact?: boolean
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = "fa",
  calendarType,
  dir,
  showOffDays = false,
  observeOfficialHolidays = true,
  isOffDay: customIsOffDay,
  offDays,
  dismissedHolidays,
  compact = false,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"
  const resolvedDir = dir || (isJalali ? "rtl" : "ltr")
  const dateLib = isJalali ? (dateFnsJalali as any) : (dateFns as any)
  const activeLocale = isJalali ? faIR : enUS

  const isCustomOffDay = React.useCallback(
    (date: Date): boolean => {
      if (!offDays || offDays.length === 0) return false
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
    },
    [offDays]
  )

  const isDismissedHoliday = React.useCallback(
    (date: Date): boolean => {
      if (!dismissedHolidays || dismissedHolidays.length === 0) return false
      const y = date.getFullYear()
      const m = (date.getMonth() + 1).toString().padStart(2, "0")
      const d = date.getDate().toString().padStart(2, "0")
      const dateStr = `${y}-${m}-${d}`
      return dismissedHolidays.some((item) => {
        if (item instanceof Date) {
          const iy = item.getFullYear()
          const im = (item.getMonth() + 1).toString().padStart(2, "0")
          const id = item.getDate().toString().padStart(2, "0")
          return `${iy}-${im}-${id}` === dateStr
        }
        return item === dateStr || item.startsWith(dateStr)
      })
    },
    [dismissedHolidays]
  )

  const isOfficialHoliday = React.useCallback(
    (date: Date): boolean => {
      if (!observeOfficialHolidays) return false
      if (!isJalali) return false
      if (isDismissedHoliday(date)) return false
      return isJalaliHoliday(date).isHoliday
    },
    [observeOfficialHolidays, isJalali, isDismissedHoliday]
  )

  const isWeeklyOffDay = React.useCallback(
    (date: Date): boolean => {
      if (isJalali) {
        return date.getDay() === 5 // Friday
      }
      return date.getDay() === 0 // Sunday
    },
    [isJalali]
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
      // 1. Official holidays: red text + small red dot below day number
      result.holiday = (date: Date) => {
        return isOfficialHoliday(date)
      }
      // 2. Custom institute off-days: orange/warning text + small orange dot below day number
      result.customOffDay = (date: Date) => {
        return isCustomOffDay(date) && !isOfficialHoliday(date)
      }
      // 3. Off days (weekly off-days like Friday that are NOT holidays): red text, no dot
      result.offDay = (date: Date) => {
        if (customIsOffDay) {
          return customIsOffDay(date)
        }
        if (isOfficialHoliday(date) || isCustomOffDay(date)) {
          return false
        }
        return isWeeklyOffDay(date)
      }
      // 4. Dismissed holidays (official holidays marked open by institute): green dot
      result.dismissedHoliday = (date: Date) => {
        return isDismissedHoliday(date)
      }
    }
    return result
  }, [
    modifiers,
    showOffDays,
    isOfficialHoliday,
    isCustomOffDay,
    isDismissedHoliday,
    customIsOffDay,
    isWeeklyOffDay,
  ])

  const combinedModifiersClassNames = React.useMemo(() => {
    return {
      offDay:
        "[&>button]:!text-destructive [&>button]:font-semibold hover:[&>button]:!text-destructive hover:[&>button]:bg-destructive/10 data-[selected]:[&>button]:!bg-primary data-[selected]:[&>button]:!text-primary-foreground",
      holiday:
        "[&>button]:!text-destructive [&>button]:font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/10 data-[selected]:[&>button]:!bg-primary data-[selected]:[&>button]:!text-primary-foreground data-[selected]:[&>button]:after:!bg-primary-foreground",
      customOffDay:
        "[&>button]:!text-warning [&>button]:font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning hover:[&>button]:!bg-warning/10 data-[selected]:[&>button]:!bg-primary data-[selected]:[&>button]:!text-primary-foreground data-[selected]:[&>button]:after:!bg-primary-foreground",
      dismissedHoliday:
        "[&>button]:!text-success [&>button]:font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-success hover:[&>button]:!bg-success/10 data-[selected]:[&>button]:!bg-primary data-[selected]:[&>button]:!text-primary-foreground data-[selected]:[&>button]:after:!bg-primary-foreground",
      ...modifiersClassNames,
    }
  }, [modifiersClassNames])

  const getHolidayTitle = React.useCallback(
    (date: Date): string | undefined => {
      if (!showOffDays) return undefined
      if (isJalali) {
        const holidayInfo = isJalaliHoliday(date)
        if (holidayInfo.isHoliday && holidayInfo.holiday) {
          const baseTitle =
            activeLocale === faIR
              ? holidayInfo.holiday.titleFa
              : holidayInfo.holiday.titleEn
          if (isDismissedHoliday(date)) {
            return `${baseTitle} (${activeLocale === faIR ? "دایر در موسسه" : "Open in institute"})`
          }
          return `${baseTitle} (${activeLocale === faIR ? "تعطیل رسمی" : "Official Holiday"})`
        }
      }
      if (isCustomOffDay(date)) {
        return activeLocale === faIR
          ? "تعطیلی اختصاصی موسسه"
          : "Custom Institute Off-Day"
      }
      return undefined
    },
    [showOffDays, isJalali, activeLocale, isDismissedHoliday, isCustomOffDay]
  )

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
        "relative border border-border bg-card",
        compact ? "rounded-xl p-3" : "rounded-2xl p-4",
        className
      )}
      classNames={{
        months:
          "relative flex flex-col sm:flex-row gap-4 justify-center items-center",
        month: "relative flex flex-col gap-3 items-center w-full",
        month_caption: compact
          ? "relative flex h-7 items-center justify-center px-2"
          : "relative flex h-8 items-center justify-center px-8",
        caption_label: compact
          ? "text-xs font-semibold text-foreground"
          : "text-sm font-semibold text-foreground",
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
        weekday: compact
          ? "size-8 rounded-lg font-medium text-xs text-muted-foreground flex items-center justify-center select-none"
          : "size-9 rounded-xl font-medium text-xs text-muted-foreground flex items-center justify-center select-none",
        weeks: "flex flex-col gap-1 w-full",
        week: "grid grid-cols-7 gap-1 w-full justify-items-center",
        day: compact
          ? "relative p-0 flex items-center justify-center size-8 text-center text-xs rounded-lg focus-within:relative focus-within:z-20"
          : "relative p-0 flex items-center justify-center size-9 text-center text-sm rounded-xl focus-within:relative focus-within:z-20",
        day_button: compact
          ? cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "aspect-square size-8 min-w-0 rounded-lg p-0 text-xs font-medium transition-all select-none",
              "hover:bg-muted hover:text-foreground active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            )
          : cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "aspect-square size-9 min-w-0 rounded-xl p-0 text-sm font-medium transition-all select-none",
              "hover:bg-muted hover:text-foreground active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            ),
        selected:
          "!bg-primary !text-primary-foreground rounded-xl font-semibold shadow-xs hover:!bg-primary hover:!text-primary-foreground",
        range_start:
          "!bg-primary !text-primary-foreground rounded-s-xl rounded-e-none font-semibold shadow-xs hover:!bg-primary hover:!text-primary-foreground",
        range_end:
          "!bg-primary !text-primary-foreground rounded-e-xl rounded-s-none font-semibold shadow-xs hover:!bg-primary hover:!text-primary-foreground",
        range_middle:
          "!bg-primary/15 !text-primary rounded-none font-medium hover:!bg-primary/25 [&>button]:!bg-transparent [&>button]:!text-primary [&>button]:!rounded-none",
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
        DayButton: (dayButtonProps: DayButtonProps) => {
          const holidayTitle = getHolidayTitle(dayButtonProps.day.date)
          return (
            <DayButton
              {...dayButtonProps}
              title={holidayTitle || dayButtonProps.title}
            />
          )
        },
      }}
      {...(props as any)}
    />
  )
}

"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import * as dateFns from "date-fns"
import * as dateFnsJalali from "date-fns-jalali"
import { faIR } from "date-fns-jalali/locale"
import { enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export type CalendarLocale = "fa" | "en"

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never

export type CalendarProps = DistributiveOmit<DayPickerProps, "locale"> & {
  locale?: CalendarLocale
  calendarType?: "jalali" | "gregorian"
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = "fa",
  calendarType,
  dir,
  ...props
}: CalendarProps) {
  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"
  const resolvedDir = dir || (isJalali ? "rtl" : "ltr")
  const dateLib = isJalali ? (dateFnsJalali as any) : (dateFns as any)
  const activeLocale = isJalali ? faIR : enUS

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      dir={resolvedDir}
      dateLib={dateLib}
      locale={activeLocale}
      className={cn("rounded-2xl border border-border bg-card p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        month_caption: "relative flex items-center justify-center pt-1 px-8",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute start-1 top-1 flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        ),
        button_next: cn(
          "absolute end-1 top-1 flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent p-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between",
        weekday:
          "text-muted-foreground rounded-lg size-9 font-medium text-xs flex items-center justify-center select-none",
        weeks: "flex flex-col gap-1 mt-1.5",
        week: "flex w-full justify-between",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "flex size-9 cursor-pointer items-center justify-center rounded-xl p-0 font-normal transition-colors select-none",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        ),
        selected:
          "!bg-primary !text-primary-foreground font-semibold hover:!bg-primary hover:!text-primary-foreground",
        today: "bg-muted font-bold text-foreground ring-1 ring-border",
        outside: "text-muted-foreground",
        disabled:
          "text-muted-foreground/30 opacity-30 cursor-not-allowed pointer-events-none",
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

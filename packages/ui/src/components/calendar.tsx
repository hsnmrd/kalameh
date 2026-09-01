"use client"

import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import * as dateFns from "date-fns"
import * as dateFnsJalali from "date-fns-jalali"
import { faIR } from "date-fns-jalali/locale"
import { enUS } from "date-fns/locale"
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
      className={cn(
        "relative rounded-2xl border border-border bg-card p-4",
        className
      )}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "relative flex flex-col gap-3",
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
        month_grid: "w-full border-collapse space-y-1",
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

"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calendar } from "@workspace/ui/components/calendar"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import {
  gregorianToJalali,
  jalaliToGregorian,
  isJalaliHoliday,
  type TermDto,
  type ClassDto,
} from "@workspace/types"
import {
  getTermsRunningInMonth,
  isDateClassSession,
  getTermTheme,
  buildCalendarTermModifiers,
  normalizeIsoDate,
} from "../../../../../helper"

export interface MonthCardProps {
  monthDate: Date
  locale: "fa" | "en"
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays?: string[]
  onDayClick: (date: Date) => void
  isCurrentMonth: boolean
  terms?: TermDto[]
  classes?: ClassDto[]
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  const rem = year % 33
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(rem)
  return isLeap ? 30 : 29
}

export function MonthCard({
  monthDate,
  locale,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays = [],
  onDayClick,
  isCurrentMonth,
  terms = [],
  classes = [],
}: MonthCardProps) {
  const t = useTranslations("setting.offDays")

  // Count total off-days in this month
  const offDaysCount = React.useMemo(() => {
    let count = 0
    const dismissedSet = new Set(dismissedHolidays)
    const customSet = new Set(customOffDays)

    if (locale === "fa") {
      const { year, month } = gregorianToJalali(monthDate)
      const daysCount = getDaysInJalaliMonth(year, month)
      for (let day = 1; day <= daysCount; day++) {
        const d = jalaliToGregorian(year, month, day)
        const iso = toIsoDate(d)
        const holidayCheck = isJalaliHoliday(d)

        const isOff =
          (observeOfficialHolidays &&
            holidayCheck.isHoliday &&
            !dismissedSet.has(iso)) ||
          customSet.has(iso)

        if (isOff) {
          count++
        }
      }
    } else {
      const y = monthDate.getFullYear()
      const m = monthDate.getMonth()
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(y, m, day)
        const iso = toIsoDate(d)
        if (customSet.has(iso)) {
          count++
        }
      }
    }
    return count
  }, [
    monthDate,
    locale,
    observeOfficialHolidays,
    dismissedHolidays,
    customOffDays,
  ])

  // Count terms running in this month
  const termsInMonth = React.useMemo(
    () => getTermsRunningInMonth(monthDate, locale, terms),
    [monthDate, locale, terms]
  )

  const termModifiers = React.useMemo(
    () => buildCalendarTermModifiers(termsInMonth, terms),
    [termsInMonth, terms]
  )

  const isSessionDate = React.useCallback(
    (date: Date) => isDateClassSession(date, classes),
    [classes]
  )

  const formatCaption = React.useCallback(
    (d: Date) => {
      return new Intl.DateTimeFormat(
        locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
        { month: "long" }
      ).format(d)
    },
    [locale]
  )

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card p-2.5 transition-shadow hover:shadow-xs",
        isCurrentMonth &&
          "border-primary/60 bg-primary/[0.02] ring-1 ring-primary/40"
      )}
    >
      {/* Month Card Header Badges */}
      <div className="flex items-center justify-between gap-1 px-2 pt-1 pb-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {isCurrentMonth ? (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary"
            >
              {t("currentMonth")}
            </Badge>
          ) : null}
          {termsInMonth.map((term) => {
            const theme = getTermTheme(term.id, terms)
            return (
              <Badge
                key={term.id}
                variant="outline"
                title={`${term.title} (${normalizeIsoDate(term.startDate)} - ${normalizeIsoDate(term.endDate)})`}
                className={cn(
                  "max-w-[96px] gap-1 truncate px-1.5 py-0 text-[10px] font-medium",
                  theme.badgeBg,
                  theme.badgeText,
                  theme.badgeBorder
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full shadow-2xs",
                    theme.dotColor
                  )}
                />
                <span className="truncate">{term.title}</span>
              </Badge>
            )
          })}
        </div>

        {offDaysCount > 0 ? (
          <Badge
            variant="outline"
            className="shrink-0 border-warning/40 bg-warning/10 px-1.5 py-0 text-[10px] font-medium text-warning"
          >
            {locale === "fa"
              ? `${formatNumber(offDaysCount, "fa-IR")} روز تعطیل`
              : t("holidaysCount", { count: offDaysCount })}
          </Badge>
        ) : null}
      </div>

      {/* Embedded Compact Calendar */}
      <Calendar
        locale={locale}
        month={monthDate}
        compact={true}
        hideNavigation={true}
        showOutsideDays={false}
        onDayClick={onDayClick}
        showOffDays={true}
        observeOfficialHolidays={observeOfficialHolidays}
        offDays={customOffDays}
        dismissedHolidays={dismissedHolidays}
        modifiers={{
          sessionDay: isSessionDate,
          ...termModifiers.modifiers,
        }}
        modifiersClassNames={{
          sessionDay:
            "[&>button]:ring-1.5 [&>button]:ring-foreground/50 font-semibold",
          ...termModifiers.modifiersClassNames,
        }}
        formatters={{
          formatCaption,
        }}
        className="w-full border-none bg-transparent p-1 shadow-none"
      />
    </div>
  )
}

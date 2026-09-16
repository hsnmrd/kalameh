"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import {
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  Trash2,
  Play,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerCloseButton,
} from "@workspace/ui/components/drawer"
import {
  gregorianToJalali,
  isJalaliHoliday,
  type GeneratedTermProposal,
  type CompensatorySession,
} from "@workspace/types"
import { normalizeDateToYmd } from "../../helper/calendar-colors"

export interface DayActionsPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorEl: HTMLElement | null
  date: Date | null
  termProposal?: GeneratedTermProposal
  selectedTermIndex: number
  proposals: GeneratedTermProposal[]
  onSetStartDate: (termIndex: number, dateYmd: string) => void
  onToggleHoliday: (dateYmd: string) => void
  onOpenCompensatoryModal: (termIndex: number, dateYmd: string) => void
  onRemoveCompensatorySession: (termIndex: number, dateYmd: string) => void
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  activeDismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
}

const FA_WEEKDAY_NAMES = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
]

const FA_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
]

export function DayActionsPopover({
  open,
  onOpenChange,
  anchorEl,
  date,
  termProposal,
  selectedTermIndex,
  proposals,
  onSetStartDate,
  onToggleHoliday,
  onOpenCompensatoryModal,
  onRemoveCompensatorySession,
  locale = "fa",
  observeOfficialHolidays = true,
  customOffDays = [],
  activeDismissedHolidays = [],
  compensatorySessions = {},
}: DayActionsPopoverProps) {
  const t = useTranslations("terms")
  const isMobile = useIsMobile()

  const resolvedAnchor = React.useCallback(() => {
    if (anchorEl && anchorEl.isConnected) {
      return anchorEl
    }
    if (typeof document !== "undefined" && date) {
      const ymdStr = normalizeDateToYmd(date)
      // 1. Gregorian date match
      const cell = document.querySelector(`[data-day="${ymdStr}"]`)
      const btn = (
        cell?.matches("button") ? cell : cell?.querySelector("button")
      ) as HTMLElement | null
      if (btn && btn.isConnected) return btn

      // 2. Jalali date match
      const jDate = gregorianToJalali(date)
      const jy = jDate.year.toString()
      const jm = jDate.month.toString().padStart(2, "0")
      const jd = jDate.day.toString().padStart(2, "0")
      const jalaliYmd = `${jy}-${jm}-${jd}`
      const jCell = document.querySelector(`[data-day="${jalaliYmd}"]`)
      const jBtn = (
        jCell?.matches("button") ? jCell : jCell?.querySelector("button")
      ) as HTMLElement | null
      if (jBtn && jBtn.isConnected) return jBtn
    }
    return anchorEl
  }, [anchorEl, date])

  if (!date) return null

  const ymd = normalizeDateToYmd(date)
  const isRtl = locale === "fa"

  // Date formatting
  const j = gregorianToJalali(date)
  const weekdayName = isRtl
    ? FA_WEEKDAY_NAMES[date.getDay()]
    : date.toLocaleDateString("en-US", { weekday: "long" })
  const monthName = isRtl
    ? FA_MONTH_NAMES[j.month - 1]
    : date.toLocaleDateString("en-US", { month: "long" })
  const dateFormatted = isRtl
    ? `${weekdayName}، ${j.day} ${monthName} ${j.year}`
    : `${weekdayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`

  // Holiday checks
  const holidayInfo = isJalaliHoliday(date)
  const isOfficialHoliday = observeOfficialHolidays && holidayInfo.isHoliday
  const isCustomOff = customOffDays.includes(ymd)
  const isDismissed = activeDismissedHolidays.includes(ymd)
  const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
  const isHolidayActive = (isOfficialHoliday && !isDismissed) || isCustomOff

  // Existing compensatory session check
  const allCompensatory = Object.entries(compensatorySessions).flatMap(
    ([tIdx, list]) =>
      (list ?? []).map((cs) => ({ ...cs, termIndex: Number(tIdx) }))
  )
  const currentCompensatory = allCompensatory.find((cs) => cs.date === ymd)
  const hasCompensatory = currentCompensatory !== undefined

  // Can set as start date check:
  // Cannot start on a Friday or an active holiday.
  // For subsequent terms (index > 0), cannot start on or before the previous term's end date.
  let canSetStart = !isHolidayActive && !isFriday
  if (selectedTermIndex > 0) {
    const prevTerm = proposals[selectedTermIndex - 1]
    if (prevTerm) {
      const prevEndYmd = normalizeDateToYmd(prevTerm.endDate)
      if (ymd <= prevEndYmd) {
        canSetStart = false
      }
    }
  }

  // Can add compensatory session check:
  // Only show on Fridays and official holidays that have not been dismissed.
  // Regular term days must NOT show the option to add a compensatory session.
  const isEligibleForCompensatory =
    isFriday || (isOfficialHoliday && !isDismissed)
  const canShowCompensatory = hasCompensatory || isEligibleForCompensatory

  let canAddCompensatory = isEligibleForCompensatory && !hasCompensatory
  if (termProposal?.startDate) {
    const termStartYmd = normalizeDateToYmd(termProposal.startDate)
    if (ymd < termStartYmd) {
      canAddCompensatory = false
    }
  }

  const holidayTitle = isOfficialHoliday
    ? isRtl
      ? holidayInfo.holiday?.titleFa
      : holidayInfo.holiday?.titleEn
    : isCustomOff
      ? isRtl
        ? "تعطیلی اختصاصی موسسه"
        : "Institute Off-Day"
      : undefined

  const renderContent = () => (
    <div className="flex flex-col gap-3.5">
      {/* Date header & status badges */}
      <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
        <span className="text-sm font-semibold text-foreground">
          {dateFormatted}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {isOfficialHoliday && !isDismissed && (
            <span className="inline-flex items-center rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
              {t("batchModal.statusOfficialHoliday", {
                title: holidayTitle || "",
              })}
            </span>
          )}
          {isOfficialHoliday && isDismissed && (
            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {t("batchModal.statusDismissedHoliday")}
            </span>
          )}
          {isCustomOff && (
            <span className="inline-flex items-center rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              {t("batchModal.statusCustomOff", {
                title: holidayTitle || "",
              })}
            </span>
          )}
          {isFriday && !isOfficialHoliday && !isCustomOff && (
            <span className="inline-flex items-center rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
              {t("batchModal.statusFriday")}
            </span>
          )}
          {hasCompensatory && (
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {t("batchModal.statusCompensatory", {
                track:
                  currentCompensatory.patternTrack === "EVEN"
                    ? t("batchModal.patternSelectEven")
                    : t("batchModal.patternSelectOdd"),
              })}
            </span>
          )}
          {!isOfficialHoliday &&
            !isCustomOff &&
            !isFriday &&
            !hasCompensatory && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t("batchModal.statusRegularDay")}
              </span>
            )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Action 1: Set Term Start Date */}
        <Button
          type="button"
          variant="outline"
          disabled={!canSetStart}
          onClick={() => {
            onSetStartDate(selectedTermIndex, ymd)
            onOpenChange(false)
          }}
          className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
        >
          <Play className="size-4 text-foreground" />
          <span>
            {t("batchModal.actionSetStart")}{" "}
            {termProposal?.title ? `(${termProposal.title})` : ""}
          </span>
        </Button>

        {/* Action 2: Dismiss or Restore Holiday */}
        {isOfficialHoliday && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onToggleHoliday(ymd)
              onOpenChange(false)
            }}
            className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
          >
            {isDismissed ? (
              <>
                <CalendarCheck className="size-4 text-foreground" />
                <span>{t("batchModal.actionRestoreHoliday")}</span>
              </>
            ) : (
              <>
                <CalendarX className="size-4 text-foreground" />
                <span>{t("batchModal.actionDismissHoliday")}</span>
              </>
            )}
          </Button>
        )}

        {/* Action 3: Compensatory Session */}
        {canShowCompensatory &&
          (hasCompensatory ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (currentCompensatory) {
                  onRemoveCompensatorySession(
                    currentCompensatory.termIndex,
                    ymd
                  )
                }
                onOpenChange(false)
              }}
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4 text-destructive" />
              <span>{t("batchModal.actionRemoveCompensatory")}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={!canAddCompensatory}
              onClick={() => {
                onOpenChange(false)
                onOpenCompensatoryModal(selectedTermIndex, ymd)
              }}
              className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
            >
              <CalendarPlus className="size-4 text-foreground" />
              <span>{t("batchModal.actionAddCompensatory")}</span>
            </Button>
          ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="p-4">
          <DrawerHeader className="p-0 pb-2">
            <DrawerTitle className="text-sm font-semibold">
              {t("batchModal.dayActionsTitle", { date: j.day })}
            </DrawerTitle>
            <DrawerCloseButton />
          </DrawerHeader>
          <div className="pt-2">{renderContent()}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent
        anchor={resolvedAnchor}
        side="bottom"
        align="center"
        sideOffset={6}
        className="w-80 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
      >
        {renderContent()}
      </PopoverContent>
    </Popover>
  )
}

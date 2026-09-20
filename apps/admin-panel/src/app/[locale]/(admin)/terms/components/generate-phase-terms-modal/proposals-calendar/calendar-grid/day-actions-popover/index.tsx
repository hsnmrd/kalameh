"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import {
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarOff,
  Trash2,
  Play,
  Star,
  Info,
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
import {
  normalizeDateToYmd,
  getTermExamDates,
} from "../../helper/calendar-colors"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface DayActionsPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorEl: HTMLElement | null
  date: Date | null
  termProposal?: GeneratedTermProposal
  selectedTermIndex: number
  proposals: GeneratedTermProposal[]
  onSetStartDate?: (termIndex: number, dateYmd: string) => void
  onToggleHoliday?: (dateYmd: string) => void
  onToggleCustomOffDay?: (dateYmd: string) => void
  onOpenCompensatoryModal?: (
    termIndex: number,
    dateYmd: string,
    defaultTrack?: "ODD" | "EVEN"
  ) => void
  onRemoveCompensatorySession?: (termIndex: number, dateYmd: string) => void
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  activeDismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
  lockedTermIndex?: number
  readOnly?: boolean
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
  onSetStartDate = () => {},
  onToggleHoliday = () => {},
  onToggleCustomOffDay,
  onOpenCompensatoryModal = () => {},
  onRemoveCompensatorySession = () => {},
  locale = "fa",
  observeOfficialHolidays = true,
  customOffDays = [],
  activeDismissedHolidays = [],
  compensatorySessions = {},
  lockedTermIndex,
  readOnly = false,
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

  const activeTermIndex =
    lockedTermIndex !== undefined ? lockedTermIndex : selectedTermIndex
  const activeProposal = proposals[activeTermIndex] ?? termProposal

  // Check if clicked date falls inside any term in proposals
  const clickedTermIndex = proposals.findIndex((p) => {
    if (!p.startDate || !p.endDate) return false
    const s = normalizeDateToYmd(p.startDate)
    const e = normalizeDateToYmd(p.endDate)
    return ymd >= s && ymd <= e
  })
  const clickedProposal =
    clickedTermIndex !== -1 ? proposals[clickedTermIndex] : undefined
  const isBelongingToOtherTerm =
    lockedTermIndex !== undefined &&
    clickedTermIndex !== -1 &&
    clickedTermIndex !== lockedTermIndex

  // Check if clicked date is the start date of the active proposal or any proposal
  const isCurrentTermStart =
    activeProposal?.startDate !== undefined &&
    normalizeDateToYmd(activeProposal.startDate) === ymd

  const isAnyTermStart = proposals.some(
    (p) => p.startDate && normalizeDateToYmd(p.startDate) === ymd
  )

  const isStartDate = isCurrentTermStart || isAnyTermStart

  // Can set as start date check:
  // Cannot start on a Friday, an active holiday, inside another term, or if already a start date.
  // For subsequent terms (index > 0), cannot start on or before the previous term's end date.
  // Cannot start on or after the next term's start date (if next term exists).
  let canSetStart =
    !isHolidayActive && !isFriday && !isBelongingToOtherTerm && !isStartDate
  if (activeTermIndex > 0) {
    const prevTerm = proposals[activeTermIndex - 1]
    if (prevTerm && prevTerm.endDate) {
      const prevEndYmd = normalizeDateToYmd(prevTerm.endDate)
      if (ymd <= prevEndYmd) {
        canSetStart = false
      }
    }
  }
  if (activeTermIndex < proposals.length - 1) {
    const nextTerm = proposals[activeTermIndex + 1]
    if (nextTerm && nextTerm.startDate) {
      const nextStartYmd = normalizeDateToYmd(nextTerm.startDate)
      if (ymd >= nextStartYmd) {
        canSetStart = false
      }
    }
  }

  // Excess session check:
  // If this date is an excess date for a pattern in this proposal
  const excessPattern = activeProposal?.patternDetails?.find((p) =>
    p.excessDates?.includes(ymd)
  )
  const isExcessSessionDay = excessPattern !== undefined
  const excessSessionNum =
    excessPattern && excessPattern.sessionDates
      ? excessPattern.sessionDates.indexOf(ymd) + 1
      : undefined
  const oppositeTrack: "ODD" | "EVEN" =
    excessPattern?.track === "EVEN" ? "ODD" : "EVEN"

  // Can add compensatory session check:
  // Only show on Fridays, official holidays that have not been dismissed, or excess session days.
  // Regular term days must NOT show the option to add a compensatory session unless they are excess session days.
  const isEligibleForCompensatory =
    isFriday ||
    (isOfficialHoliday && !isDismissed) ||
    isCustomOff ||
    isExcessSessionDay
  const canShowCompensatory =
    !isBelongingToOtherTerm && (hasCompensatory || isEligibleForCompensatory)

  let canAddCompensatory = isEligibleForCompensatory && !hasCompensatory
  if (activeProposal?.startDate) {
    const termStartYmd = normalizeDateToYmd(activeProposal.startDate)
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

  // Exam session check (final two sessions of the term)
  const { evenDate, oddDate, examDates } = activeProposal
    ? getTermExamDates(activeProposal)
    : { evenDate: undefined, oddDate: undefined, examDates: [] }
  const isExamDay = examDates.includes(ymd)
  const isEvenExam = evenDate === ymd
  const isOddExam = oddDate === ymd

  const isCurrentTermEnd =
    activeProposal?.endDate !== undefined &&
    normalizeDateToYmd(activeProposal.endDate) === ymd

  const isEvenSession = Boolean(
    activeProposal?.patternDetails
      ?.find((p) => p.track === "EVEN")
      ?.sessionDates?.includes(ymd)
  )
  const isOddSession = Boolean(
    activeProposal?.patternDetails
      ?.find((p) => p.track === "ODD")
      ?.sessionDates?.includes(ymd)
  )
  const isTermSessionDay = isEvenSession || isOddSession

  const hasActions =
    !readOnly &&
    (!isStartDate ||
      isOfficialHoliday ||
      (!isOfficialHoliday && Boolean(onToggleCustomOffDay)) ||
      canShowCompensatory)

  const renderContent = () => (
    <div className="flex flex-col gap-3.5">
      {/* Date header & status badges */}
      <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
        <span className="text-sm font-semibold text-foreground">
          {dateFormatted}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {isBelongingToOtherTerm && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {t("batchModal.statusReferenceTerm", {
                title: clickedProposal?.title || "",
              })}
            </span>
          )}
          {isCurrentTermStart && (
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {t("batchModal.statusTermStart")}
            </span>
          )}
          {isCurrentTermEnd && (
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {t("batchModal.statusTermEnd")}
            </span>
          )}
          {isOfficialHoliday && !isDismissed && (
            <span className="inline-flex items-center rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
              {t("batchModal.statusOfficialHoliday", {
                title: holidayTitle || "",
              })}
            </span>
          )}
          {isOfficialHoliday && isDismissed && (
            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {t("batchModal.statusDismissedHoliday", {
                title: holidayTitle || "",
              })}
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
                    ? t("batchModal.patternEvenShort")
                    : t("batchModal.patternOddShort"),
              })}
            </span>
          )}
          {isExcessSessionDay && !hasCompensatory && (
            <span className="inline-flex items-center rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              {t("batchModal.statusExcessSession", {
                track:
                  excessPattern?.track === "EVEN"
                    ? t("batchModal.patternEvenShort")
                    : t("batchModal.patternOddShort"),
                num: formatNumber(excessSessionNum ?? 0, locale),
                target: formatNumber(
                  excessPattern?.targetSessions ?? 18,
                  locale
                ),
              })}
            </span>
          )}
          {isExamDay && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              <Star className="size-3 fill-warning text-warning" />
              <span>
                {isEvenExam
                  ? t("batchModal.statusEvenExamSession")
                  : isOddExam
                    ? t("batchModal.statusOddExamSession")
                    : t("batchModal.statusExamSession")}
              </span>
            </span>
          )}
          {isTermSessionDay &&
            !isCurrentTermStart &&
            !isCurrentTermEnd &&
            !isExamDay &&
            !isExcessSessionDay &&
            !hasCompensatory && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-foreground">
                {isEvenSession
                  ? t("batchModal.patternEvenShort")
                  : t("batchModal.patternOddShort")}
              </span>
            )}
          {!isOfficialHoliday &&
            !isCustomOff &&
            !isFriday &&
            !hasCompensatory &&
            !isExcessSessionDay &&
            !isExamDay &&
            !isBelongingToOtherTerm &&
            !isCurrentTermStart &&
            !isCurrentTermEnd &&
            !isTermSessionDay && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t("batchModal.statusRegularDay")}
              </span>
            )}
        </div>
      </div>

      {/* Action Buttons */}
      {readOnly ? null : isBelongingToOtherTerm ? (
        <div className="flex items-center gap-2 rounded-xl border border-muted-foreground/20 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {t("batchModal.referenceTermNotice", {
              title: clickedProposal?.title || "",
            })}
          </span>
        </div>
      ) : hasActions ? (
        <div className="flex flex-col gap-2">
          {/* Action 1: Set Term Start Date */}
          {!isStartDate && (
            <Button
              type="button"
              variant="outline"
              disabled={!canSetStart}
              onClick={() => {
                onSetStartDate(activeTermIndex, ymd)
                onOpenChange(false)
              }}
              className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
            >
              <Play className="size-4 text-foreground" />
              <span>
                {t("batchModal.actionSetStart")}{" "}
                {activeProposal?.title ? `(${activeProposal.title})` : ""}
              </span>
            </Button>
          )}

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

          {/* Action 2b: Add to or Remove from Institute Off-Days */}
          {!isOfficialHoliday && onToggleCustomOffDay && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onToggleCustomOffDay(ymd)
                onOpenChange(false)
              }}
              className={cn(
                "h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium",
                isCustomOff &&
                  "border-destructive/30 text-destructive hover:bg-destructive/10"
              )}
            >
              {isCustomOff ? (
                <>
                  <Trash2 className="size-4 text-destructive" />
                  <span>{t("batchModal.actionRemoveCustomOffDay")}</span>
                </>
              ) : (
                <>
                  <CalendarOff className="size-4 text-foreground" />
                  <span>{t("batchModal.actionAddCustomOffDay")}</span>
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
                  onOpenCompensatoryModal(
                    activeTermIndex,
                    ymd,
                    isExcessSessionDay ? oppositeTrack : undefined
                  )
                }}
                className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
              >
                <CalendarPlus className="size-4 text-foreground" />
                <span className="truncate">
                  {isExcessSessionDay
                    ? t("batchModal.actionAddCompensatoryForOpposite", {
                        track:
                          oppositeTrack === "EVEN"
                            ? t("batchModal.patternEvenShort")
                            : t("batchModal.patternOddShort"),
                      })
                    : t("batchModal.actionAddCompensatory")}
                </span>
              </Button>
            ))}
        </div>
      ) : null}
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

"use client"

import { gregorianToJalali, isJalaliHoliday } from "@workspace/types"
import {
  getTermExamDates,
  normalizeDateToYmd,
} from "../../../helper/calendar-colors"
import type { DayActionsPopoverProps } from "../types"

const FA_WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
]
const FA_MONTHS = [
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

export function useDayActionsState(props: DayActionsPopoverProps) {
  const date = props.date ?? new Date(0)
  const locale = props.locale ?? "fa"
  const isRtl = locale === "fa"
  const ymd = normalizeDateToYmd(date)
  const jalaliDate = gregorianToJalali(date)
  const weekday = isRtl
    ? FA_WEEKDAYS[date.getDay()]
    : date.toLocaleDateString("en-US", { weekday: "long" })
  const month = isRtl
    ? FA_MONTHS[jalaliDate.month - 1]
    : date.toLocaleDateString("en-US", { month: "long" })
  const dateFormatted = isRtl
    ? `${weekday}، ${jalaliDate.day} ${month} ${jalaliDate.year}`
    : `${weekday}, ${date.getDate()} ${month} ${date.getFullYear()}`
  const holidayInfo = isJalaliHoliday(date)
  const isOfficialHoliday =
    (props.observeOfficialHolidays ?? true) && holidayInfo.isHoliday
  const isCustomOff = (props.customOffDays ?? []).includes(ymd)
  const isDismissed = (props.activeDismissedHolidays ?? []).includes(ymd)
  const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
  const allCompensatory = Object.entries(
    props.compensatorySessions ?? {}
  ).flatMap(([termIndex, list]) =>
    (list ?? []).map((session) => ({
      ...session,
      termIndex: Number(termIndex),
    }))
  )
  const currentCompensatory = allCompensatory.find(
    (session) => session.date === ymd
  )
  const activeTermIndex = props.lockedTermIndex ?? props.selectedTermIndex
  const activeProposal = props.proposals[activeTermIndex] ?? props.termProposal
  const clickedTermIndex = props.proposals.findIndex((proposal) => {
    if (!proposal.startDate || !proposal.endDate) return false
    return (
      ymd >= normalizeDateToYmd(proposal.startDate) &&
      ymd <= normalizeDateToYmd(proposal.endDate)
    )
  })
  const clickedProposal =
    clickedTermIndex === -1 ? undefined : props.proposals[clickedTermIndex]
  const isBelongingToOtherTerm =
    props.lockedTermIndex !== undefined &&
    clickedTermIndex !== -1 &&
    clickedTermIndex !== props.lockedTermIndex
  const isCurrentTermStart = Boolean(
    activeProposal?.startDate &&
    normalizeDateToYmd(activeProposal.startDate) === ymd
  )
  const isStartDate =
    isCurrentTermStart ||
    props.proposals.some(
      (proposal) =>
        proposal.startDate && normalizeDateToYmd(proposal.startDate) === ymd
    )
  let canSetStart =
    !((isOfficialHoliday && !isDismissed) || isCustomOff) &&
    !isFriday &&
    !isBelongingToOtherTerm &&
    !isStartDate
  const previous = props.proposals[activeTermIndex - 1]
  const next = props.proposals[activeTermIndex + 1]
  if (previous?.endDate && ymd <= normalizeDateToYmd(previous.endDate))
    canSetStart = false
  if (next?.startDate && ymd >= normalizeDateToYmd(next.startDate))
    canSetStart = false
  const excessPattern = activeProposal?.patternDetails?.find((pattern) =>
    pattern.excessDates?.includes(ymd)
  )
  const isExcessSessionDay = Boolean(excessPattern)
  const oppositeTrack: "ODD" | "EVEN" =
    excessPattern?.track === "EVEN" ? "ODD" : "EVEN"
  const isEligibleForCompensatory =
    isFriday ||
    (isOfficialHoliday && !isDismissed) ||
    isCustomOff ||
    isExcessSessionDay
  const canShowCompensatory =
    !isBelongingToOtherTerm &&
    (Boolean(currentCompensatory) || isEligibleForCompensatory)
  let canAddCompensatory = isEligibleForCompensatory && !currentCompensatory
  if (
    activeProposal?.startDate &&
    ymd < normalizeDateToYmd(activeProposal.startDate)
  )
    canAddCompensatory = false
  const holidayTitle = isOfficialHoliday
    ? isRtl
      ? holidayInfo.holiday?.titleFa
      : holidayInfo.holiday?.titleEn
    : isCustomOff
      ? isRtl
        ? "تعطیلی اختصاصی موسسه"
        : "Institute Off-Day"
      : undefined
  const { evenDate, oddDate, examDates } = activeProposal
    ? getTermExamDates(activeProposal)
    : { evenDate: undefined, oddDate: undefined, examDates: [] }
  const isExamDay = examDates.includes(ymd)
  const isEvenSession = Boolean(
    activeProposal?.patternDetails
      ?.find((pattern) => pattern.track === "EVEN")
      ?.sessionDates?.includes(ymd)
  )
  const isOddSession = Boolean(
    activeProposal?.patternDetails
      ?.find((pattern) => pattern.track === "ODD")
      ?.sessionDates?.includes(ymd)
  )

  return {
    ymd,
    jalaliDay: jalaliDate.day,
    dateFormatted,
    isOfficialHoliday,
    isCustomOff,
    isDismissed,
    isFriday,
    currentCompensatory,
    hasCompensatory: Boolean(currentCompensatory),
    activeTermIndex,
    activeProposal,
    clickedProposal,
    isBelongingToOtherTerm,
    isCurrentTermStart,
    isCurrentTermEnd: Boolean(
      activeProposal?.endDate &&
      normalizeDateToYmd(activeProposal.endDate) === ymd
    ),
    isStartDate,
    canSetStart,
    excessPattern,
    isExcessSessionDay,
    excessSessionNum: excessPattern?.sessionDates
      ? excessPattern.sessionDates.indexOf(ymd) + 1
      : undefined,
    oppositeTrack,
    canShowCompensatory,
    canAddCompensatory,
    holidayTitle,
    isExamDay,
    isEvenExam: evenDate === ymd,
    isOddExam: oddDate === ymd,
    isEvenSession,
    isOddSession,
    isTermSessionDay: isEvenSession || isOddSession,
  }
}

export type DayActionsState = ReturnType<typeof useDayActionsState>

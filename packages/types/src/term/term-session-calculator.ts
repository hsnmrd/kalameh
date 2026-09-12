import { type WeekDay } from "../class/class.schema.js"
import { JALALI_MONTHS } from "../operating-phase/operating-phase.schema.js"
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatJalali,
  parseJalaliString,
  getWeekDay,
  isJalaliHoliday,
  type JalaliHoliday,
} from "../calendar/jalali-holidays.js"

export interface CalculateTermEndDateInput {
  startDate: string | Date
  targetDays?: number
  targetSessions?: number
  daysOfWeek?: WeekDay[]
  skipHolidays?: boolean
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
}

export interface HolidayEncountered {
  date: string // ISO YYYY-MM-DD
  dateJalali: string // YYYY/MM/DD
  titleFa: string
  titleEn: string
  dayOfWeek: WeekDay
  isCustomOffDay?: boolean
}

export interface CalculatedTermSchedule {
  startDate: string // ISO YYYY-MM-DD
  startDateJalali: string
  endDate: string // ISO YYYY-MM-DD
  endDateJalali: string
  targetDays: number
  totalDaysSpan: number
  holidaysEncountered: HolidayEncountered[]
  // Backward compatibility
  targetSessions: number
  completedSessions: number
  sessionDates: string[] // ISO dates
  sessionDatesJalali: string[]
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseInputDate(input: string | Date): Date {
  if (input instanceof Date) return input
  const jParsed = parseJalaliString(input)
  if (jParsed && jParsed.year >= 1300 && jParsed.year <= 1500) {
    return jalaliToGregorian(jParsed.year, jParsed.month, jParsed.day)
  }
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    const rawDate = input.split("T")[0] || ""
    const parts = rawDate.split("-").map(Number)
    const [y, m, d] = parts
    if (y !== undefined && m !== undefined && d !== undefined) {
      return new Date(y, m - 1, d, 12, 0, 0)
    }
  }
  const g = new Date(input)
  if (isNaN(g.getTime())) {
    throw new Error(`Invalid date format: ${input}`)
  }
  return g
}

/**
 * Calculates the exact end date of an academic term based on day/session count,
 * optional teaching days of the week, and skipping official Jalali holidays.
 */
export function calculateTermEndDate(
  input: CalculateTermEndDateInput
): CalculatedTermSchedule {
  const targetCount = input.targetDays ?? input.targetSessions ?? 45
  const {
    daysOfWeek,
    skipHolidays = true,
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
  } = input

  if (targetCount <= 0) {
    throw new Error("Target count must be greater than 0")
  }

  const dismissedHolidaysSet = new Set(dismissedHolidays)
  const customOffDayMap = new Map<string, string>()
  for (const item of customOffDays) {
    if (typeof item === "string") {
      customOffDayMap.set(item, "تعطیلی موسسه")
    } else if (item && typeof item === "object") {
      customOffDayMap.set(item.date, item.title || "تعطیلی موسسه")
    }
  }

  const startDateObj = parseInputDate(input.startDate)
  const current = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate(),
    12,
    0,
    0,
    0
  )

  const sessionDates: string[] = []
  const sessionDatesJalali: string[] = []
  const holidaysEncountered: HolidayEncountered[] = []

  let completedDays = 0
  let safetyLoop = 0
  const maxDays = 365 * 2 // safety cap

  let lastDate: Date = current
  const useSpecificDaysOfWeek =
    Array.isArray(daysOfWeek) && daysOfWeek.length > 0

  while (completedDays < targetCount && safetyLoop < maxDays) {
    safetyLoop++
    const dayOfWeek = getWeekDay(current)

    if (!useSpecificDaysOfWeek || daysOfWeek.includes(dayOfWeek)) {
      const isoDate = toIsoDate(current)
      const customOffTitle = customOffDayMap.get(isoDate)
      const isCustomOff = customOffTitle !== undefined
      const holidayCheck = isJalaliHoliday(current)
      const isOfficialHoliday =
        observeOfficialHolidays &&
        holidayCheck.isHoliday &&
        !dismissedHolidaysSet.has(isoDate)

      if (skipHolidays && (isCustomOff || isOfficialHoliday)) {
        const j = gregorianToJalali(current)
        holidaysEncountered.push({
          date: isoDate,
          dateJalali: formatJalali(j.year, j.month, j.day),
          titleFa: isCustomOff
            ? customOffTitle
            : (holidayCheck.holiday?.titleFa ?? "تعطیل رسمی"),
          titleEn: isCustomOff
            ? "Institute Off-Day"
            : (holidayCheck.holiday?.titleEn ?? "Official Holiday"),
          dayOfWeek,
          isCustomOffDay: isCustomOff,
        })
      } else {
        completedDays++
        const j = gregorianToJalali(current)
        sessionDates.push(isoDate)
        sessionDatesJalali.push(formatJalali(j.year, j.month, j.day))
        lastDate = new Date(current)
      }
    }

    if (completedDays === targetCount) {
      break
    }

    // Move to next calendar day
    current.setDate(current.getDate() + 1)
  }

  const startJ = gregorianToJalali(startDateObj)
  const endJ = gregorianToJalali(lastDate)

  const totalDaysSpan =
    Math.round(
      (lastDate.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)
    ) + 1

  return {
    startDate: toIsoDate(startDateObj),
    startDateJalali: formatJalali(startJ.year, startJ.month, startJ.day),
    endDate: toIsoDate(lastDate),
    endDateJalali: formatJalali(endJ.year, endJ.month, endJ.day),
    targetDays: targetCount,
    totalDaysSpan,
    holidaysEncountered,
    targetSessions: targetCount,
    completedSessions: completedDays,
    sessionDates,
    sessionDatesJalali,
  }
}

// ─── Phase Terms Batch Generator ─────────────────────────────────────────────

export interface GeneratePhaseTermsInput {
  phase: {
    id?: string
    title: string
    months: number[] // e.g. [7, 8, 9, 10, 11, 12, 1, 2, 3]
    daysOfWeek?: WeekDay[]
  }
  jalaliYear: number // e.g. 1403
  daysPerTerm?: number // e.g. 45
  sessionsPerTerm?: number // backward compatibility alias
  daysOfWeek?: WeekDay[] // e.g. ["SATURDAY", "MONDAY", "WEDNESDAY"]
  gapDaysBetweenTerms?: number // default 2
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
}

export interface GeneratedTermProposal {
  title: string
  startDate: string // ISO
  startDateJalali: string
  endDate: string // ISO
  endDateJalali: string
  daysCount: number
  sessionsCount: number // backward compatibility alias
  holidaysCount: number
  monthsCovered: number[]
  monthNamesFa: string
  operatingPhaseId?: string
}

export function toPersianDigits(n: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return n.toString().replace(/\d/g, (x) => farsiDigits[Number(x)] ?? x)
}

/**
 * Automatically generates human-readable Persian titles for terms based on
 * covered months and the academic year.
 * Examples:
 * - Months [7, 8]: "مهر و آبان ۱۴۰۳"
 * - Months [7, 8, 9]: "پاییز ۱۴۰۳"
 * - Months [10, 11]: "دی و بهمن ۱۴۰۳"
 * - Months [10, 11, 12]: "زمستان ۱۴۰۳"
 */
export function generateTermTitleFromMonths(
  months: number[],
  year: number
): string {
  const yearFa = toPersianDigits(year)
  if (!months || months.length === 0) {
    return `ترم ${yearFa}`
  }

  const uniqueMonths = Array.from(new Set(months))
  const sortedMonths = [...uniqueMonths].sort((a, b) => a - b)

  // Check if exactly matches an entire season
  if (sortedMonths.length === 3) {
    if (
      sortedMonths[0] === 1 &&
      sortedMonths[1] === 2 &&
      sortedMonths[2] === 3
    ) {
      return `بهار ${yearFa}`
    }
    if (
      sortedMonths[0] === 4 &&
      sortedMonths[1] === 5 &&
      sortedMonths[2] === 6
    ) {
      return `تابستان ${yearFa}`
    }
    if (
      sortedMonths[0] === 7 &&
      sortedMonths[1] === 8 &&
      sortedMonths[2] === 9
    ) {
      return `پاییز ${yearFa}`
    }
    if (
      sortedMonths[0] === 10 &&
      sortedMonths[1] === 11 &&
      sortedMonths[2] === 12
    ) {
      return `زمستان ${yearFa}`
    }
  }

  // If months wrap around the Jalali new year (e.g. [1, 2, 12]),
  // ensure year-end months (10..12) chronologically precede next-year months (1..6)
  let chronologicalMonths = [...uniqueMonths]
  const firstLateIdx = chronologicalMonths.findIndex((m) => m >= 10)
  const firstEarlyIdx = chronologicalMonths.findIndex((m) => m <= 3)
  if (
    firstLateIdx !== -1 &&
    firstEarlyIdx !== -1 &&
    firstLateIdx > firstEarlyIdx
  ) {
    const lateMonths = chronologicalMonths.filter((m) => m >= 7)
    const earlyMonths = chronologicalMonths.filter((m) => m < 7)
    chronologicalMonths = [...lateMonths, ...earlyMonths]
  }

  const names = chronologicalMonths
    .map((mId) => JALALI_MONTHS.find((m) => m.id === mId)?.nameFa)
    .filter((name): name is string => Boolean(name))

  if (names.length === 1) {
    return `${names[0]} ${yearFa}`
  }
  if (names.length === 2) {
    return `${names[0]} و ${names[1]} ${yearFa}`
  }
  return `${names[0]} تا ${names[names.length - 1]} ${yearFa}`
}

/**
 * Generates all consecutive terms for an operating phase based on covered months,
 * required sessions per term, and Jalali holidays.
 */
export function generatePhaseTerms(
  input: GeneratePhaseTermsInput
): GeneratedTermProposal[] {
  const {
    phase,
    jalaliYear,
    daysPerTerm,
    sessionsPerTerm,
    daysOfWeek = input.daysOfWeek ??
      (phase.daysOfWeek && phase.daysOfWeek.length > 0
        ? phase.daysOfWeek
        : undefined),
    gapDaysBetweenTerms = 2,
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
  } = input

  const targetDaysCount = daysPerTerm ?? sessionsPerTerm ?? 45

  if (!phase.months || phase.months.length === 0) {
    return []
  }

  const proposals: GeneratedTermProposal[] = []

  // Build sequential months in order
  const orderedMonths = [...phase.months]
  const firstMonth = orderedMonths[0] ?? 1
  const lastMonth = orderedMonths[orderedMonths.length - 1] ?? 12

  // Starting Date for Term 1
  let termStartGDate = jalaliToGregorian(jalaliYear, firstMonth, 1)

  // End boundary for the entire phase
  // If lastMonth < firstMonth, it wraps into next year (e.g. 7..12 then 1..3)
  const endYear = lastMonth < firstMonth ? jalaliYear + 1 : jalaliYear
  // End of last month: 31 days for 1-6, 30 days for 7-11, 29/30 for 12
  const lastMonthDays = lastMonth <= 6 ? 31 : lastMonth <= 11 ? 30 : 29
  const phaseEndGDate = jalaliToGregorian(endYear, lastMonth, lastMonthDays)

  let termIndex = 1
  const maxTermsCap = 12 // safety cap

  while (termStartGDate < phaseEndGDate && proposals.length < maxTermsCap) {
    // Check if start date is still within phase months
    const curStartJ = gregorianToJalali(termStartGDate)
    if (!orderedMonths.includes(curStartJ.month)) {
      break
    }

    const schedule = calculateTermEndDate({
      startDate: termStartGDate,
      targetDays: targetDaysCount,
      daysOfWeek,
      skipHolidays: true,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
    })

    const endGDate = new Date(schedule.endDate + "T12:00:00")

    // Determine Jalali months covered by this term
    const coveredMonthSet = new Set<number>()
    for (const sessionIso of schedule.sessionDates) {
      const sDate = new Date(sessionIso + "T12:00:00")
      const sJ = gregorianToJalali(sDate)
      coveredMonthSet.add(sJ.month)
    }

    const monthsCovered = Array.from(coveredMonthSet)
    const termYear = curStartJ.year
    const title = generateTermTitleFromMonths(monthsCovered, termYear)
    const monthNamesFa = monthsCovered
      .map((mId) => JALALI_MONTHS.find((m) => m.id === mId)?.nameFa)
      .filter(Boolean)
      .join("، ")

    proposals.push({
      title,
      startDate: schedule.startDate,
      startDateJalali: schedule.startDateJalali,
      endDate: schedule.endDate,
      endDateJalali: schedule.endDateJalali,
      daysCount: schedule.totalDaysSpan,
      sessionsCount: schedule.completedSessions,
      holidaysCount: schedule.holidaysEncountered.length,
      monthsCovered,
      monthNamesFa,
      operatingPhaseId: phase.id,
    })

    // Advance to next term: end date + gapDaysBetweenTerms
    const nextStart = new Date(endGDate)
    nextStart.setDate(nextStart.getDate() + gapDaysBetweenTerms + 1)

    // If specific daysOfWeek are provided, snap to next matching day
    if (daysOfWeek && daysOfWeek.length > 0) {
      while (!daysOfWeek.includes(getWeekDay(nextStart))) {
        nextStart.setDate(nextStart.getDate() + 1)
      }
    }

    termStartGDate = nextStart
    termIndex++
  }

  return proposals
}

export interface RecalculatePhaseTermsInput {
  proposals: GeneratedTermProposal[]
  changedIndex: number
  newStartDate: string | Date // ISO YYYY-MM-DD or Jalali YYYY/MM/DD
  daysPerTerm?: number
  sessionsPerTerm?: number
  daysOfWeek?: WeekDay[]
  gapDaysBetweenTerms?: number
  userCustomTitles?: Record<number, string>
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
}

/**
 * Recalculates phase terms starting from a specific changed term index,
 * adjusting its end date and cascading updates to all subsequent terms.
 */
export function recalculatePhaseTerms(
  input: RecalculatePhaseTermsInput
): GeneratedTermProposal[] {
  const {
    proposals,
    changedIndex,
    newStartDate,
    daysPerTerm,
    sessionsPerTerm,
    daysOfWeek,
    gapDaysBetweenTerms = 2,
    userCustomTitles = {},
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
  } = input

  const targetDaysCount =
    daysPerTerm ?? sessionsPerTerm ?? proposals[changedIndex]?.daysCount ?? 45

  if (!proposals || proposals.length === 0) {
    return []
  }
  if (changedIndex < 0 || changedIndex >= proposals.length) {
    return proposals
  }

  const updated: GeneratedTermProposal[] = proposals.map((p) => ({ ...p }))
  const parsedStart = parseInputDate(newStartDate)

  // Backward constraint: cannot be on or before previous term's end date
  if (changedIndex > 0) {
    const prevProposal = updated[changedIndex - 1]
    if (prevProposal) {
      const prevEnd = new Date(prevProposal.endDate + "T12:00:00")
      if (parsedStart <= prevEnd) {
        throw new Error(
          `تاریخ شروع نمی‌تواند همزمان یا قبل از پایان ترم قبلی (${prevProposal.endDateJalali}) باشد.`
        )
      }
    }
  }

  let currentStart = new Date(
    parsedStart.getFullYear(),
    parsedStart.getMonth(),
    parsedStart.getDate(),
    12,
    0,
    0,
    0
  )

  for (let i = changedIndex; i < updated.length; i++) {
    const existing = updated[i]
    if (!existing) break

    const schedule = calculateTermEndDate({
      startDate: currentStart,
      targetDays: targetDaysCount,
      daysOfWeek,
      skipHolidays: true,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
    })

    const coveredMonthSet = new Set<number>()
    for (const sessionIso of schedule.sessionDates) {
      const sDate = new Date(sessionIso + "T12:00:00")
      const sJ = gregorianToJalali(sDate)
      coveredMonthSet.add(sJ.month)
    }

    const monthsCovered = Array.from(coveredMonthSet)
    const curStartJ = gregorianToJalali(currentStart)
    const autoTitle = generateTermTitleFromMonths(monthsCovered, curStartJ.year)
    const customTitle = userCustomTitles[i]
    const finalTitle =
      customTitle && customTitle.trim() !== "" ? customTitle : autoTitle

    const monthNamesFa = monthsCovered
      .map((mId) => JALALI_MONTHS.find((m) => m.id === mId)?.nameFa)
      .filter(Boolean)
      .join("، ")

    updated[i] = {
      ...existing,
      title: finalTitle,
      startDate: schedule.startDate,
      startDateJalali: schedule.startDateJalali,
      endDate: schedule.endDate,
      endDateJalali: schedule.endDateJalali,
      daysCount: schedule.totalDaysSpan,
      sessionsCount: schedule.completedSessions,
      holidaysCount: schedule.holidaysEncountered.length,
      monthsCovered,
      monthNamesFa,
    }

    // Determine start date for next term
    if (i < updated.length - 1) {
      const endGDate = new Date(schedule.endDate + "T12:00:00")
      const nextStart = new Date(endGDate)
      nextStart.setDate(nextStart.getDate() + gapDaysBetweenTerms + 1)

      if (daysOfWeek && daysOfWeek.length > 0) {
        while (!daysOfWeek.includes(getWeekDay(nextStart))) {
          nextStart.setDate(nextStart.getDate() + 1)
        }
      }

      currentStart = nextStart
    }
  }

  return updated
}

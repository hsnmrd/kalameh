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
  classPatterns?: WeekDay[][]
  skipHolidays?: boolean
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
  compensatorySessions?: CompensatorySession[]
}

export interface CompensatorySession {
  date: string // ISO YYYY-MM-DD
  dateJalali?: string
  replacesDate?: string // ISO date of missed holiday session
  replacesDateJalali?: string
  patternTrack: "EVEN" | "ODD" | "ALL"
  title?: string
}

export interface PatternSessionDetail {
  track: "EVEN" | "ODD" | "CUSTOM"
  days: WeekDay[]
  completedSessions: number
  targetSessions: number
  compensatoryCount: number
  hasExcess: boolean
  sessionDates?: string[]
  excessDates?: string[]
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
  patternDetails?: PatternSessionDetail[]
  hasSessionImbalance?: boolean
  compensatorySessionsApplied?: CompensatorySession[]
  examDates?: string[]
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

export const EVEN_CLASS_DAYS: readonly WeekDay[] = [
  "SATURDAY",
  "MONDAY",
  "WEDNESDAY",
]
export const ODD_CLASS_DAYS: readonly WeekDay[] = [
  "SUNDAY",
  "TUESDAY",
  "THURSDAY",
]
export const NEUTRAL_CLASS_DAYS: readonly WeekDay[] = ["FRIDAY"]

export function resolveClassPatterns(
  daysOfWeek?: WeekDay[],
  explicitPatterns?: WeekDay[][]
): WeekDay[][] {
  if (explicitPatterns && explicitPatterns.length > 0) {
    return explicitPatterns.filter((p) => p.length > 0)
  }
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return []
  }
  const even = EVEN_CLASS_DAYS.filter((d) => daysOfWeek.includes(d))
  const odd = ODD_CLASS_DAYS.filter((d) => daysOfWeek.includes(d))

  // If daysOfWeek has both even and odd days, decompose into distinct class patterns
  if (even.length > 0 && odd.length > 0) {
    return [even, odd]
  }
  return [daysOfWeek]
}

/**
 * Calculates the exact end date of an academic term based on day/session count,
 * optional teaching days of the week, and skipping official Jalali holidays.
 * When multiple class patterns are present (e.g. Even days and Odd days),
 * the term end date is the latest date when all class patterns have completed
 * their required session count.
 */
export function calculateTermEndDate(
  input: CalculateTermEndDateInput
): CalculatedTermSchedule {
  const targetCount = input.targetDays ?? input.targetSessions ?? 45
  const {
    daysOfWeek,
    classPatterns,
    skipHolidays = true,
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
    compensatorySessions = [],
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
  const startIso = toIsoDate(startDateObj)
  const validCompensatory = compensatorySessions.filter(
    (cs) => cs.date >= startIso
  )

  const current = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate(),
    12,
    0,
    0,
    0
  )

  const resolvedPatterns = resolveClassPatterns(daysOfWeek, classPatterns)

  if (resolvedPatterns.length > 1) {
    interface PatternProgress {
      pattern: WeekDay[]
      track: "EVEN" | "ODD" | "CUSTOM"
      completedSessions: number
      compensatoryCount: number
      lastDate: Date
      sessionDates: string[]
      sessionDatesJalali: string[]
      holidaysEncountered: HolidayEncountered[]
    }

    const patternProgressList: PatternProgress[] = resolvedPatterns.map((p) => {
      const isEven =
        p.includes("SATURDAY") ||
        p.includes("MONDAY") ||
        p.includes("WEDNESDAY")
      const isOdd =
        p.includes("SUNDAY") || p.includes("TUESDAY") || p.includes("THURSDAY")
      const track: "EVEN" | "ODD" | "CUSTOM" = isEven
        ? "EVEN"
        : isOdd
          ? "ODD"
          : "CUSTOM"

      return {
        pattern: p,
        track,
        completedSessions: 0,
        compensatoryCount: 0,
        lastDate: current,
        sessionDates: [],
        sessionDatesJalali: [],
        holidaysEncountered: [],
      }
    })

    let simDate = new Date(current)
    let safetyLoop = 0
    const maxDays = 365 * 3 // safety cap

    while (
      patternProgressList.some((p) => p.completedSessions < targetCount) &&
      safetyLoop < maxDays
    ) {
      safetyLoop++
      const dayOfWeek = getWeekDay(simDate)
      const isoDate = toIsoDate(simDate)
      const customOffTitle = customOffDayMap.get(isoDate)
      const isCustomOff = customOffTitle !== undefined
      const holidayCheck = isJalaliHoliday(simDate)
      const isOfficialHoliday =
        observeOfficialHolidays &&
        holidayCheck.isHoliday &&
        !dismissedHolidaysSet.has(isoDate)
      const isHoliday = skipHolidays && (isCustomOff || isOfficialHoliday)

      // 1. Process compensatory sessions matching this date
      const compForDate = validCompensatory.filter((cs) => cs.date === isoDate)
      for (const cs of compForDate) {
        for (const p of patternProgressList) {
          if (cs.patternTrack === "ALL" || cs.patternTrack === p.track) {
            p.completedSessions++
            p.compensatoryCount++
            const j = gregorianToJalali(simDate)
            p.sessionDates.push(isoDate)
            p.sessionDatesJalali.push(formatJalali(j.year, j.month, j.day))
            p.lastDate = new Date(simDate)
          }
        }
      }

      // 2. Process regular teaching days (skip if already compensated on this day)
      // If ANY compensatory session is scheduled on this date, this date is dedicated to that compensatory session,
      // so regular classes of other tracks are not held on this date.
      if (compForDate.length === 0) {
        for (const p of patternProgressList) {
          if (p.pattern.includes(dayOfWeek)) {
            if (isHoliday) {
              const j = gregorianToJalali(simDate)
              p.holidaysEncountered.push({
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
              p.completedSessions++
              const j = gregorianToJalali(simDate)
              p.sessionDates.push(isoDate)
              p.sessionDatesJalali.push(formatJalali(j.year, j.month, j.day))
              p.lastDate = new Date(simDate)
            }
          }
        }
      }

      simDate.setDate(simDate.getDate() + 1)
    }

    // Latest date among all patterns is when ALL classes finish!
    let latestEndDate = patternProgressList[0]!.lastDate
    for (const p of patternProgressList) {
      if (p.lastDate.getTime() > latestEndDate.getTime()) {
        latestEndDate = p.lastDate
      }
    }

    // Aggregate unique holidays encountered across all patterns
    const holidayMap = new Map<string, HolidayEncountered>()
    for (const p of patternProgressList) {
      for (const h of p.holidaysEncountered) {
        if (!holidayMap.has(h.date)) {
          holidayMap.set(h.date, h)
        }
      }
    }
    const allHolidays = Array.from(holidayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Aggregate unique session dates across all patterns
    const sessionDateSet = new Set<string>()
    for (const p of patternProgressList) {
      for (const s of p.sessionDates) {
        sessionDateSet.add(s)
      }
    }
    const allSessionDates = Array.from(sessionDateSet).sort()
    const allSessionDatesJalali = allSessionDates.map((iso) => {
      const parts = iso.split("-").map(Number)
      const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!, 12, 0, 0)
      const j = gregorianToJalali(d)
      return formatJalali(j.year, j.month, j.day)
    })

    const patternDetails: PatternSessionDetail[] = patternProgressList.map(
      (p) => ({
        track: p.track,
        days: p.pattern,
        completedSessions: p.completedSessions,
        targetSessions: targetCount,
        compensatoryCount: p.compensatoryCount,
        hasExcess: p.completedSessions > targetCount,
        sessionDates: p.sessionDates,
        excessDates:
          p.completedSessions > targetCount
            ? p.sessionDates.slice(targetCount)
            : [],
      })
    )

    const distinctCounts = new Set(
      patternProgressList.map((p) => p.completedSessions)
    )
    const hasAnyExcess = patternProgressList.some(
      (p) => p.completedSessions > targetCount
    )
    const hasSessionImbalance = distinctCounts.size > 1 || hasAnyExcess

    const startJ = gregorianToJalali(startDateObj)
    const endJ = gregorianToJalali(latestEndDate)
    const totalDaysSpan =
      Math.round(
        (latestEndDate.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)
      ) + 1

    const evenProgress = patternProgressList.find((p) => p.track === "EVEN")
    const oddProgress = patternProgressList.find((p) => p.track === "ODD")
    const examDatesList: string[] = []

    if (evenProgress && evenProgress.sessionDates.length > 0) {
      examDatesList.push(
        evenProgress.sessionDates[evenProgress.sessionDates.length - 1]!
      )
    }
    if (oddProgress && oddProgress.sessionDates.length > 0) {
      examDatesList.push(
        oddProgress.sessionDates[oddProgress.sessionDates.length - 1]!
      )
    }
    if (examDatesList.length === 0 && allSessionDates.length > 0) {
      examDatesList.push(...allSessionDates.slice(-2))
    }
    const examDates = Array.from(new Set(examDatesList)).sort()

    return {
      startDate: toIsoDate(startDateObj),
      startDateJalali: formatJalali(startJ.year, startJ.month, startJ.day),
      endDate: toIsoDate(latestEndDate),
      endDateJalali: formatJalali(endJ.year, endJ.month, endJ.day),
      targetDays: targetCount,
      totalDaysSpan,
      holidaysEncountered: allHolidays,
      targetSessions: targetCount,
      completedSessions: targetCount,
      sessionDates: allSessionDates,
      sessionDatesJalali: allSessionDatesJalali,
      patternDetails,
      hasSessionImbalance,
      compensatorySessionsApplied: validCompensatory,
      examDates,
    }
  }

  const sessionDates: string[] = []
  const sessionDatesJalali: string[] = []
  const holidaysEncountered: HolidayEncountered[] = []

  let completedDays = 0
  let compensatoryCount = 0
  let safetyLoop = 0
  const maxDays = 365 * 2 // safety cap

  let lastDate: Date = current
  const useSpecificDaysOfWeek =
    Array.isArray(daysOfWeek) && daysOfWeek.length > 0

  while (completedDays < targetCount && safetyLoop < maxDays) {
    safetyLoop++
    const dayOfWeek = getWeekDay(current)
    const isoDate = toIsoDate(current)
    const compForDay = validCompensatory.filter((cs) => cs.date === isoDate)

    if (compForDay.length > 0) {
      completedDays++
      compensatoryCount++
      const j = gregorianToJalali(current)
      sessionDates.push(isoDate)
      sessionDatesJalali.push(formatJalali(j.year, j.month, j.day))
      lastDate = new Date(current)
    } else if (!useSpecificDaysOfWeek || daysOfWeek.includes(dayOfWeek)) {
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
    patternDetails: [
      {
        track: "CUSTOM",
        days: daysOfWeek || [],
        completedSessions: completedDays,
        targetSessions: targetCount,
        compensatoryCount,
        hasExcess: completedDays > targetCount,
        sessionDates,
        excessDates:
          completedDays > targetCount ? sessionDates.slice(targetCount) : [],
      },
    ],
    hasSessionImbalance: completedDays > targetCount,
    compensatorySessionsApplied: validCompensatory,
    examDates: sessionDates.slice(-2),
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
  sessionsPerTerm?: number // e.g. 18 (number of sessions per term)
  daysPerTerm?: number // backward compatibility alias
  daysOfWeek?: WeekDay[] // e.g. ["SATURDAY", "MONDAY", "WEDNESDAY"]
  classPatterns?: WeekDay[][] // e.g. [["SATURDAY", "MONDAY", "WEDNESDAY"], ["SUNDAY", "TUESDAY"]]
  gapDaysBetweenTerms?: number // default 2
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
}

export interface GeneratedTermProposal {
  title: string
  startDate: string // ISO
  startDateJalali: string
  endDate: string // ISO
  endDateJalali: string
  daysCount: number
  sessionsCount: number
  holidaysCount: number
  monthsCovered: number[]
  monthNamesFa: string
  operatingPhaseId?: string
  compensatorySessions?: CompensatorySession[]
  patternDetails?: PatternSessionDetail[]
  hasSessionImbalance?: boolean
  holidaysEncountered?: HolidayEncountered[]
  examDates?: string[]
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
 * A term finishes when all of its class patterns complete their required session count.
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
    classPatterns = input.classPatterns,
    gapDaysBetweenTerms = 2,
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
  } = input

  const targetSessionsCount = sessionsPerTerm ?? daysPerTerm ?? 18

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

    const termCompensatory =
      input.compensatorySessions?.[proposals.length] ?? []

    const schedule = calculateTermEndDate({
      startDate: termStartGDate,
      targetSessions: targetSessionsCount,
      targetDays: targetSessionsCount,
      daysOfWeek,
      classPatterns,
      skipHolidays: true,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
      compensatorySessions: termCompensatory,
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
      compensatorySessions: termCompensatory,
      patternDetails: schedule.patternDetails,
      hasSessionImbalance: schedule.hasSessionImbalance,
      holidaysEncountered: schedule.holidaysEncountered,
      examDates: schedule.examDates,
    })

    // Advance to next term: end date + gapDaysBetweenTerms
    const nextStart = new Date(endGDate)
    nextStart.setDate(nextStart.getDate() + gapDaysBetweenTerms + 1)

    // Snap to next matching class day
    const activePatterns = resolveClassPatterns(daysOfWeek, classPatterns)
    const validDays =
      activePatterns.length > 0
        ? Array.from(new Set(activePatterns.flat()))
        : daysOfWeek

    if (validDays && validDays.length > 0) {
      while (!validDays.includes(getWeekDay(nextStart))) {
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
  classPatterns?: WeekDay[][]
  gapDaysBetweenTerms?: number
  userCustomTitles?: Record<number, string>
  observeOfficialHolidays?: boolean
  customOffDays?: (string | { date: string; title?: string })[]
  dismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
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
    classPatterns,
    gapDaysBetweenTerms = 2,
    userCustomTitles = {},
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
  } = input

  const targetSessionsCount =
    sessionsPerTerm ??
    daysPerTerm ??
    proposals[changedIndex]?.sessionsCount ??
    18

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

    const termCompensatory =
      input.compensatorySessions?.[i] ?? existing.compensatorySessions ?? []

    const schedule = calculateTermEndDate({
      startDate: currentStart,
      targetSessions: targetSessionsCount,
      targetDays: targetSessionsCount,
      daysOfWeek,
      classPatterns,
      skipHolidays: true,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
      compensatorySessions: termCompensatory,
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
      compensatorySessions: termCompensatory,
      patternDetails: schedule.patternDetails,
      hasSessionImbalance: schedule.hasSessionImbalance,
      holidaysEncountered: schedule.holidaysEncountered,
      examDates: schedule.examDates,
    }

    // Determine start date for next term
    if (i < updated.length - 1) {
      const endGDate = new Date(schedule.endDate + "T12:00:00")
      const nextStart = new Date(endGDate)
      nextStart.setDate(nextStart.getDate() + gapDaysBetweenTerms + 1)

      const activePatterns = resolveClassPatterns(daysOfWeek, classPatterns)
      const validDays =
        activePatterns.length > 0
          ? Array.from(new Set(activePatterns.flat()))
          : daysOfWeek

      if (validDays && validDays.length > 0) {
        while (!validDays.includes(getWeekDay(nextStart))) {
          nextStart.setDate(nextStart.getDate() + 1)
        }
      }

      currentStart = nextStart
    }
  }

  return updated
}

/**
 * Resolves the final exam session dates for a term proposal.
 * Typically consists of the last session of the Even track and the last session of the Odd track.
 */
export function getTermExamDates(term: GeneratedTermProposal): {
  evenDate?: string
  oddDate?: string
  examDates: string[]
} {
  if (term.examDates && term.examDates.length > 0) {
    const evenPattern = term.patternDetails?.find((p) => p.track === "EVEN")
    const oddPattern = term.patternDetails?.find((p) => p.track === "ODD")
    const evenDate = evenPattern?.sessionDates?.find((d) =>
      term.examDates!.includes(d)
    )
    const oddDate = oddPattern?.sessionDates?.find((d) =>
      term.examDates!.includes(d)
    )
    return {
      evenDate,
      oddDate,
      examDates: term.examDates,
    }
  }

  const evenPattern = term.patternDetails?.find((p) => p.track === "EVEN")
  const oddPattern = term.patternDetails?.find((p) => p.track === "ODD")

  const evenDate =
    evenPattern &&
    evenPattern.sessionDates &&
    evenPattern.sessionDates.length > 0
      ? evenPattern.sessionDates[evenPattern.sessionDates.length - 1]
      : undefined

  const oddDate =
    oddPattern && oddPattern.sessionDates && oddPattern.sessionDates.length > 0
      ? oddPattern.sessionDates[oddPattern.sessionDates.length - 1]
      : undefined

  const examDates: string[] = []
  if (evenDate) examDates.push(evenDate)
  if (oddDate) examDates.push(oddDate)

  if (examDates.length === 0 && term.endDate) {
    const rawEnd = term.endDate.split("T")[0]!
    examDates.push(rawEnd)
  }

  return {
    evenDate,
    oddDate,
    examDates: Array.from(new Set(examDates)).sort(),
  }
}

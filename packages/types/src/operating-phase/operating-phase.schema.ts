import { z } from "zod"
import { WEEK_DAYS, type WeekDay } from "../class/class.schema.js"

// ─── Jalali Months Constants ──────────────────────────────────────────────────

export interface JalaliMonthInfo {
  id: number
  nameFa: string
  nameEn: string
  seasonFa: string
  seasonEn: string
}

export const JALALI_MONTHS: readonly JalaliMonthInfo[] = [
  {
    id: 1,
    nameFa: "فروردین",
    nameEn: "Farvardin",
    seasonFa: "بهار",
    seasonEn: "Spring",
  },
  {
    id: 2,
    nameFa: "اردیبهشت",
    nameEn: "Ordibehesht",
    seasonFa: "بهار",
    seasonEn: "Spring",
  },
  {
    id: 3,
    nameFa: "خرداد",
    nameEn: "Khordad",
    seasonFa: "بهار",
    seasonEn: "Spring",
  },
  {
    id: 4,
    nameFa: "تیر",
    nameEn: "Tir",
    seasonFa: "تابستان",
    seasonEn: "Summer",
  },
  {
    id: 5,
    nameFa: "مرداد",
    nameEn: "Mordad",
    seasonFa: "تابستان",
    seasonEn: "Summer",
  },
  {
    id: 6,
    nameFa: "شهریور",
    nameEn: "Shahrivar",
    seasonFa: "تابستان",
    seasonEn: "Summer",
  },
  {
    id: 7,
    nameFa: "مهر",
    nameEn: "Mehr",
    seasonFa: "پاییز",
    seasonEn: "Autumn",
  },
  {
    id: 8,
    nameFa: "آبان",
    nameEn: "Aban",
    seasonFa: "پاییز",
    seasonEn: "Autumn",
  },
  {
    id: 9,
    nameFa: "آذر",
    nameEn: "Azar",
    seasonFa: "پاییز",
    seasonEn: "Autumn",
  },
  {
    id: 10,
    nameFa: "دی",
    nameEn: "Dey",
    seasonFa: "زمستان",
    seasonEn: "Winter",
  },
  {
    id: 11,
    nameFa: "بهمن",
    nameEn: "Bahman",
    seasonFa: "زمستان",
    seasonEn: "Winter",
  },
  {
    id: 12,
    nameFa: "اسفند",
    nameEn: "Esfand",
    seasonFa: "زمستان",
    seasonEn: "Winter",
  },
] as const

// ─── Helper Time Conversion ──────────────────────────────────────────────────

export function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function formatMinutesToTime(minutes: number): string {
  const normalized = Math.max(0, minutes)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/**
 * Returns the 1-based Jalali month (1 to 12) for a given Date (defaults to now).
 */
export function getCurrentJalaliMonth(date: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      month: "numeric",
    }).formatToParts(date)
    const monthPart = parts.find((p) => p.type === "month")
    const m = monthPart ? Number(monthPart.value) : 1
    return m >= 1 && m <= 12 ? m : 1
  } catch {
    return 1
  }
}

/**
 * Checks whether an operating phase is currently running / in use "these days"
 * based on the current Jalali month and whether the phase is active.
 */
export function isOperatingPhaseCurrent(
  phase: { months: number[]; isActive?: boolean },
  currentMonth: number = getCurrentJalaliMonth()
): boolean {
  if (phase.isActive === false) return false
  return Array.isArray(phase.months) && phase.months.includes(currentMonth)
}

// ─── Slot Calculation & Remainder Warning ─────────────────────────────────────

export interface PhaseGeneratedSlot {
  slotNumber: number
  startTime: string
  endTime: string
  durationMinutes: number
  shift?: 1 | 2
}

export interface PhaseBreakInfo {
  hasBreak: boolean
  startTime?: string
  endTime?: string
  durationMinutes?: number
}

export interface PhaseSlotsCalculationResult {
  totalSpanMinutes: number
  instructionalMinutes: number
  fullSlotsCount: number
  remainderMinutes: number
  shift1RemainderMinutes?: number
  shift2RemainderMinutes?: number
  slots: PhaseGeneratedSlot[]
  shift1Slots?: PhaseGeneratedSlot[]
  shift2Slots?: PhaseGeneratedSlot[]
  breakInfo?: PhaseBreakInfo
  hasWarning: boolean
  warningMessageFa?: string
  warningMessageEn?: string
}

export interface CalculatePhaseSlotsBreakOptions {
  hasBreak?: boolean
  breakStartTime?: string | null
  breakEndTime?: string | null
}

export function calculatePhaseSlots(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number = 90,
  breakOptions?: CalculatePhaseSlotsBreakOptions
): PhaseSlotsCalculationResult {
  const startM = parseTimeToMinutes(startTime)
  const endM = parseTimeToMinutes(endTime)

  if (
    startM === null ||
    endM === null ||
    endM <= startM ||
    slotDurationMinutes <= 0
  ) {
    return {
      totalSpanMinutes: 0,
      instructionalMinutes: 0,
      fullSlotsCount: 0,
      remainderMinutes: 0,
      slots: [],
      hasWarning: false,
    }
  }

  const totalSpanMinutes = endM - startM
  const hasBreak = Boolean(
    breakOptions?.hasBreak &&
    breakOptions?.breakStartTime &&
    breakOptions?.breakEndTime
  )

  if (!hasBreak) {
    const fullSlotsCount = Math.floor(totalSpanMinutes / slotDurationMinutes)
    const remainderMinutes = totalSpanMinutes % slotDurationMinutes

    const slots: PhaseGeneratedSlot[] = []
    for (let i = 0; i < fullSlotsCount; i++) {
      const slotStart = startM + i * slotDurationMinutes
      const slotEnd = slotStart + slotDurationMinutes
      slots.push({
        slotNumber: i + 1,
        startTime: formatMinutesToTime(slotStart),
        endTime: formatMinutesToTime(slotEnd),
        durationMinutes: slotDurationMinutes,
      })
    }

    const hasWarning = remainderMinutes > 0
    let warningMessageFa: string | undefined
    let warningMessageEn: string | undefined

    if (hasWarning) {
      warningMessageFa = `مجموع زمان این فاز (${totalSpanMinutes} دقیقه) بر طول جلسه (${slotDurationMinutes} دقیقه) بخش‌پذیر نیست. ${fullSlotsCount} زنگ کامل تشکیل می‌شود و ${remainderMinutes} دقیقه زمان مازاد در پایان فاز باقی می‌ماند.`
      warningMessageEn = `Total phase duration (${totalSpanMinutes} mins) is not evenly divisible by session duration (${slotDurationMinutes} mins). ${fullSlotsCount} full sessions are scheduled, leaving a remainder of ${remainderMinutes} minutes.`
    }

    return {
      totalSpanMinutes,
      instructionalMinutes: totalSpanMinutes,
      fullSlotsCount,
      remainderMinutes,
      slots,
      hasWarning,
      warningMessageFa,
      warningMessageEn,
    }
  }

  // Break window active
  const breakStartM = parseTimeToMinutes(breakOptions!.breakStartTime!)
  const breakEndM = parseTimeToMinutes(breakOptions!.breakEndTime!)

  if (
    breakStartM === null ||
    breakEndM === null ||
    startM >= breakStartM ||
    breakStartM >= breakEndM ||
    breakEndM >= endM
  ) {
    return {
      totalSpanMinutes,
      instructionalMinutes: 0,
      fullSlotsCount: 0,
      remainderMinutes: 0,
      slots: [],
      hasWarning: true,
      warningMessageFa:
        "بازه استراحت و ناهار باید بین زمان شروع و پایان فاز باشد و ساعت پایان استراحت بعد از ساعت شروع آن باشد.",
      warningMessageEn:
        "Break window must fall within the phase start and end times, and break end must be after break start.",
    }
  }

  // Shift 1 (pre-break)
  const shift1Duration = breakStartM - startM
  const shift1SlotsCount = Math.floor(shift1Duration / slotDurationMinutes)
  const shift1Remainder = shift1Duration % slotDurationMinutes

  const shift1Slots: PhaseGeneratedSlot[] = []
  for (let i = 0; i < shift1SlotsCount; i++) {
    const slotStart = startM + i * slotDurationMinutes
    const slotEnd = slotStart + slotDurationMinutes
    shift1Slots.push({
      slotNumber: i + 1,
      startTime: formatMinutesToTime(slotStart),
      endTime: formatMinutesToTime(slotEnd),
      durationMinutes: slotDurationMinutes,
      shift: 1,
    })
  }

  // Break interval
  const breakDuration = breakEndM - breakStartM

  // Shift 2 (post-break)
  const shift2Duration = endM - breakEndM
  const shift2SlotsCount = Math.floor(shift2Duration / slotDurationMinutes)
  const shift2Remainder = shift2Duration % slotDurationMinutes

  const shift2Slots: PhaseGeneratedSlot[] = []
  for (let j = 0; j < shift2SlotsCount; j++) {
    const slotStart = breakEndM + j * slotDurationMinutes
    const slotEnd = slotStart + slotDurationMinutes
    shift2Slots.push({
      slotNumber: shift1SlotsCount + j + 1,
      startTime: formatMinutesToTime(slotStart),
      endTime: formatMinutesToTime(slotEnd),
      durationMinutes: slotDurationMinutes,
      shift: 2,
    })
  }

  const slots = [...shift1Slots, ...shift2Slots]
  const fullSlotsCount = shift1SlotsCount + shift2SlotsCount
  const remainderMinutes = shift1Remainder + shift2Remainder
  const instructionalMinutes = shift1Duration + shift2Duration
  const hasWarning = remainderMinutes > 0

  let warningMessageFa: string | undefined
  let warningMessageEn: string | undefined

  if (hasWarning) {
    const faParts: string[] = []
    const enParts: string[] = []
    if (shift1Remainder > 0) {
      faParts.push(`شیفت اول دارای ${shift1Remainder} دقیقه زمان مازاد است`)
      enParts.push(`Shift 1 has ${shift1Remainder}m excess`)
    }
    if (shift2Remainder > 0) {
      faParts.push(`شیفت دوم دارای ${shift2Remainder} دقیقه زمان مازاد است`)
      enParts.push(`Shift 2 has ${shift2Remainder}m excess`)
    }
    warningMessageFa = faParts.join(" و ") + " که برای یک زنگ کامل کافی نیست."
    warningMessageEn = enParts.join(", ") + "."
  }

  return {
    totalSpanMinutes,
    instructionalMinutes,
    fullSlotsCount,
    remainderMinutes,
    shift1RemainderMinutes: shift1Remainder,
    shift2RemainderMinutes: shift2Remainder,
    slots,
    shift1Slots,
    shift2Slots,
    breakInfo: {
      hasBreak: true,
      startTime: formatMinutesToTime(breakStartM),
      endTime: formatMinutesToTime(breakEndM),
      durationMinutes: breakDuration,
    },
    hasWarning,
    warningMessageFa,
    warningMessageEn,
  }
}

// ─── Smart Break Suggestion ──────────────────────────────────────────────────

export interface SuggestedPhaseBreakWindow {
  breakStartTime: string
  breakEndTime: string
  breakDurationMinutes: number
}

/**
 * Suggests an optimal mid-shift break / lunch window based on shift start time,
 * shift end time, and session duration.
 *
 * Requirements & Principles:
 * 1. Maximum break duration is capped at `maxBreakMinutes` (default 60 minutes).
 * 2. Break starts exactly at the boundary of a full Shift 1 slot (prevents truncated classes).
 * 3. Shifts 1 and 2 are balanced around daytime lunch hour (12:30-13:30) or shift midpoint.
 * 4. Break duration is selected to minimize total unused remainder minutes in Shift 2.
 */
export function suggestPhaseBreakWindow(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number = 90,
  maxBreakMinutes: number = 60
): SuggestedPhaseBreakWindow {
  const defaultResult: SuggestedPhaseBreakWindow = {
    breakStartTime: "13:00",
    breakEndTime: "14:00",
    breakDurationMinutes: 60,
  }

  const startM = parseTimeToMinutes(startTime)
  const endM = parseTimeToMinutes(endTime)

  if (
    startM === null ||
    endM === null ||
    endM <= startM ||
    slotDurationMinutes <= 0
  ) {
    return defaultResult
  }

  const totalSpan = endM - startM
  const effectiveMaxBreak = Math.max(15, Math.min(60, maxBreakMinutes))

  // If total span cannot fit at least two slots + minimal break (e.g. 15 mins)
  if (totalSpan < 2 * slotDurationMinutes + 15) {
    const mid = startM + Math.floor(totalSpan / 2)
    const duration = Math.min(
      effectiveMaxBreak,
      Math.max(15, Math.floor(totalSpan / 4))
    )
    const bStart = Math.max(startM + 15, mid - Math.floor(duration / 2))
    const bEnd = Math.min(endM - 15, bStart + duration)
    return {
      breakStartTime: formatMinutesToTime(bStart),
      breakEndTime: formatMinutesToTime(bEnd),
      breakDurationMinutes: bEnd - bStart,
    }
  }

  // Target mid-shift: If daytime shift (starts <= 11:30 and ends >= 14:30), target lunch around 12:30
  const isDaytimeShift = startM <= 11 * 60 + 30 && endM >= 14 * 60 + 30
  const targetLunchStart = isDaytimeShift
    ? 12 * 60 + 30
    : startM + Math.floor(totalSpan / 2) - Math.floor(effectiveMaxBreak / 2)

  let bestCandidate: {
    breakStartM: number
    breakDuration: number
    score: number
  } | null = null

  // Candidate slot counts for Shift 1 (k >= 1)
  const maxSlotsShift1 = Math.max(
    1,
    Math.floor((totalSpan - 15 - slotDurationMinutes) / slotDurationMinutes)
  )

  for (let k = 1; k <= maxSlotsShift1; k++) {
    const breakStart = startM + k * slotDurationMinutes
    const remainingTime = endM - breakStart

    // Determine candidate break durations
    const candidateDurations = new Set<number>()

    if (effectiveMaxBreak <= remainingTime - slotDurationMinutes) {
      candidateDurations.add(effectiveMaxBreak)
    }

    for (const d of [45, 30]) {
      if (d <= effectiveMaxBreak && d <= remainingTime - slotDurationMinutes) {
        candidateDurations.add(d)
      }
    }

    // Exact remainder absorption if it falls cleanly within [15, effectiveMaxBreak]
    const exactAbsorb = remainingTime % slotDurationMinutes
    if (
      exactAbsorb >= 15 &&
      exactAbsorb <= effectiveMaxBreak &&
      remainingTime - exactAbsorb >= slotDurationMinutes
    ) {
      candidateDurations.add(exactAbsorb)
    }

    for (const duration of candidateDurations) {
      const breakEnd = breakStart + duration
      const shift2Duration = endM - breakEnd
      const shift2Slots = Math.floor(shift2Duration / slotDurationMinutes)

      if (shift2Slots < 1) continue

      const shift2Remainder = shift2Duration % slotDurationMinutes

      // Distance penalty from target lunch/mid-shift
      const distancePenalty = Math.abs(breakStart - targetLunchStart)

      // Remainder penalty (prefer 0 or minimal remainder in Shift 2)
      const remainderPenalty = shift2Remainder * 1.5

      // Slot balance penalty between shifts
      const balancePenalty = Math.abs(k - shift2Slots) * 20

      // Duration preference: reward standard 60-minute break
      const durationBonus = duration === effectiveMaxBreak ? 15 : 0

      const score =
        distancePenalty + remainderPenalty + balancePenalty - durationBonus

      if (!bestCandidate || score < bestCandidate.score) {
        bestCandidate = {
          breakStartM: breakStart,
          breakDuration: duration,
          score,
        }
      }
    }
  }

  if (!bestCandidate) {
    return defaultResult
  }

  return {
    breakStartTime: formatMinutesToTime(bestCandidate.breakStartM),
    breakEndTime: formatMinutesToTime(
      bestCandidate.breakStartM + bestCandidate.breakDuration
    ),
    breakDurationMinutes: bestCandidate.breakDuration,
  }
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createCreateOperatingPhaseSchema = (msg?: {
  titleMin?: string
  monthsRequired?: string
  startTimeInvalid?: string
  endTimeInvalid?: string
  timeOrderInvalid?: string
  durationRange?: string
  daysRequired?: string
  breakRequired?: string
  breakOrderInvalid?: string
  breakStartTimeInvalid?: string
  breakEndTimeInvalid?: string
}) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined),
      months: z
        .array(z.number().int().min(1).max(12))
        .min(
          1,
          msg?.monthsRequired ? { message: msg.monthsRequired } : undefined
        ),
      startTime: z
        .string()
        .regex(
          timeRegex,
          msg?.startTimeInvalid ? { message: msg.startTimeInvalid } : undefined
        ),
      endTime: z
        .string()
        .regex(
          timeRegex,
          msg?.endTimeInvalid ? { message: msg.endTimeInvalid } : undefined
        ),
      slotDurationMinutes: z
        .number()
        .int()
        .min(
          15,
          msg?.durationRange ? { message: msg.durationRange } : undefined
        )
        .max(
          240,
          msg?.durationRange ? { message: msg.durationRange } : undefined
        )
        .default(90),
      daysOfWeek: z
        .array(z.enum(WEEK_DAYS))
        .min(1, msg?.daysRequired ? { message: msg.daysRequired } : undefined)
        .default([
          "SATURDAY",
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
        ]),
      hasBreak: z.boolean().default(false).optional(),
      breakStartTime: z
        .string()
        .regex(
          timeRegex,
          msg?.breakStartTimeInvalid
            ? { message: msg.breakStartTimeInvalid }
            : undefined
        )
        .optional()
        .nullable(),
      breakEndTime: z
        .string()
        .regex(
          timeRegex,
          msg?.breakEndTimeInvalid
            ? { message: msg.breakEndTimeInvalid }
            : undefined
        )
        .optional()
        .nullable(),
      isActive: z.boolean().default(true),
      order: z.number().int().default(0),
      instituteId: z.string().uuid().optional(),
    })
    .refine(
      (data) => {
        const start = parseTimeToMinutes(data.startTime)
        const end = parseTimeToMinutes(data.endTime)
        if (start === null || end === null) return false
        return start < end
      },
      {
        message:
          msg?.timeOrderInvalid ?? "ساعت پایان باید بعد از ساعت شروع باشد",
        path: ["endTime"],
      }
    )
    .refine(
      (data) => {
        if (!data.hasBreak) return true
        return Boolean(data.breakStartTime && data.breakEndTime)
      },
      {
        message:
          msg?.breakRequired ??
          "در صورت فعال بودن استراحت، ساعت شروع و پایان استراحت الزامی است",
        path: ["breakStartTime"],
      }
    )
    .refine(
      (data) => {
        if (!data.hasBreak || !data.breakStartTime || !data.breakEndTime)
          return true
        const start = parseTimeToMinutes(data.startTime)
        const breakStart = parseTimeToMinutes(data.breakStartTime)
        const breakEnd = parseTimeToMinutes(data.breakEndTime)
        const end = parseTimeToMinutes(data.endTime)

        if (
          start === null ||
          breakStart === null ||
          breakEnd === null ||
          end === null
        ) {
          return false
        }
        return start < breakStart && breakStart < breakEnd && breakEnd < end
      },
      {
        message:
          msg?.breakOrderInvalid ??
          "بازه استراحت باید بین زمان شروع و پایان فاز باشد و ساعت پایان استراحت بعد از شروع آن باشد",
        path: ["breakEndTime"],
      }
    )

export const CreateOperatingPhaseSchema = createCreateOperatingPhaseSchema()
export type CreateOperatingPhaseInput = z.infer<
  typeof CreateOperatingPhaseSchema
>

export const createUpdateOperatingPhaseSchema = (msg?: {
  titleMin?: string
  monthsRequired?: string
  startTimeInvalid?: string
  endTimeInvalid?: string
  timeOrderInvalid?: string
  durationRange?: string
  daysRequired?: string
  breakRequired?: string
  breakOrderInvalid?: string
  breakStartTimeInvalid?: string
  breakEndTimeInvalid?: string
}) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2, msg?.titleMin ? { message: msg.titleMin } : undefined)
        .optional(),
      months: z
        .array(z.number().int().min(1).max(12))
        .min(
          1,
          msg?.monthsRequired ? { message: msg.monthsRequired } : undefined
        )
        .optional(),
      startTime: z
        .string()
        .regex(
          timeRegex,
          msg?.startTimeInvalid ? { message: msg.startTimeInvalid } : undefined
        )
        .optional(),
      endTime: z
        .string()
        .regex(
          timeRegex,
          msg?.endTimeInvalid ? { message: msg.endTimeInvalid } : undefined
        )
        .optional(),
      slotDurationMinutes: z
        .number()
        .int()
        .min(
          15,
          msg?.durationRange ? { message: msg.durationRange } : undefined
        )
        .max(
          240,
          msg?.durationRange ? { message: msg.durationRange } : undefined
        )
        .optional(),
      daysOfWeek: z
        .array(z.enum(WEEK_DAYS))
        .min(1, msg?.daysRequired ? { message: msg.daysRequired } : undefined)
        .optional(),
      hasBreak: z.boolean().optional(),
      breakStartTime: z
        .string()
        .regex(
          timeRegex,
          msg?.breakStartTimeInvalid
            ? { message: msg.breakStartTimeInvalid }
            : undefined
        )
        .optional()
        .nullable(),
      breakEndTime: z
        .string()
        .regex(
          timeRegex,
          msg?.breakEndTimeInvalid
            ? { message: msg.breakEndTimeInvalid }
            : undefined
        )
        .optional()
        .nullable(),
      isActive: z.boolean().optional(),
      order: z.number().int().optional(),
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          const start = parseTimeToMinutes(data.startTime)
          const end = parseTimeToMinutes(data.endTime)
          if (start !== null && end !== null) {
            return start < end
          }
        }
        return true
      },
      {
        message:
          msg?.timeOrderInvalid ?? "ساعت پایان باید بعد از ساعت شروع باشد",
        path: ["endTime"],
      }
    )
    .refine(
      (data) => {
        if (data.hasBreak === false) return true
        if (data.hasBreak && (!data.breakStartTime || !data.breakEndTime))
          return false
        if (data.breakStartTime && data.breakEndTime) {
          const breakStart = parseTimeToMinutes(data.breakStartTime)
          const breakEnd = parseTimeToMinutes(data.breakEndTime)
          if (
            breakStart !== null &&
            breakEnd !== null &&
            breakStart >= breakEnd
          ) {
            return false
          }
        }
        return true
      },
      {
        message:
          msg?.breakOrderInvalid ??
          "ساعت پایان استراحت باید بعد از ساعت شروع استراحت باشد",
        path: ["breakEndTime"],
      }
    )

export const UpdateOperatingPhaseSchema = createUpdateOperatingPhaseSchema()
export type UpdateOperatingPhaseInput = z.infer<
  typeof UpdateOperatingPhaseSchema
>

export const OperatingPhaseSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  title: z.string(),
  months: z.array(z.number().int()),
  startTime: z.string(),
  endTime: z.string(),
  slotDurationMinutes: z.number().int(),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)),
  hasBreak: z.boolean().default(false),
  breakStartTime: z.string().nullable().optional(),
  breakEndTime: z.string().nullable().optional(),
  isActive: z.boolean(),
  order: z.number().int(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type OperatingPhase = z.infer<typeof OperatingPhaseSchema>

export interface OperatingPhaseWithSlots extends OperatingPhase {
  calculation: PhaseSlotsCalculationResult
}

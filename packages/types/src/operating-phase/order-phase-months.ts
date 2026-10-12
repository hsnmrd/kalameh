/**
 * Orders an array of Jalali month numbers (1-12) to match their natural temporal
 * sequence in academic and operating phase calendars.
 *
 * For example:
 * - [1, 2, 3, 7, 8, 9, 10, 11, 12] (Academic phase covering Autumn, Winter, Spring with Summer off)
 *   becomes [7, 8, 9, 10, 11, 12, 1, 2, 3] (starting at Mehr 1, wrapping to Khordad).
 * - [1, 2, 10, 11, 12] (Winter-to-Spring wrap) becomes [10, 11, 12, 1, 2].
 * - Standard single seasons ([1, 2, 3], [4, 5, 6], [7, 8, 9]) remain unchanged.
 * - Full year ([1..12]) starts at Farvardin (1).
 */
export function orderPhaseMonths(months: number[]): number[] {
  if (!months || months.length === 0) return []
  const set = new Set(months)
  if (set.size === 12) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }

  const prevMonth = (m: number) => (m === 1 ? 12 : m - 1)
  const nextMonth = (m: number) => (m === 12 ? 1 : m + 1)

  // Find all circular segment starts (months whose circular predecessor is NOT in the set)
  const segmentStarts = months.filter((m) => !set.has(prevMonth(m)))

  if (segmentStarts.length === 0) {
    return [...months].sort((a, b) => a - b)
  }

  // If there's a segment start at Mehr (7), prioritize starting there (standard Iranian academic year).
  // Otherwise, if month 1 is a segment start, start at 1. Otherwise use the first segment start.
  const startAt7 = segmentStarts.find((s) => s === 7)
  const fallbackStart = segmentStarts[0] ?? months[0] ?? 1
  const preferredStart: number =
    startAt7 ?? (segmentStarts.includes(1) ? 1 : fallbackStart)

  const result: number[] = []
  let cur: number = preferredStart
  for (let i = 0; i < 12; i++) {
    if (set.has(cur)) {
      result.push(cur)
    }
    cur = nextMonth(cur)
  }
  return result
}

export interface PhaseTimelineMonth {
  year: number
  month: number
}

/**
 * Builds the ordered sequence of (year, month) pairs covering the phase timeline,
 * correctly handling year wrap when lastMonth < firstMonth (e.g. 7..12 in jalaliYear, 1..3 in jalaliYear + 1).
 */
export function getPhaseMonthTimeline(
  orderedMonths: number[],
  jalaliYear: number
): PhaseTimelineMonth[] {
  if (!orderedMonths || orderedMonths.length === 0) return []
  const firstMonth = orderedMonths[0] ?? 1
  const lastMonth = orderedMonths[orderedMonths.length - 1] ?? 12
  const wraps = lastMonth < firstMonth

  let currentYear = jalaliYear
  let hasWrapped = false
  const timeline: PhaseTimelineMonth[] = []

  for (const m of orderedMonths) {
    if (wraps && !hasWrapped && m < firstMonth) {
      currentYear = jalaliYear + 1
      hasWrapped = true
    }
    timeline.push({ year: currentYear, month: m })
  }
  return timeline
}

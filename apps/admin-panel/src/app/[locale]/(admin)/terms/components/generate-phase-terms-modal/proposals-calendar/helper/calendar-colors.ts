import { isJalaliHoliday, type GeneratedTermProposal } from "@workspace/types"

export interface TermColorTheme {
  id: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dotColor: string
  rangeClass: string
  startClass: string
  endClass: string
  accentColor: string
}

export const TERM_COLOR_PALETTES: TermColorTheme[] = [
  {
    id: "blue",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-500/30",
    dotColor: "bg-blue-600",
    accentColor: "#2563eb",
    rangeClass:
      "[&>button]:!bg-blue-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-blue-400/40",
    endClass:
      "[&>button]:!bg-blue-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-blue-500/50",
  },
  {
    id: "emerald",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-500/30",
    dotColor: "bg-emerald-600",
    accentColor: "#059669",
    rangeClass:
      "[&>button]:!bg-emerald-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-emerald-400/40",
    endClass:
      "[&>button]:!bg-emerald-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-emerald-500/50",
  },
  {
    id: "purple",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-500/30",
    dotColor: "bg-purple-600",
    accentColor: "#7c3aed",
    rangeClass:
      "[&>button]:!bg-purple-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-purple-400/40",
    endClass:
      "[&>button]:!bg-purple-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-purple-500/50",
  },
  {
    id: "amber",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-500/30",
    dotColor: "bg-amber-600",
    accentColor: "#d97706",
    rangeClass:
      "[&>button]:!bg-amber-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-amber-400/40",
    endClass:
      "[&>button]:!bg-amber-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-amber-500/50",
  },
  {
    id: "cyan",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-700",
    badgeBorder: "border-cyan-500/30",
    dotColor: "bg-cyan-600",
    accentColor: "#0891b2",
    rangeClass:
      "[&>button]:!bg-cyan-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-cyan-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-cyan-400/40",
    endClass:
      "[&>button]:!bg-cyan-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-cyan-500/50",
  },
  {
    id: "rose",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-600",
    accentColor: "#e11d48",
    rangeClass:
      "[&>button]:!bg-rose-500/25 [&>button]:text-foreground [&>button]:font-medium",
    startClass:
      "[&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:font-bold [&>button]:shadow-xs [&>button]:ring-2 [&>button]:ring-rose-400/40",
    endClass:
      "[&>button]:!bg-rose-500/30 [&>button]:text-foreground [&>button]:font-bold [&>button]:ring-1 [&>button]:ring-rose-500/50",
  },
]

export function getTermColorTheme(index: number): TermColorTheme {
  const palette = TERM_COLOR_PALETTES[index % TERM_COLOR_PALETTES.length]
  return palette || TERM_COLOR_PALETTES[0]!
}

export function normalizeDateToYmd(d: Date | string): string {
  if (typeof d === "string") {
    return d.split("T")[0] || ""
  }
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface TermCalendarModifiersResult {
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
}

export function buildTermCalendarModifiers(
  proposals: GeneratedTermProposal[]
): TermCalendarModifiersResult {
  const modifiers: Record<string, (date: Date) => boolean> = {}
  const modifiersClassNames: Record<string, string> = {}

  // 1. Term range, start date, and end date modifiers
  proposals.forEach((term, index) => {
    const theme = getTermColorTheme(index)
    const startYmd = normalizeDateToYmd(term.startDate)
    const endYmd = normalizeDateToYmd(term.endDate)

    const rangeKey = `term_${index}_range`
    const startKey = `term_${index}_start`
    const endKey = `term_${index}_end`

    modifiers[rangeKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd >= startYmd && ymd <= endYmd
    }

    modifiers[startKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd === startYmd
    }

    modifiers[endKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd === endYmd
    }

    modifiersClassNames[rangeKey] = theme.rangeClass
    modifiersClassNames[startKey] = theme.startClass
    modifiersClassNames[endKey] = theme.endClass
  })

  // 2. Off days inside any proposed term's range (Friday weekend or official Jalali holiday)
  modifiers.term_offDay = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    const isInsideAny = proposals.some((p) => {
      const s = normalizeDateToYmd(p.startDate)
      const e = normalizeDateToYmd(p.endDate)
      return ymd >= s && ymd <= e
    })
    if (!isInsideAny) return false

    // Retain solid accent styling for selected start dates
    const isStart = proposals.some(
      (p) => normalizeDateToYmd(p.startDate) === ymd
    )
    if (isStart) return false

    return date.getDay() === 5 || isJalaliHoliday(date).isHoliday
  }

  // 3. Official Jalali holidays inside any proposed term's range (displays dedicated indicator dot)
  modifiers.term_officialHoliday = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    const isInsideAny = proposals.some((p) => {
      const s = normalizeDateToYmd(p.startDate)
      const e = normalizeDateToYmd(p.endDate)
      return ymd >= s && ymd <= e
    })
    if (!isInsideAny) return false

    const isStart = proposals.some(
      (p) => normalizeDateToYmd(p.startDate) === ymd
    )
    if (isStart) return false

    return isJalaliHoliday(date).isHoliday
  }

  modifiersClassNames.term_offDay =
    "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:border [&>button]:border-dashed [&>button]:border-destructive/60 hover:[&>button]:!bg-destructive/15"

  modifiersClassNames.term_officialHoliday =
    "[&>button]:!text-destructive [&>button]:!font-black [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1.5 [&>button]:after:rounded-full [&>button]:after:bg-destructive"

  return { modifiers, modifiersClassNames }
}

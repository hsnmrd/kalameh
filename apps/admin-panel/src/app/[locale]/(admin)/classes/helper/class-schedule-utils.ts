import type { ClassDto, TeacherDto, WeekDay } from "@workspace/types"

export const JS_DAY_TO_WEEKDAY: Record<number, WeekDay> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
}

export interface ScheduleWindowInput {
  daysOfWeek?: string[] | null
  sessionDates?: string[] | null
  startTime?: string | null
  endTime?: string | null
}

export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(":")
  const hours = Number.parseInt(parts[0] ?? "", 10)
  const minutes = Number.parseInt(parts[1] ?? "", 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

export function hasTimeOverlap(
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null
): boolean {
  const sA = parseTimeToMinutes(startA)
  const eA = parseTimeToMinutes(endA)
  const sB = parseTimeToMinutes(startB)
  const eB = parseTimeToMinutes(endB)
  if (sA === null || eA === null || sB === null || eB === null) return false
  return sA < eB && sB < eA
}

export function normalizeTeacherName(name?: string | null): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/\u064A/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/\u0649/g, "\u06CC")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

export function parseDateKeyToWeekday(dateStr: string): WeekDay | null {
  const normalized = dateStr.slice(0, 10)
  const parts = normalized.split("-")
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!y || !m || !d) return null
  const dateObj = new Date(y, m - 1, d)
  if (Number.isNaN(dateObj.getTime())) return null
  return JS_DAY_TO_WEEKDAY[dateObj.getDay()] ?? null
}

export function formatClassScheduleString(
  cls: Pick<ClassDto, "schedule" | "daysOfWeek" | "startTime" | "endTime">,
  translateDay: (day: string) => string
): string {
  if (cls.schedule && cls.schedule.trim().length > 0) {
    return cls.schedule
  }
  const days = cls.daysOfWeek ?? []
  if (days.length === 0) return ""
  const dayNames = days.map((d) => translateDay(d)).join("، ")
  if (cls.startTime && cls.endTime) {
    return `${dayNames} (${cls.startTime} - ${cls.endTime})`
  }
  if (cls.startTime) {
    return `${dayNames} (${cls.startTime})`
  }
  return dayNames
}

export function getCollidingDatesBetweenSchedules(
  scheduleA: ScheduleWindowInput,
  scheduleB: ScheduleWindowInput
): string[] {
  const daysA = scheduleA.daysOfWeek ?? []
  const sessionsA = (scheduleA.sessionDates ?? []).map((d) => d.slice(0, 10))
  const daysB = scheduleB.daysOfWeek ?? []
  const sessionsB = (scheduleB.sessionDates ?? []).map((d) => d.slice(0, 10))

  const colliding = new Set<string>()

  if (sessionsA.length > 0 && sessionsB.length > 0) {
    const setB = new Set(sessionsB)
    for (const d of sessionsA) {
      if (setB.has(d)) colliding.add(d)
    }
    return Array.from(colliding).sort()
  }

  if (sessionsA.length > 0 && daysB.length > 0) {
    const setB = new Set(daysB)
    for (const dateStr of sessionsA) {
      const weekday = parseDateKeyToWeekday(dateStr)
      if (weekday && setB.has(weekday)) colliding.add(dateStr)
    }
    return Array.from(colliding).sort()
  }

  if (daysA.length > 0 && sessionsB.length > 0) {
    const setA = new Set(daysA)
    for (const dateStr of sessionsB) {
      const weekday = parseDateKeyToWeekday(dateStr)
      if (weekday && setA.has(weekday)) colliding.add(dateStr)
    }
    return Array.from(colliding).sort()
  }

  if (daysA.length > 0 && daysB.length > 0) {
    const setB = new Set(daysB)
    for (const day of daysA) {
      if (setB.has(day)) colliding.add(day)
    }
    return Array.from(colliding).sort()
  }

  return []
}

export function findTeacherFreeTimeViolations(
  teacher: TeacherDto | null | undefined,
  schedule: ScheduleWindowInput
): string[] {
  if (!teacher || !schedule.startTime || !schedule.endTime) return []
  const availabilities = teacher.teacherProfile?.availabilities ?? []
  if (availabilities.length === 0) return []

  const violations = new Set<string>()
  const startMin = parseTimeToMinutes(schedule.startTime)
  const endMin = parseTimeToMinutes(schedule.endTime)
  if (startMin === null || endMin === null) return []

  const fitsDay = (day: string) => {
    const slots = availabilities.filter((a) => a.dayOfWeek === day)
    return slots.some((slot) => {
      const slotStart = parseTimeToMinutes(slot.startTime)
      const slotEnd = parseTimeToMinutes(slot.endTime)
      return (
        slotStart !== null &&
        slotEnd !== null &&
        slotStart <= startMin &&
        slotEnd >= endMin
      )
    })
  }

  for (const day of schedule.daysOfWeek ?? []) {
    if (!fitsDay(day)) violations.add(day)
  }

  for (const rawDate of schedule.sessionDates ?? []) {
    const dateKey = rawDate.slice(0, 10)
    const weekday = parseDateKeyToWeekday(dateKey)
    if (weekday && !fitsDay(weekday)) violations.add(dateKey)
  }

  return Array.from(violations).sort()
}

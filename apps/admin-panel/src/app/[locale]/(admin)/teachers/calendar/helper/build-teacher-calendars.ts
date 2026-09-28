import {
  WEEK_DAYS,
  type ClassDto,
  type SchedulingTeacherCalendar,
  type TeacherDto,
  type WeekDay,
} from "@workspace/types"

interface TimeWindow {
  dayOfWeek: WeekDay
  startTime: string
  endTime: string
}

interface BusySlot extends TimeWindow {
  id: string
  title: string | null
  source: "EXISTING_CLASS"
}

function maxTime(a: string, b: string): string {
  return a >= b ? a : b
}

function minTime(a: string, b: string): string {
  return a <= b ? a : b
}

function subtractBusy(window: TimeWindow, busy: BusySlot[]): TimeWindow[] {
  const conflicts = busy
    .filter(
      (slot) =>
        slot.dayOfWeek === window.dayOfWeek &&
        slot.startTime < window.endTime &&
        window.startTime < slot.endTime
    )
    .sort((left, right) => left.startTime.localeCompare(right.startTime))

  const free: TimeWindow[] = []
  let cursor = window.startTime

  for (const conflict of conflicts) {
    const conflictStart = maxTime(cursor, conflict.startTime)
    const conflictEnd = minTime(window.endTime, conflict.endTime)
    if (cursor < conflictStart) {
      free.push({
        dayOfWeek: window.dayOfWeek,
        startTime: cursor,
        endTime: conflictStart,
      })
    }
    cursor = maxTime(cursor, conflictEnd)
  }

  if (cursor < window.endTime) {
    free.push({
      dayOfWeek: window.dayOfWeek,
      startTime: cursor,
      endTime: window.endTime,
    })
  }

  return free
}

export function buildTeacherCalendars(
  teachers: TeacherDto[],
  classes: ClassDto[]
): SchedulingTeacherCalendar[] {
  return teachers.map((teacher) => {
    const availabilities = teacher.teacherProfile?.availabilities ?? []
    const teachableCourses =
      teacher.teacherProfile?.teachableCourses?.map((tc) => tc.course) ?? []

    const teacherClasses = classes.filter(
      (c) => c.teacherId === teacher.id && c.startTime && c.endTime
    )

    const busySlots: BusySlot[] = teacherClasses.flatMap((cls) => {
      const days = cls.daysOfWeek as WeekDay[]
      return days.map((dayOfWeek) => ({
        id: cls.id,
        dayOfWeek,
        startTime: cls.startTime!,
        endTime: cls.endTime!,
        title: cls.title,
        source: "EXISTING_CLASS" as const,
      }))
    })

    const freeSlots: TimeWindow[] = availabilities.flatMap((avail) => {
      const window: TimeWindow = {
        dayOfWeek: avail.dayOfWeek as WeekDay,
        startTime: avail.startTime,
        endTime: avail.endTime,
      }
      return subtractBusy(window, busySlots)
    })

    const slots = [
      ...busySlots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "BUSY" as const,
        title: slot.title,
        source: slot.source,
      })),
      ...freeSlots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "FREE" as const,
        title: null,
        source: "AVAILABILITY" as const,
      })),
    ].sort(
      (left, right) =>
        WEEK_DAYS.indexOf(left.dayOfWeek) -
          WEEK_DAYS.indexOf(right.dayOfWeek) ||
        left.startTime.localeCompare(right.startTime) ||
        left.endTime.localeCompare(right.endTime) ||
        left.status.localeCompare(right.status)
    )

    return {
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      },
      teachableCourses,
      slots,
    }
  })
}

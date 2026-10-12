import type {
  ClassConflictItem,
  ClassConflictResult,
  ClassDto,
  TeacherDto,
  TermDto,
  WeekDay,
} from "@workspace/types"
import {
  JS_DAY_TO_WEEKDAY,
  findTeacherFreeTimeViolations,
  formatClassScheduleString,
  getCollidingDatesBetweenSchedules,
  hasTimeOverlap,
  normalizeTeacherName,
  parseDateKeyToWeekday,
  parseTimeToMinutes,
  type ScheduleWindowInput,
} from "./class-schedule-utils"

export {
  findTeacherFreeTimeViolations,
  formatClassScheduleString,
  getCollidingDatesBetweenSchedules,
  hasTimeOverlap,
  normalizeTeacherName,
  parseDateKeyToWeekday,
  parseTimeToMinutes,
  type ScheduleWindowInput,
}

export type TeacherConflictReason =
  | {
      type: "TEACHER_CLASS"
      conflictingClass: ClassDto
      collidingDates: string[]
    }
  | {
      type: "TEACHER_FREE_TIME"
      violatingDates: string[]
    }

export function findTeacherScheduleConflict(
  teacher: TeacherDto,
  schedule: ScheduleWindowInput,
  termClasses: ClassDto[],
  excludeClassId?: string | null
): TeacherConflictReason | null {
  if (!schedule.startTime || !schedule.endTime) return null
  const hasDaysOrDates =
    (schedule.daysOfWeek?.length ?? 0) > 0 ||
    (schedule.sessionDates?.length ?? 0) > 0
  if (!hasDaysOrDates) return null

  const teacherFullName = normalizeTeacherName(
    `${teacher.firstName} ${teacher.lastName}`
  )

  for (const other of termClasses) {
    if (excludeClassId && other.id === excludeClassId) continue
    if (!other.startTime || !other.endTime) continue

    const isSameTeacher =
      (other.teacherId && other.teacherId === teacher.id) ||
      (other.teacherName &&
        normalizeTeacherName(other.teacherName) === teacherFullName)

    if (!isSameTeacher) continue
    if (
      !hasTimeOverlap(
        schedule.startTime,
        schedule.endTime,
        other.startTime,
        other.endTime
      )
    ) {
      continue
    }

    const collidingDates = getCollidingDatesBetweenSchedules(schedule, other)
    if (collidingDates.length > 0) {
      return {
        type: "TEACHER_CLASS",
        conflictingClass: other,
        collidingDates,
      }
    }
  }

  const freeTimeViolations = findTeacherFreeTimeViolations(teacher, schedule)
  if (freeTimeViolations.length > 0) {
    return {
      type: "TEACHER_FREE_TIME",
      violatingDates: freeTimeViolations,
    }
  }

  return null
}

export interface ClassroomConflictReason {
  type: "CLASSROOM"
  conflictingClass: ClassDto
  collidingDates: string[]
}

export function findClassroomScheduleConflict(
  classroomId: string | null | undefined,
  schedule: ScheduleWindowInput,
  termClasses: ClassDto[],
  excludeClassId?: string | null
): ClassroomConflictReason | null {
  if (!classroomId || classroomId === "NONE" || classroomId === "REMOTE") {
    return null
  }
  if (!schedule.startTime || !schedule.endTime) return null
  const hasDaysOrDates =
    (schedule.daysOfWeek?.length ?? 0) > 0 ||
    (schedule.sessionDates?.length ?? 0) > 0
  if (!hasDaysOrDates) return null

  for (const other of termClasses) {
    if (excludeClassId && other.id === excludeClassId) continue
    if (!other.classroomId || other.classroomId !== classroomId) continue
    if (!other.startTime || !other.endTime) continue
    if (
      !hasTimeOverlap(
        schedule.startTime,
        schedule.endTime,
        other.startTime,
        other.endTime
      )
    ) {
      continue
    }

    const collidingDates = getCollidingDatesBetweenSchedules(schedule, other)
    if (collidingDates.length > 0) {
      return {
        type: "CLASSROOM",
        conflictingClass: other,
        collidingDates,
      }
    }
  }

  return null
}

export interface ComputeLocalScheduleConflictsParams {
  term?: TermDto | null
  termClasses?: ClassDto[]
  teacher?: TeacherDto | null
  teacherId?: string | null
  teacherName?: string | null
  classroomId?: string | null
  startTime?: string | null
  endTime?: string | null
  daysOfWeek?: string[] | null
  sessionDates?: string[] | null
  excludeClassId?: string | null
  formatClassroomConflictMessage: (classTitle: string) => string
  formatTeacherConflictMessage: (classTitle: string) => string
  formatTeacherFreeTimeMessage: (teacherName: string) => string
}

export interface LocalScheduleConflictAnalysis {
  conflictResult: ClassConflictResult | null
  occupiedDateReasons: Map<string, string>
}

export function computeLocalScheduleConflicts(
  params: ComputeLocalScheduleConflictsParams
): LocalScheduleConflictAnalysis {
  const {
    term,
    termClasses = [],
    teacher,
    teacherId,
    teacherName,
    classroomId,
    startTime,
    endTime,
    daysOfWeek = [],
    sessionDates = [],
    excludeClassId,
    formatClassroomConflictMessage,
    formatTeacherConflictMessage,
    formatTeacherFreeTimeMessage,
  } = params

  const occupiedDateReasons = new Map<string, string>()
  if (!startTime || !endTime) {
    return { conflictResult: null, occupiedDateReasons }
  }

  const effectiveClassroomId =
    classroomId === "NONE" || classroomId === "REMOTE"
      ? null
      : classroomId || null
  const normalizedSelectedTeacherName = normalizeTeacherName(
    teacherName ||
      (teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined)
  )

  const schedule: ScheduleWindowInput = {
    daysOfWeek,
    sessionDates,
    startTime,
    endTime,
  }
  const conflicts: ClassConflictItem[] = []
  const allConflictingDates = new Set<string>()

  const termDateKeysByWeekday = new Map<WeekDay, string[]>()
  if (term?.startDate && term?.endDate) {
    const start = new Date(term.startDate)
    const end = new Date(term.endDate)
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000
      for (let ms = start.getTime(); ms <= end.getTime(); ms += ONE_DAY_MS) {
        const cur = new Date(ms)
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`
        const wd = JS_DAY_TO_WEEKDAY[cur.getDay()]
        if (wd) {
          termDateKeysByWeekday.set(wd, [
            ...(termDateKeysByWeekday.get(wd) ?? []),
            key,
          ])
        }
      }
    }
  }

  for (const candidate of termClasses) {
    if (excludeClassId && candidate.id === excludeClassId) continue
    if (!candidate.startTime || !candidate.endTime) continue
    if (
      !hasTimeOverlap(
        startTime,
        endTime,
        candidate.startTime,
        candidate.endTime
      )
    )
      continue

    const isClassroomCollision = Boolean(
      effectiveClassroomId && candidate.classroomId === effectiveClassroomId
    )
    const isTeacherCollision = Boolean(
      (teacherId && candidate.teacherId === teacherId) ||
      (normalizedSelectedTeacherName &&
        normalizeTeacherName(candidate.teacherName) ===
          normalizedSelectedTeacherName)
    )
    if (!isClassroomCollision && !isTeacherCollision) continue

    const candidateDateKeys =
      candidate.sessionDates && candidate.sessionDates.length > 0
        ? candidate.sessionDates.map((d) => d.slice(0, 10))
        : (candidate.daysOfWeek ?? []).flatMap(
            (day) => termDateKeysByWeekday.get(day as WeekDay) ?? []
          )
    const reasonMsg = isClassroomCollision
      ? formatClassroomConflictMessage(candidate.title)
      : formatTeacherConflictMessage(candidate.title)
    for (const dateKey of candidateDateKeys) {
      if (!occupiedDateReasons.has(dateKey)) {
        occupiedDateReasons.set(dateKey, reasonMsg)
      }
    }

    const collidingDates = getCollidingDatesBetweenSchedules(
      schedule,
      candidate
    )
    if (collidingDates.length === 0) continue

    if (isClassroomCollision) {
      collidingDates.forEach((d) => allConflictingDates.add(d))
      conflicts.push({
        type: "CLASSROOM",
        conflictingClassId: candidate.id,
        conflictingClassTitle: candidate.title,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        teacherName: candidate.teacherName,
        classroomName: candidate.classroom?.name,
        message: formatClassroomConflictMessage(candidate.title),
        conflictingDates: collidingDates,
      })
    } else if (isTeacherCollision) {
      collidingDates.forEach((d) => allConflictingDates.add(d))
      conflicts.push({
        type: "TEACHER",
        conflictingClassId: candidate.id,
        conflictingClassTitle: candidate.title,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        teacherName: candidate.teacherName,
        classroomName: candidate.classroom?.name,
        message: formatTeacherConflictMessage(candidate.title),
        conflictingDates: collidingDates,
      })
    }
  }

  if (teacher) {
    const freeTimeViolations = findTeacherFreeTimeViolations(teacher, schedule)
    const teacherFullName = `${teacher.firstName} ${teacher.lastName}`.trim()
    const freeTimeMsg = formatTeacherFreeTimeMessage(teacherFullName)
    const availabilities = teacher.teacherProfile?.availabilities ?? []
    const startMin = parseTimeToMinutes(startTime)
    const endMin = parseTimeToMinutes(endTime)
    if (availabilities.length > 0 && startMin !== null && endMin !== null) {
      for (const [wd, dateKeys] of termDateKeysByWeekday.entries()) {
        const fits = availabilities
          .filter((a) => a.dayOfWeek === wd)
          .some((slot) => {
            const s = parseTimeToMinutes(slot.startTime)
            const e = parseTimeToMinutes(slot.endTime)
            return s !== null && e !== null && s <= startMin && e >= endMin
          })
        if (!fits) {
          for (const dk of dateKeys) {
            if (!occupiedDateReasons.has(dk)) {
              occupiedDateReasons.set(dk, freeTimeMsg)
            }
          }
        }
      }
    }

    if (freeTimeViolations.length > 0) {
      freeTimeViolations.forEach((d) => allConflictingDates.add(d))
      conflicts.push({
        type: "TEACHER_FREE_TIME",
        teacherName: teacherFullName,
        startTime,
        endTime,
        message: freeTimeMsg,
        conflictingDates: freeTimeViolations,
      })
    }
  }

  return {
    conflictResult:
      conflicts.length === 0
        ? null
        : {
            hasConflict: true,
            conflictingDates: Array.from(allConflictingDates).sort(),
            conflicts,
          },
    occupiedDateReasons,
  }
}

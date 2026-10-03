import type { CreateClassInput } from "./use-class-schemas"

interface ClassFormDefaultsOptions {
  branchId?: string | null
  courseId?: string
  fee?: number
  termId?: string
}

export function getCreateClassDefaults({
  branchId = null,
  courseId = "",
  fee = 1500000,
  termId = "",
}: ClassFormDefaultsOptions = {}): CreateClassInput {
  return {
    title: "",
    termId,
    courseId,
    branchId,
    classroomId: null,
    capacity: 15,
    fee,
    teacherId: null,
    teacherName: "",
    schedule: "",
    daysOfWeek: [],
    sessionDates: [],
    startTime: null,
    endTime: null,
  }
}

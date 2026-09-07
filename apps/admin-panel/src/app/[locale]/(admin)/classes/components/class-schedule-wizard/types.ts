import type { TeacherDto, TermDto } from "@workspace/types"

export interface ClassScheduleValue {
  daysOfWeek: string[]
  sessionDates: string[]
  startTime: string | null
  endTime: string | null
  formattedSchedule: string
}

export interface ClassScheduleWizardProps {
  open: boolean
  onClose: () => void
  term?: TermDto | null
  teacher?: TeacherDto | null
  instituteId?: string | null
  classroomId?: string | null
  teacherId?: string | null
  teacherName?: string | null
  excludeClassId?: string | null
  initialDaysOfWeek?: string[]
  initialSessionDates?: string[]
  initialStartTime?: string | null
  initialEndTime?: string | null
  onConfirm: (data: ClassScheduleValue) => void
}

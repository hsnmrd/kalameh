import type { TeacherDto } from "@workspace/types"

export interface EditTeacherModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
}

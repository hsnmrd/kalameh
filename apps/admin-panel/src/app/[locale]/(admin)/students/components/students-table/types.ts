import type { StudentDto } from "@workspace/types"

export interface StudentsTableProps {
  students: StudentDto[] | undefined
  isLoading: boolean
  onViewProfile: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

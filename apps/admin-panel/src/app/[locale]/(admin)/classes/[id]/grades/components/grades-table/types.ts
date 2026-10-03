import type {
  ClassGradeRecordDto,
  SingleStudentGradeInput,
} from "@workspace/types"

export interface GradesTableProps {
  records: ClassGradeRecordDto[] | undefined
  isLoading: boolean
  isSubmitting: boolean
  onSubmit: (grades: SingleStudentGradeInput[]) => void
}

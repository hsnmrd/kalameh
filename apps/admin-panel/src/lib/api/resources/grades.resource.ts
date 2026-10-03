import type {
  ClassGradeRecordDto,
  SubmitFinalGradesInput,
  SetStudentLevelInput,
} from "@workspace/types"
import { api } from "../client"

export const gradesResource = api.resource("grades", {
  getClassGrades: api.get<ClassGradeRecordDto[], string>(
    (classId) => `/grades/classes/${classId}`
  ),
  submitClassGrades: api.post<
    { message: string; updatedCount: number },
    { classId: string; body: SubmitFinalGradesInput }
  >(({ classId }) => `/grades/classes/${classId}`, {
    body: ({ body }) => body,
  }),
  setStudentLevel: api.patch<
    { message: string },
    { studentId: string; body: SetStudentLevelInput }
  >(({ studentId }) => `/grades/students/${studentId}/level`, {
    body: ({ body }) => body,
  }),
})

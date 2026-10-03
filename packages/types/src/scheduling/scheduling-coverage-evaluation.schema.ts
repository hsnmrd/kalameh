import { z } from "zod"
import { SchedulingCandidateCoverageSchema } from "./scheduling-candidate-coverage.schema.js"
import { SchedulingCourseCoverageSchema } from "./scheduling-course-coverage.schema.js"

export const SchedulingCoverageEvaluationSchema = z
  .object({
    candidates: z.array(SchedulingCandidateCoverageSchema),
    courses: z.array(SchedulingCourseCoverageSchema),
    summary: z.object({
      candidateCount: z.number().int().nonnegative(),
      courseCount: z.number().int().nonnegative(),
      studentCount: z.number().int().nonnegative(),
      knownStudentCount: z.number().int().nonnegative(),
      unknownStudentCount: z.number().int().nonnegative(),
    }),
  })
  .superRefine((evaluation, context) => {
    const knownStudentCount = evaluation.courses.reduce(
      (sum, course) => sum + course.knownStudentCount,
      0
    )
    const unknownStudentCount = evaluation.courses.reduce(
      (sum, course) => sum + course.unknownStudentCount,
      0
    )

    if (
      evaluation.summary.candidateCount !== evaluation.candidates.length ||
      evaluation.summary.courseCount !== evaluation.courses.length ||
      evaluation.summary.knownStudentCount !== knownStudentCount ||
      evaluation.summary.unknownStudentCount !== unknownStudentCount ||
      evaluation.summary.studentCount !==
        knownStudentCount + unknownStudentCount ||
      new Set(evaluation.courses.map((course) => course.courseId)).size !==
        evaluation.courses.length
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["summary"] })
    }
  })

export type SchedulingCoverageEvaluation = z.infer<
  typeof SchedulingCoverageEvaluationSchema
>

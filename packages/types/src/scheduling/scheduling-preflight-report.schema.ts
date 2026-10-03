import { z } from "zod"
import { SchedulingPreflightIssueSchema } from "./scheduling-preflight-issue.schema.js"

export const SchedulingPreflightReportSchema = z
  .object({
    schemaVersion: z.string().trim().min(1),
    checkedAt: z.string().or(z.date()),
    passed: z.boolean(),
    summary: z.object({
      blockingIssueCount: z.number().int().nonnegative(),
      warningCount: z.number().int().nonnegative(),
      infoCount: z.number().int().nonnegative(),
      requirementCount: z.number().int().nonnegative(),
      courseCount: z.number().int().nonnegative(),
      studentCount: z.number().int().nonnegative(),
      completeStudentScheduleCount: z.number().int().nonnegative(),
      activeTeacherCount: z.number().int().nonnegative(),
      teacherWithoutQualificationCount: z.number().int().nonnegative(),
    }),
    issues: z.array(SchedulingPreflightIssueSchema),
  })
  .superRefine((report, context) => {
    const counts = {
      blocking: report.issues.filter((issue) => issue.severity === "BLOCKING")
        .length,
      warning: report.issues.filter((issue) => issue.severity === "WARNING")
        .length,
      info: report.issues.filter((issue) => issue.severity === "INFO").length,
    }

    if (
      report.summary.blockingIssueCount !== counts.blocking ||
      report.summary.warningCount !== counts.warning ||
      report.summary.infoCount !== counts.info ||
      report.passed !== (counts.blocking === 0) ||
      report.summary.completeStudentScheduleCount >
        report.summary.studentCount ||
      report.summary.teacherWithoutQualificationCount >
        report.summary.activeTeacherCount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
      })
    }
  })

export type SchedulingPreflightReport = z.infer<
  typeof SchedulingPreflightReportSchema
>

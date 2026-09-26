import type { ApplyTermDemandItem, TermDemandReportDto } from "@workspace/types"
import type { CourseAdjustment } from "../../scheduling-demand-view"

export const EMPTY_ADJUSTMENTS: Record<string, CourseAdjustment> = {}

export function buildWorkspaceKey(
  termId?: string,
  branchId?: string | null,
  instituteId?: string | null
) {
  const normalizedBranchId = branchId === "all" ? "" : (branchId ?? "")
  return `${instituteId ?? ""}:${termId ?? ""}:${normalizedBranchId}`
}

export function buildDemandItems(
  courses: TermDemandReportDto["courses"],
  adjustments: Record<string, CourseAdjustment>
): ApplyTermDemandItem[] {
  return courses
    .map((course) => {
      const adjustment = adjustments[course.courseId]
      const requiredClassCount = Math.min(
        50,
        Math.max(
          0,
          adjustment?.suggestedClassCount ?? course.suggestedClassCount
        )
      )
      const capacity = Math.min(
        100,
        Math.max(1, adjustment?.capacity ?? course.suggestedCapacity ?? 14)
      )

      return {
        courseId: course.courseId,
        requiredClassCount,
        capacity,
        deliveryMode:
          course.suggestedOnlineCount > course.suggestedInPersonCount
            ? ("ONLINE" as const)
            : ("IN_PERSON" as const),
        sessionDurationMinutes: 90,
        sessionsPerWeek: course.sessionsPerWeek ?? 3,
      }
    })
    .filter((item) => item.requiredClassCount > 0)
}

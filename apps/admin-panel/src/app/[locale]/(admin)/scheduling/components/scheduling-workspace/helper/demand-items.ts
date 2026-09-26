import type {
  ApplyTermDemandItem,
  SuggestedClassDto,
  TermDemandReportDto,
} from "@workspace/types"

export type SuggestionDraft = Record<string, SuggestedClassDto[]>

export const EMPTY_SUGGESTIONS: SuggestionDraft = {}

export function buildWorkspaceKey(
  termId?: string,
  branchId?: string | null,
  instituteId?: string | null,
  maxStudentsPerClass = 14
) {
  const normalizedBranchId = branchId === "all" ? "" : (branchId ?? "")
  return `${instituteId ?? ""}:${termId ?? ""}:${normalizedBranchId}:${maxStudentsPerClass}`
}

export function buildSuggestionDraft(
  courses: TermDemandReportDto["courses"]
): SuggestionDraft {
  return Object.fromEntries(
    courses.map((course) => [
      course.courseId,
      course.suggestedClasses.map((suggestedClass) => ({ ...suggestedClass })),
    ])
  )
}

export function buildDemandItems(
  courses: TermDemandReportDto["courses"],
  suggestions: SuggestionDraft
): ApplyTermDemandItem[] {
  return courses.map((course) => ({
    courseId: course.courseId,
    classes: (suggestions[course.courseId] ?? course.suggestedClasses).map(
      ({ capacity }) => ({ capacity })
    ),
    deliveryMode: "IN_PERSON" as const,
    sessionDurationMinutes: 90,
    sessionsPerWeek: course.sessionsPerWeek ?? 3,
  }))
}

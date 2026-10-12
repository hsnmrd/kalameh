import type {
  CourseLevelNode,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import {
  findHigherLevelCourse,
  isCourseHigherLevel,
  normalizeCourseLevelText,
  sortCoursesByLevel,
  summarizeCourseLevelRange,
} from "@workspace/types"
import {
  collectKnownCourses,
  isTeacherAvailableForSchedule,
} from "../../../helper/swap-eligibility.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export type TeacherLevelComparison =
  | {
      status: "DIRECT_MATCH"
      isQualified: true
      matchedCourse: CourseLevelNode
    }
  | {
      status: "HIGHER_LEVEL"
      isQualified: true
      higherCourse: CourseLevelNode
    }
  | {
      status: "LOWER_LEVEL"
      isQualified: false
      lowerCourse: CourseLevelNode
    }
  | {
      status: "UNRELATED"
      isQualified: false
    }

export interface FreeMasterItem {
  teacher: SchedulingTeacherCalendar["teacher"]
  teachableCourses: CourseLevelNode[]
  courseRangeSummary: string | null
  comparison: TeacherLevelComparison
}

/**
 * Compares a teacher's teachable courses with a target course:
 * - DIRECT_MATCH: teacher can directly teach the target course (qualified)
 * - HIGHER_LEVEL: teacher can teach a higher level course in the same curriculum/series (qualified)
 * - LOWER_LEVEL: teacher only teaches lower level courses in the series (not qualified)
 * - UNRELATED: teacher's courses are in a different series or unrelated (not qualified)
 */
export function evaluateTeacherCourseLevel(
  targetCourse: CourseLevelNode,
  teacherCourses: CourseLevelNode[],
  allCourses?: CourseLevelNode[]
): TeacherLevelComparison {
  // 1. Direct match check (same id or normalized title)
  const directMatch = teacherCourses.find(
    (c) =>
      c.id === targetCourse.id ||
      normalizeCourseLevelText(c.title) ===
        normalizeCourseLevelText(targetCourse.title)
  )
  if (directMatch) {
    return {
      status: "DIRECT_MATCH",
      isQualified: true,
      matchedCourse: directMatch,
    }
  }

  // 2. Higher level match
  const higherCourse = findHigherLevelCourse(
    targetCourse,
    teacherCourses,
    allCourses
  )
  if (higherCourse) {
    return {
      status: "HIGHER_LEVEL",
      isQualified: true,
      higherCourse,
    }
  }

  // 3. Lower level check (courses that are strictly lower than target)
  const lowerCourses = teacherCourses.filter((c) =>
    isCourseHigherLevel(targetCourse, c, allCourses)
  )
  if (lowerCourses.length > 0) {
    const sortedLower = sortCoursesByLevel(lowerCourses, allCourses)
    const highestLower = sortedLower[sortedLower.length - 1]!
    return {
      status: "LOWER_LEVEL",
      isQualified: false,
      lowerCourse: highestLower,
    }
  }

  // 4. Unrelated series / Different category
  return {
    status: "UNRELATED",
    isQualified: false,
  }
}

/**
 * Finds all teachers who are free during the specified time slot and evaluates their
 * course level comparison relative to the target course.
 */
export function findFreeMastersForSlot({
  targetCourse,
  daysOfWeek,
  startTime,
  endTime,
  ignoredProposalId,
  teacherCalendars = [],
  allProposals = [],
}: {
  targetCourse: CourseLevelNode
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  ignoredProposalId?: string
  teacherCalendars?: SchedulingTeacherCalendar[]
  allProposals?: Proposal[]
}): FreeMasterItem[] {
  const allCourses = collectKnownCourses(allProposals, teacherCalendars)
  const results: FreeMasterItem[] = []

  for (const calendar of teacherCalendars) {
    const teacher = calendar.teacher

    // 1. Teacher must be free in this time slot (no proposal conflict, no busy existing class, has free slot)
    const isFree = isTeacherAvailableForSchedule(
      teacher.id,
      daysOfWeek,
      startTime,
      endTime,
      ignoredProposalId ? [ignoredProposalId] : [],
      allProposals,
      teacherCalendars
    )
    if (!isFree) continue

    // 2. Collect all courses known for this teacher
    const proposalCourses = allProposals
      .filter((p) => (p.teacherId ?? p.teacher?.id) === teacher.id)
      .map((p) => p.course)
    const teacherCoursesMap = new Map<string, CourseLevelNode>()
    for (const c of calendar.teachableCourses ?? []) {
      teacherCoursesMap.set(c.id, c)
    }
    for (const c of proposalCourses) {
      teacherCoursesMap.set(c.id, c)
    }
    const teacherCourses = Array.from(teacherCoursesMap.values())

    // 3. Evaluate course level comparison
    const comparison = evaluateTeacherCourseLevel(
      targetCourse,
      teacherCourses,
      allCourses
    )

    const courseRangeSummary = summarizeCourseLevelRange(
      teacherCourses,
      allCourses
    )

    results.push({
      teacher,
      teachableCourses: teacherCourses,
      courseRangeSummary,
      comparison,
    })
  }

  // Sort:
  // 1. Qualified teachers first (DIRECT_MATCH, then HIGHER_LEVEL)
  // 2. Unqualified teachers next (LOWER_LEVEL, then UNRELATED)
  // 3. Alphabetical by teacher name
  return results.sort((a, b) => {
    const aPriority =
      a.comparison.status === "DIRECT_MATCH"
        ? 0
        : a.comparison.status === "HIGHER_LEVEL"
          ? 1
          : a.comparison.status === "LOWER_LEVEL"
            ? 2
            : 3
    const bPriority =
      b.comparison.status === "DIRECT_MATCH"
        ? 0
        : b.comparison.status === "HIGHER_LEVEL"
          ? 1
          : b.comparison.status === "LOWER_LEVEL"
            ? 2
            : 3
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    const nameA = `${a.teacher.firstName} ${a.teacher.lastName}`.trim()
    const nameB = `${b.teacher.firstName} ${b.teacher.lastName}`.trim()
    return nameA.localeCompare(nameB)
  })
}

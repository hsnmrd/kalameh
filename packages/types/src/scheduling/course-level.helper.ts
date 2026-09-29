export interface CourseLevelNode {
  id: string
  title: string
  prerequisiteId?: string | null
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

export function normalizeCourseLevelText(value: string): string {
  let result = ""
  for (const char of value) {
    const persianIndex = PERSIAN_DIGITS.indexOf(char)
    if (persianIndex !== -1) {
      result += String(persianIndex)
      continue
    }
    const arabicIndex = ARABIC_DIGITS.indexOf(char)
    if (arabicIndex !== -1) {
      result += String(arabicIndex)
      continue
    }
    result += char
  }
  return result.trim().toLowerCase().replace(/\s+/g, " ")
}

export function parseCourseSeriesAndNumbers(
  title: string
): { seriesPrefix: string; numbers: number[] } | null {
  const normalized = normalizeCourseLevelText(title)
  const match = normalized.match(
    /^([^\d]+?)\s*[-–—:/.\s]*(\d+(?:\s*[-–—./\s]\s*\d+)*)$/
  )
  if (!match) return null

  const seriesPrefix = (match[1] ?? "").trim().replace(/[-–—:/.\s]+$/g, "")
  const numbersRaw = match[2] ?? ""
  if (!seriesPrefix || !numbersRaw) return null

  const numbers = numbersRaw
    .split(/[-–—./\s]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter((num) => Number.isFinite(num))

  if (numbers.length === 0) return null
  return { seriesPrefix, numbers }
}

export function compareCourseNumbers(
  left: readonly number[],
  right: readonly number[]
): number {
  const maxLength = Math.max(left.length, right.length)
  for (let index = 0; index < maxLength; index += 1) {
    const leftVal = left[index] ?? 0
    const rightVal = right[index] ?? 0
    if (leftVal !== rightVal) {
      return leftVal - rightVal
    }
  }
  return 0
}

function isPrerequisiteAncestor(
  ancestorCourseId: string,
  descendantCourseId: string,
  courseById: ReadonlyMap<string, CourseLevelNode>
): boolean {
  const visited = new Set<string>([descendantCourseId])
  let currentId = courseById.get(descendantCourseId)?.prerequisiteId ?? null

  while (currentId) {
    if (currentId === ancestorCourseId) return true
    if (visited.has(currentId)) break
    visited.add(currentId)
    currentId = courseById.get(currentId)?.prerequisiteId ?? null
  }
  return false
}

/**
 * Returns true when `candidateCourse` (a teacher's teachable course) is at a
 * strictly higher level than `targetCourse` (the class requirement's course).
 */
export function isCourseHigherLevel(
  candidateCourse: CourseLevelNode,
  targetCourse: CourseLevelNode,
  allCourses?: ReadonlyArray<CourseLevelNode>
): boolean {
  if (candidateCourse.id === targetCourse.id) return false

  if (allCourses && allCourses.length > 0) {
    const courseById = new Map(allCourses.map((course) => [course.id, course]))
    if (
      isPrerequisiteAncestor(targetCourse.id, candidateCourse.id, courseById)
    ) {
      return true
    }
    if (
      isPrerequisiteAncestor(candidateCourse.id, targetCourse.id, courseById)
    ) {
      return false
    }
  }

  const candidateParsed = parseCourseSeriesAndNumbers(candidateCourse.title)
  const targetParsed = parseCourseSeriesAndNumbers(targetCourse.title)
  if (
    candidateParsed &&
    targetParsed &&
    candidateParsed.seriesPrefix === targetParsed.seriesPrefix
  ) {
    return (
      compareCourseNumbers(candidateParsed.numbers, targetParsed.numbers) > 0
    )
  }

  return false
}

/**
 * Sorts courses from lowest level to highest level.
 */
export function sortCoursesByLevel<T extends CourseLevelNode>(
  courses: ReadonlyArray<T>,
  allCourses?: ReadonlyArray<CourseLevelNode>
): T[] {
  return [...courses].sort((left, right) => {
    if (isCourseHigherLevel(left, right, allCourses)) return 1
    if (isCourseHigherLevel(right, left, allCourses)) return -1
    return normalizeCourseLevelText(left.title).localeCompare(
      normalizeCourseLevelText(right.title),
      undefined,
      { numeric: true, sensitivity: "base" }
    )
  })
}

/**
 * Finds the closest higher-level course from `teacherCourses` that is strictly
 * above `targetCourse`, or returns `null` if none exists.
 */
export function findHigherLevelCourse<T extends CourseLevelNode>(
  targetCourse: CourseLevelNode,
  teacherCourses: ReadonlyArray<T>,
  allCourses?: ReadonlyArray<CourseLevelNode>
): T | null {
  const higherCourses = teacherCourses.filter((course) =>
    isCourseHigherLevel(course, targetCourse, allCourses)
  )
  if (higherCourses.length === 0) return null

  return sortCoursesByLevel(higherCourses, allCourses)[0]!
}

/**
 * Returns a compact start ~ end summary of a teacher's teachable course levels
 * (e.g. "AME ۳-۱ ~ AME ۴-۲"), or a single title if only one course is present.
 */
export function summarizeCourseLevelRange<T extends CourseLevelNode>(
  courses: ReadonlyArray<T>,
  allCourses?: ReadonlyArray<CourseLevelNode>
): string | null {
  if (courses.length === 0) return null
  if (courses.length === 1) return courses[0]!.title

  const sorted = sortCoursesByLevel(courses, allCourses)
  const startTitle = sorted[0]!.title
  const endTitle = sorted[sorted.length - 1]!.title
  return startTitle === endTitle ? startTitle : `${startTitle} ~ ${endTitle}`
}

import { normalizeCourseLevelText } from "@workspace/types"
import {
  COLOR_FAMILIES,
  TONES_PER_FAMILY,
  TOTAL_COLOR_THEMES,
} from "../../scheduling-plan-calendar-class-card"

export interface ParsedCourseGroup {
  groupKey: string
  courseKey: string
  subLevelKey: string
}

/**
 * Parses course titles into a common family groupKey (e.g. "AME 1", "Top Notch 1")
 * and a specific courseKey (e.g. "AME 1-1", "Top Notch 1A").
 *
 * Examples:
 * - "AME 1-1" -> group: "ame 1", course: "ame 1-1", subLevel: "1"
 * - "AME 1-2" -> group: "ame 1", course: "ame 1-2", subLevel: "2"
 * - "AME 2-1" -> group: "ame 2", course: "ame 2-1", subLevel: "1"
 * - "Top Notch 1A" -> group: "top notch 1", course: "top notch 1a", subLevel: "a"
 * - "Top Notch 1B" -> group: "top notch 1", course: "top notch 1b", subLevel: "b"
 * - "Touchstone 1" -> group: "touchstone 1", course: "touchstone 1", subLevel: ""
 */
export function getCourseGroupAndSubLevel(rawTitle: string): ParsedCourseGroup {
  const normalized = normalizeCourseLevelText(rawTitle || "")
  if (!normalized) {
    return { groupKey: "default", courseKey: "default", subLevelKey: "" }
  }

  // Pattern 1: Title with parentheses, e.g. "ame 1 (1)", "top notch 1 (a)", "ielts (part 2)"
  const parenMatch = normalized.match(
    /^(.+?)\s*[(（]\s*(?:part|unit|level|term|ترم|بخش|فصل)?\s*([a-z0-9]+)\s*[)）]$/i
  )
  if (parenMatch) {
    const groupKey = (parenMatch[1] ?? "").trim()
    const subLevelKey = (parenMatch[2] ?? "").trim().toLowerCase()
    return {
      groupKey: groupKey || normalized,
      courseKey: `${groupKey}-${subLevelKey}`,
      subLevelKey,
    }
  }

  // Pattern 2: Title with separator (- , / . _ : #) followed by a sub-level number or letter
  // Examples: "ame 1-1", "ame 1 - 2", "ame 1.2", "a1-2", "touchstone 1/2", "ame 1: 2"
  const separatorMatch = normalized.match(
    /^(.+?)\s*[-–—./_:#]\s*(?:part|unit|level|term|ترم|بخش|فصل)?\s*([a-z0-9]+)$/i
  )
  if (separatorMatch) {
    const groupKey = (separatorMatch[1] ?? "").trim()
    const subLevelKey = (separatorMatch[2] ?? "").trim().toLowerCase()
    return {
      groupKey: groupKey || normalized,
      courseKey: `${groupKey}-${subLevelKey}`,
      subLevelKey,
    }
  }

  // Pattern 3: Named word separator (part, unit, level, term, etc.)
  // Examples: "ame 1 part 1", "ame 1 unit 2", "top notch 1 term 1", "تاپ ناچ ۱ ترم ۲"
  const namedPartMatch = normalized.match(
    /^(.+?)\s+(?:part|unit|level|term|ترم|بخش|فصل)\s*([a-z0-9]+)$/i
  )
  if (namedPartMatch) {
    const groupKey = (namedPartMatch[1] ?? "").trim()
    const subLevelKey = (namedPartMatch[2] ?? "").trim().toLowerCase()
    return {
      groupKey: groupKey || normalized,
      courseKey: `${groupKey}-${subLevelKey}`,
      subLevelKey,
    }
  }

  // Pattern 4: Title ending in a digit followed directly by a letter (e.g. "top notch 1a")
  const letterSuffixMatch = normalized.match(/^(.+?\d+)\s*([a-z])$/i)
  if (letterSuffixMatch) {
    const groupKey = (letterSuffixMatch[1] ?? "").trim()
    const subLevelKey = (letterSuffixMatch[2] ?? "").trim().toLowerCase()
    return {
      groupKey: groupKey || normalized,
      courseKey: `${groupKey}${subLevelKey}`,
      subLevelKey,
    }
  }

  // Pattern 5: Standalone course without sub-level (e.g. "touchstone 1", "english a1")
  return {
    groupKey: normalized,
    courseKey: normalized,
    subLevelKey: "",
  }
}

/**
 * Builds a proposal ID -> color theme index map such that:
 * 1. Proposals in the SAME group (e.g. "AME 1-1" and "AME 1-2") receive close colors (tones of the same hue family).
 * 2. All proposals of the EXACT SAME course (e.g. all "AME 1-1" sessions) receive the exact same color theme.
 * 3. Different groups (e.g. "AME 1" vs "AME 2" vs "Top Notch 1") receive distinct color families.
 */
export function buildProposalColorMap(
  proposals: ReadonlyArray<{
    id: string
    course?: { id: string; title: string } | null
    title?: string | null
  }>,
  familiesCount: number = COLOR_FAMILIES.length,
  tonesPerFamily: number = TONES_PER_FAMILY
): Map<string, number> {
  const map = new Map<string, number>()
  if (!proposals || proposals.length === 0) return map

  const groupOrder: string[] = []
  const coursesByGroup = new Map<string, string[]>()
  const proposalInfoMap = new Map<
    string,
    { groupKey: string; courseKey: string }
  >()

  for (const proposal of proposals) {
    const courseTitle = proposal.course?.title || proposal.title || proposal.id
    const { groupKey, courseKey } = getCourseGroupAndSubLevel(courseTitle)

    proposalInfoMap.set(proposal.id, { groupKey, courseKey })

    if (!coursesByGroup.has(groupKey)) {
      coursesByGroup.set(groupKey, [])
      groupOrder.push(groupKey)
    }

    const groupCourses = coursesByGroup.get(groupKey)!
    if (!groupCourses.includes(courseKey)) {
      groupCourses.push(courseKey)
    }
  }

  // Sort groups deterministically so identical groups get the same family
  groupOrder.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  // Sort courses within each group so tone order is natural (e.g. 1-1 before 1-2, A before B)
  for (const courses of coursesByGroup.values()) {
    courses.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }

  const familyByGroup = new Map<string, number>()
  groupOrder.forEach((groupKey, idx) => {
    familyByGroup.set(groupKey, idx % familiesCount)
  })

  for (const proposal of proposals) {
    const info = proposalInfoMap.get(proposal.id)
    if (!info) continue

    const familyIdx = familyByGroup.get(info.groupKey) ?? 0
    const groupCourses = coursesByGroup.get(info.groupKey) ?? []
    const toneIdx =
      Math.max(0, groupCourses.indexOf(info.courseKey)) % tonesPerFamily

    const themeIndex =
      (familyIdx * tonesPerFamily + toneIdx) % TOTAL_COLOR_THEMES
    map.set(proposal.id, themeIndex)
  }

  return map
}

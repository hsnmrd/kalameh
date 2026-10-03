import { describe, expect, it } from "vitest"
import { TONES_PER_FAMILY } from "../../../scheduling-plan-calendar-class-card"
import {
  buildProposalColorMap,
  getCourseGroupAndSubLevel,
} from "../course-color-group.helper"

describe("course-color-group.helper", () => {
  describe("getCourseGroupAndSubLevel", () => {
    it("extracts group and sub-level from dash separated titles", () => {
      const res1 = getCourseGroupAndSubLevel("AME 1-1")
      expect(res1.groupKey).toBe("ame 1")
      expect(res1.courseKey).toBe("ame 1-1")
      expect(res1.subLevelKey).toBe("1")

      const res2 = getCourseGroupAndSubLevel("AME 1-2")
      expect(res2.groupKey).toBe("ame 1")
      expect(res2.courseKey).toBe("ame 1-2")
      expect(res2.subLevelKey).toBe("2")

      const res3 = getCourseGroupAndSubLevel("AME 2-1")
      expect(res3.groupKey).toBe("ame 2")
      expect(res3.courseKey).toBe("ame 2-1")
      expect(res3.subLevelKey).toBe("1")
    })

    it("extracts group and sub-level from letter suffix patterns", () => {
      const resA = getCourseGroupAndSubLevel("Top Notch 1A")
      expect(resA.groupKey).toBe("top notch 1")
      expect(resA.courseKey).toBe("top notch 1a")
      expect(resA.subLevelKey).toBe("a")

      const resB = getCourseGroupAndSubLevel("Top Notch 1B")
      expect(resB.groupKey).toBe("top notch 1")
      expect(resB.courseKey).toBe("top notch 1b")
      expect(resB.subLevelKey).toBe("b")
    })

    it("extracts group and sub-level from parentheses", () => {
      const res = getCourseGroupAndSubLevel("American English File 1 (1)")
      expect(res.groupKey).toBe("american english file 1")
      expect(res.courseKey).toBe("american english file 1-1")
      expect(res.subLevelKey).toBe("1")
    })

    it("extracts group and sub-level from named part or unit", () => {
      const res = getCourseGroupAndSubLevel("AME 1 part 2")
      expect(res.groupKey).toBe("ame 1")
      expect(res.courseKey).toBe("ame 1-2")
      expect(res.subLevelKey).toBe("2")
    })

    it("handles Persian digits and normalizes cleanly", () => {
      const res1 = getCourseGroupAndSubLevel("تاپ ناچ ۱-۱")
      const res2 = getCourseGroupAndSubLevel("تاپ ناچ ۱-۲")

      expect(res1.groupKey).toBe("تاپ ناچ 1")
      expect(res1.subLevelKey).toBe("1")
      expect(res2.groupKey).toBe("تاپ ناچ 1")
      expect(res2.subLevelKey).toBe("2")
    })

    it("falls back to normalized full title for standalone courses", () => {
      const res = getCourseGroupAndSubLevel("Touchstone 1")
      expect(res.groupKey).toBe("touchstone 1")
      expect(res.courseKey).toBe("touchstone 1")
      expect(res.subLevelKey).toBe("")
    })

    it("handles empty or null string safely", () => {
      const res = getCourseGroupAndSubLevel("")
      expect(res.groupKey).toBe("default")
      expect(res.courseKey).toBe("default")
      expect(res.subLevelKey).toBe("")
    })
  })

  describe("buildProposalColorMap", () => {
    it("assigns same family but distinct tones to same-group courses", () => {
      const proposals = [
        { id: "p1", course: { id: "c1-1", title: "AME 1-1" } },
        { id: "p2", course: { id: "c1-2", title: "AME 1-2" } },
      ]

      const map = buildProposalColorMap(proposals)
      const color1 = map.get("p1")!
      const color2 = map.get("p2")!

      expect(color1).toBeDefined()
      expect(color2).toBeDefined()
      expect(color1).not.toBe(color2)

      // Both must belong to the exact same color family
      const family1 = Math.floor(color1 / TONES_PER_FAMILY)
      const family2 = Math.floor(color2 / TONES_PER_FAMILY)
      expect(family1).toBe(family2)
    })

    it("assigns the exact same color theme to identical courses", () => {
      const proposals = [
        { id: "p1", course: { id: "c1-1", title: "AME 1-1" } },
        { id: "p2", course: { id: "c1-1", title: "AME 1-1" } },
        { id: "p3", course: { id: "c1-2", title: "AME 1-2" } },
      ]

      const map = buildProposalColorMap(proposals)
      const colorP1 = map.get("p1")!
      const colorP2 = map.get("p2")!
      const colorP3 = map.get("p3")!

      // p1 and p2 are both AME 1-1, so they must have the EXACT SAME color
      expect(colorP1).toBe(colorP2)

      // p3 is AME 1-2, so it has a different tone from the same family
      expect(colorP3).not.toBe(colorP1)
      expect(Math.floor(colorP3 / TONES_PER_FAMILY)).toBe(
        Math.floor(colorP1 / TONES_PER_FAMILY)
      )
    })

    it("assigns different color families to different course groups", () => {
      const proposals = [
        { id: "p1", course: { id: "c1-1", title: "AME 1-1" } },
        { id: "p2", course: { id: "c2-1", title: "AME 2-1" } },
      ]

      const map = buildProposalColorMap(proposals)
      const color1 = map.get("p1")!
      const color2 = map.get("p2")!

      const family1 = Math.floor(color1 / TONES_PER_FAMILY)
      const family2 = Math.floor(color2 / TONES_PER_FAMILY)

      // AME 1 and AME 2 are different groups and must get different families
      expect(family1).not.toBe(family2)
    })

    it("handles empty proposals array safely", () => {
      const map = buildProposalColorMap([])
      expect(map.size).toBe(0)
    })
  })
})

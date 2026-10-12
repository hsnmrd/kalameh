import { describe, expect, it } from "vitest"
import type { SchedulingTeacherCalendar, WeekDay } from "@workspace/types"
import {
  evaluateTeacherCourseLevel,
  findFreeMastersForSlot,
} from "../teacher-level-comparison.helper"

describe("teacher-level-comparison.helper", () => {
  describe("evaluateTeacherCourseLevel", () => {
    const targetCourse = { id: "c-ame-1-1", title: "AME 1-1" }

    it("detects DIRECT_MATCH when teacher has the exact target course", () => {
      const teacherCourses = [
        { id: "c-ame-1-1", title: "AME 1-1" },
        { id: "c-ame-1-2", title: "AME 1-2" },
      ]
      const result = evaluateTeacherCourseLevel(targetCourse, teacherCourses)
      expect(result.status).toBe("DIRECT_MATCH")
      expect(result.isQualified).toBe(true)
      if (result.status === "DIRECT_MATCH") {
        expect(result.matchedCourse.title).toBe("AME 1-1")
      }
    })

    it("detects HIGHER_LEVEL when teacher teaches a higher level course (e.g. AME 1-2 or AME 2-3)", () => {
      const teacherCourses = [
        { id: "c-ame-1-2", title: "AME 1-2" },
        { id: "c-ame-2-3", title: "AME 2-3" },
      ]
      const result = evaluateTeacherCourseLevel(targetCourse, teacherCourses)
      expect(result.status).toBe("HIGHER_LEVEL")
      expect(result.isQualified).toBe(true)
      if (result.status === "HIGHER_LEVEL") {
        expect(result.higherCourse.title).toBe("AME 1-2")
      }
    })

    it("detects LOWER_LEVEL when teacher only teaches lower level courses", () => {
      const higherTarget = { id: "c-ame-2-3", title: "AME 2-3" }
      const teacherCourses = [
        { id: "c-ame-1-1", title: "AME 1-1" },
        { id: "c-ame-1-2", title: "AME 1-2" },
      ]
      const result = evaluateTeacherCourseLevel(higherTarget, teacherCourses)
      expect(result.status).toBe("LOWER_LEVEL")
      expect(result.isQualified).toBe(false)
      if (result.status === "LOWER_LEVEL") {
        expect(result.lowerCourse.title).toBe("AME 1-2")
      }
    })

    it("detects UNRELATED when teacher teaches unrelated courses", () => {
      const teacherCourses = [
        { id: "c-french-1", title: "French 1" },
        { id: "c-french-2", title: "French 2" },
      ]
      const result = evaluateTeacherCourseLevel(targetCourse, teacherCourses)
      expect(result.status).toBe("UNRELATED")
      expect(result.isQualified).toBe(false)
    })
  })

  describe("findFreeMastersForSlot", () => {
    const targetCourse = { id: "c-ame-1-1", title: "AME 1-1" }
    const daysOfWeek: WeekDay[] = ["SATURDAY", "MONDAY", "WEDNESDAY"]
    const startTime = "15:00"
    const endTime = "16:30"

    const teacherCalendars: SchedulingTeacherCalendar[] = [
      {
        teacher: {
          id: "t-melika",
          firstName: "ملیکا",
          lastName: "سعیدی",
          avatarUrl: null,
        },
        teachableCourses: [
          { id: "c-ame-1-2", title: "AME 1-2" },
          { id: "c-ame-2-3", title: "AME 2-3" },
        ],
        slots: [
          {
            id: "s1",
            dayOfWeek: "SATURDAY",
            startTime: "14:00",
            endTime: "18:00",
            status: "FREE",
          },
          {
            id: "s2",
            dayOfWeek: "MONDAY",
            startTime: "14:00",
            endTime: "18:00",
            status: "FREE",
          },
          {
            id: "s3",
            dayOfWeek: "WEDNESDAY",
            startTime: "14:00",
            endTime: "18:00",
            status: "FREE",
          },
        ],
      },
      {
        teacher: {
          id: "t-busy",
          firstName: "علی",
          lastName: "اکبری",
          avatarUrl: null,
        },
        teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
        slots: [
          {
            id: "s4",
            dayOfWeek: "SATURDAY",
            startTime: "15:00",
            endTime: "16:30",
            status: "BUSY",
            source: "EXISTING_CLASS",
          },
        ],
      },
    ]

    it("returns free teachers sorted with qualified first, detecting Melika Saeedi as HIGHER_LEVEL", () => {
      const results = findFreeMastersForSlot({
        targetCourse,
        daysOfWeek,
        startTime,
        endTime,
        teacherCalendars,
        allProposals: [],
      })

      expect(results).toHaveLength(1)
      const melika = results[0]!
      expect(melika.teacher.id).toBe("t-melika")
      expect(melika.comparison.status).toBe("HIGHER_LEVEL")
      expect(melika.comparison.isQualified).toBe(true)
      expect(melika.courseRangeSummary).toBe("AME 1-2 ~ AME 2-3")
    })
  })
})

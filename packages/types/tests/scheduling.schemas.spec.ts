import { describe, expect, it } from "vitest"
import {
  ClassRequirementInputSchema,
  GenerateSchedulingPlanSchema,
  SchedulingProposalSchema,
  SchedulingPreflightReportSchema,
  SchedulingCandidateSlotSchema,
  SchedulingTimeGroupSettingsSchema,
  SchedulingScoreCriterionSchema,
} from "../src/index.js"

const ids = {
  institute: "00000000-0000-4000-8000-000000000001",
  plan: "00000000-0000-4000-8000-000000000002",
  requirement: "00000000-0000-4000-8000-000000000003",
  course: "00000000-0000-4000-8000-000000000004",
  teacher: "00000000-0000-4000-8000-000000000005",
}

describe("MVP-011 scheduling schemas", () => {
  it("requires exactly one class cadence", () => {
    const baseRequirement = {
      termId: ids.plan,
      courseId: ids.course,
      requiredClassCount: 2,
      capacity: 12,
      sessionDurationMinutes: 90,
    }

    expect(
      ClassRequirementInputSchema.safeParse({
        ...baseRequirement,
        sessionsPerWeek: 2,
      }).success
    ).toBe(true)
    expect(ClassRequirementInputSchema.safeParse(baseRequirement).success).toBe(
      false
    )
    expect(
      ClassRequirementInputSchema.safeParse({
        ...baseRequirement,
        sessionsPerWeek: 2,
        totalSessions: 24,
      }).success
    ).toBe(false)
  })

  it("normalizes generation defaults and duplicate identifiers", () => {
    const input = GenerateSchedulingPlanSchema.parse({
      instituteId: ids.institute,
      termId: ids.plan,
      requirementIds: [ids.requirement, ids.requirement],
    })

    expect(input.requirementIds).toEqual([ids.requirement])
    expect(input.instituteId).toBe(ids.institute)
    expect(input.alternativePlanCount).toBe(3)
    expect(input.lockedProposalIds).toEqual([])
  })

  it("enforces applicable and not-applicable score shapes", () => {
    expect(
      SchedulingScoreCriterionSchema.safeParse({
        code: "SC_STUDENT_COVERAGE",
        status: "APPLICABLE",
        rawValue: 0.8,
        normalizedScore: 0.8,
        weight: 50,
        weightedPoints: 40,
      }).success
    ).toBe(true)
    expect(
      SchedulingScoreCriterionSchema.safeParse({
        code: "SC_TEACHER_LOAD",
        status: "NOT_APPLICABLE",
        rawValue: null,
        normalizedScore: 0,
        weight: 10,
        weightedPoints: null,
      }).success
    ).toBe(false)
  })

  it("validates a structured blocking preflight report", () => {
    const report = SchedulingPreflightReportSchema.parse({
      schemaVersion: "1",
      checkedAt: "2026-09-08T08:00:00.000Z",
      passed: false,
      summary: {
        blockingIssueCount: 1,
        warningCount: 0,
        infoCount: 0,
        requirementCount: 1,
        courseCount: 1,
        studentCount: 0,
        completeStudentScheduleCount: 0,
        activeTeacherCount: 0,
        teacherWithoutQualificationCount: 0,
      },
      issues: [
        {
          code: "COURSE_WITHOUT_QUALIFIED_TEACHER",
          severity: "BLOCKING",
          scope: "COURSE",
          entityId: ids.course,
        },
      ],
    })

    expect(report.passed).toBe(false)
    expect(report.issues[0]?.context).toEqual({})
    expect(
      SchedulingPreflightReportSchema.safeParse({
        ...report,
        passed: true,
      }).success
    ).toBe(false)
  })

  it("validates candidate slots and institute time-group partitions", () => {
    expect(
      SchedulingTimeGroupSettingsSchema.safeParse({
        oddDays: ["SUNDAY", "TUESDAY"],
        evenDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        neutralDays: ["THURSDAY", "FRIDAY"],
        eveningStartsAt: "14:00",
        timeZone: "Asia/Tehran",
      }).success
    ).toBe(true)
    expect(
      SchedulingTimeGroupSettingsSchema.safeParse({
        oddDays: ["SUNDAY", "TUESDAY"],
        evenDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        neutralDays: ["THURSDAY", "FRIDAY"],
        eveningStartsAt: "14:00",
        timeZone: "invalid/time-zone",
      }).success
    ).toBe(false)
    const candidate = {
      key: "candidate-1",
      requirementId: ids.requirement,
      courseId: ids.course,
      branchId: null,
      teacherId: ids.teacher,
      qualificationId: ids.plan,
      availabilityId: ids.institute,
      dayOfWeek: "SUNDAY",
      startTime: "09:00",
      endTime: "10:30",
      durationMinutes: 90,
      timeGroup: "ODD_MORNING",
    }
    expect(SchedulingCandidateSlotSchema.safeParse(candidate).success).toBe(
      true
    )
    expect(
      SchedulingCandidateSlotSchema.safeParse({
        ...candidate,
        durationMinutes: 60,
      }).success
    ).toBe(false)
  })

  it("validates and normalizes an explained proposal", () => {
    const result = SchedulingProposalSchema.parse({
      id: ids.requirement,
      instituteId: ids.institute,
      planId: ids.plan,
      classRequirementId: ids.requirement,
      courseId: ids.course,
      teacherId: ids.teacher,
      qualificationCheckedAt: "2026-09-08T08:00:00.000Z",
      title: "Proposed class",
      capacity: 12,
      deliveryMode: "ONLINE",
      daysOfWeek: ["SATURDAY", "MONDAY"],
      startTime: "09:00",
      endTime: "10:30",
      timeGroup: "EVEN_MORNING",
      score: 84.5,
      scoreBreakdown: {},
      selectionReasons: [
        {
          code: "MAXIMIZES_STUDENT_COVERAGE",
          evidence: { coveredStudents: 18 },
        },
      ],
      isLocked: false,
      isManuallyEdited: false,
      editCount: 0,
      warnings: null,
      createdAt: "2026-09-08T08:00:00.000Z",
      updatedAt: "2026-09-08T08:00:00.000Z",
    })

    expect(result.warnings).toEqual([])
    expect(result.scoreBreakdown.criteria).toEqual([])
    expect(
      SchedulingProposalSchema.safeParse({
        ...result,
        startTime: "11:00",
        endTime: "10:30",
      }).success
    ).toBe(false)
  })
})

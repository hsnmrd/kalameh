import { describe, expect, it } from "vitest"
import {
  ClassRequirementInputSchema,
  GenerateSchedulingPlanSchema,
  SchedulingProposalSchema,
  SchedulingPreflightReportSchema,
  SchedulingCandidateSlotSchema,
  SchedulingHardConstraintEvaluationSchema,
  SchedulingCoverageEvaluationSchema,
  SchedulingTimeDistributionScoreSchema,
  SchedulingUnresolvedEvaluationSchema,
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

  it("validates feasible assignments and their hard-constraint summary", () => {
    const candidate = SchedulingCandidateSlotSchema.parse({
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
    })
    const evaluation = {
      accepted: [
        {
          ...candidate,
          assignmentKey: "candidate-1:ONLINE",
          classroomId: null,
          deliveryMode: "ONLINE",
          capacity: 12,
        },
      ],
      rejected: [],
      summary: {
        inputCandidateCount: 1,
        feasibleAssignmentCount: 1,
        rejectedCandidateCount: 0,
      },
    }

    expect(
      SchedulingHardConstraintEvaluationSchema.safeParse(evaluation).success
    ).toBe(true)
    expect(
      SchedulingHardConstraintEvaluationSchema.safeParse({
        ...evaluation,
        summary: { ...evaluation.summary, feasibleAssignmentCount: 0 },
      }).success
    ).toBe(false)
  })

  it("validates candidate coverage and rejects inconsistent counts", () => {
    const candidate = {
      key: "candidate-1",
      assignmentKey: "candidate-1:ONLINE",
      requirementId: ids.requirement,
      courseId: ids.course,
      branchId: null,
      teacherId: ids.teacher,
      qualificationId: ids.plan,
      availabilityId: ids.institute,
      classroomId: null,
      deliveryMode: "ONLINE",
      capacity: 12,
      dayOfWeek: "SUNDAY",
      startTime: "09:00",
      endTime: "10:30",
      durationMinutes: 90,
      timeGroup: "ODD_MORNING",
    }
    const evaluation = {
      candidates: [
        {
          candidate,
          status: "APPLICABLE",
          knownStudentCount: 1,
          unknownStudentCount: 0,
          coveredStudentIds: [ids.teacher],
          uncoveredStudentIds: [],
          coveragePercent: 100,
        },
      ],
      courses: [
        {
          courseId: ids.course,
          status: "APPLICABLE",
          knownStudentCount: 1,
          unknownStudentCount: 0,
          bestCoveredStudentCount: 1,
          bestCoveragePercent: 100,
          candidateCount: 1,
        },
      ],
      summary: {
        candidateCount: 1,
        courseCount: 1,
        studentCount: 1,
        knownStudentCount: 1,
        unknownStudentCount: 0,
      },
    }

    expect(
      SchedulingCoverageEvaluationSchema.safeParse(evaluation).success
    ).toBe(true)
    expect(
      SchedulingCoverageEvaluationSchema.safeParse({
        ...evaluation,
        summary: { ...evaluation.summary, knownStudentCount: 0 },
      }).success
    ).toBe(false)
  })

  it("validates a time-distribution score contract", () => {
    const score = {
      requirementId: ids.requirement,
      requiredClassCount: 2,
      scheduledClassCount: 2,
      targetPrimaryGroupCount: 2,
      distinctPrimaryGroupCount: 2,
      groupCounts: {
        ODD_MORNING: 1,
        ODD_EVENING: 0,
        EVEN_MORNING: 0,
        EVEN_EVENING: 1,
        NEUTRAL_MORNING: 0,
        NEUTRAL_EVENING: 0,
        MIXED_MORNING: 0,
        MIXED_EVENING: 0,
      },
      dayAxisScore: 1,
      timeAxisScore: 1,
      groupDiversityScore: 1,
      balanceScore: 1,
      criterion: {
        code: "SC_TIME_PATTERN_DIVERSITY",
        status: "APPLICABLE",
        rawValue: 1,
        normalizedScore: 1,
        weight: 25,
        weightedPoints: 25,
      },
      warnings: [],
    }

    expect(SchedulingTimeDistributionScoreSchema.safeParse(score).success).toBe(
      true
    )
    expect(
      SchedulingTimeDistributionScoreSchema.safeParse({
        ...score,
        scheduledClassCount: 1,
      }).success
    ).toBe(false)
  })

  it("validates unresolved requirement totals and stable reason codes", () => {
    const evaluation = {
      items: [
        {
          classRequirementId: ids.requirement,
          reasonCode: "NO_QUALIFIED_TEACHER",
          missingClassCount: 2,
          details: {},
        },
      ],
      summary: {
        requiredClassCount: 2,
        scheduledClassCount: 0,
        missingClassCount: 2,
        unresolvedRequirementCount: 1,
      },
    }

    expect(
      SchedulingUnresolvedEvaluationSchema.safeParse(evaluation).success
    ).toBe(true)
    expect(
      SchedulingUnresolvedEvaluationSchema.safeParse({
        ...evaluation,
        summary: { ...evaluation.summary, missingClassCount: 1 },
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

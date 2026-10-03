import { describe, expect, it } from "vitest"
import {
  ClassRequirementInputSchema,
  GenerateSchedulingPlanSchema,
  SchedulingProposalSchema,
  SchedulingProposalDetailsSchema,
  SchedulingPreflightReportSchema,
  SchedulingCandidateSlotSchema,
  SchedulingHardConstraintEvaluationSchema,
  SchedulingCoverageEvaluationSchema,
  SchedulingDeterministicPlanCandidateSchema,
  SchedulingDeterministicRankingSchema,
  SchedulingEngineInputSnapshotSchema,
  SchedulingEngineSettingsSnapshotSchema,
  SchedulingTimeDistributionScoreSchema,
  SchedulingUnresolvedEvaluationSchema,
  SchedulingTimeGroupSettingsSchema,
  SchedulingScoreCriterionSchema,
  SchedulingDispatchResultSchema,
  SchedulingRunQuerySchema,
  SchedulingRunStatusSchema,
  SchedulingPlanSelectionResultSchema,
  SetSchedulingProposalLockSchema,
  UpdateSchedulingProposalSchema,
  SchedulingPlanValidationSchema,
  SchedulingPlanPublicationResultSchema,
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

  it("validates deterministic ranking coverage metadata", () => {
    const candidate = SchedulingDeterministicPlanCandidateSchema.parse({
      planKey: "plan-a",
      earnedWeightedPoints: 80,
      coveragePercent: 90,
      minimumCourseCoveragePercent: 80,
      uncoveredStudentCount: 2,
      timeDiversityScore: 0.75,
      maximumTeacherLoadRatio: 0.7,
      warningCount: 1,
      assignments: [],
    })
    const ranking = {
      plans: [
        {
          candidate,
          rank: 1,
          isRecommended: true,
          isWithinCoverageBand: true,
          stableTieBreakerKey: "NO_ASSIGNMENTS",
        },
      ],
      summary: {
        planCount: 1,
        recommendationCandidateCount: 1,
        bestCoveragePercent: 90,
        recommendationCoverageFloor: 85,
      },
    }

    expect(
      SchedulingDeterministicRankingSchema.safeParse(ranking).success
    ).toBe(true)
    expect(
      SchedulingDeterministicRankingSchema.safeParse({
        ...ranking,
        summary: { ...ranking.summary, recommendationCoverageFloor: 84 },
      }).success
    ).toBe(false)
  })

  it("rejects duplicate assignments in a deterministic plan candidate", () => {
    const assignment = {
      assignmentKey: "same",
      teacherId: ids.teacher,
      courseId: ids.course,
      dayOfWeek: "SUNDAY",
      startTime: "09:00",
      endTime: "10:30",
      classroomId: null,
    }

    expect(
      SchedulingDeterministicPlanCandidateSchema.safeParse({
        planKey: "plan-a",
        earnedWeightedPoints: 80,
        coveragePercent: null,
        minimumCourseCoveragePercent: null,
        uncoveredStudentCount: 0,
        timeDiversityScore: 1,
        maximumTeacherLoadRatio: 0,
        warningCount: 0,
        assignments: [assignment, assignment],
      }).success
    ).toBe(false)
  })

  it("validates engine snapshots and defaults legacy classroom activity", () => {
    const input = SchedulingEngineInputSnapshotSchema.parse({
      schemaVersion: "1",
      request: {
        termId: ids.plan,
        branchId: null,
        requirementIds: [ids.requirement],
        alternativePlanCount: 3,
      },
      term: {
        id: ids.plan,
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
      },
      requirements: [
        {
          id: ids.requirement,
          courseId: ids.course,
          branchId: null,
          requiredClassCount: 1,
          capacity: 12,
          sessionDurationMinutes: 90,
          deliveryMode: "IN_PERSON",
        },
      ],
      teachers: [],
      students: [],
      existingClasses: [],
      classrooms: [
        {
          id: ids.institute,
          branchId: null,
          capacity: 12,
        },
      ],
    })
    const settings = SchedulingEngineSettingsSnapshotSchema.safeParse({
      schemaVersion: "1",
      formulaVersion: "1",
      weights: { studentCoverage: 50, timeDiversity: 25 },
      timeGroups: {
        oddDays: ["SUNDAY", "TUESDAY"],
        evenDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        neutralDays: ["THURSDAY", "FRIDAY"],
        eveningStartsAt: "14:00",
        timeZone: "Asia/Tehran",
      },
      generation: { candidateStepMinutes: 30 },
    })

    expect(input.classrooms[0]?.isActive).toBe(true)
    expect(settings.success).toBe(true)
    expect(
      SchedulingEngineInputSnapshotSchema.safeParse({
        ...input,
        request: { ...input.request, alternativePlanCount: 4 },
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
      SchedulingProposalDetailsSchema.safeParse({
        ...result,
        course: { id: ids.course, title: "A2" },
        teacher: {
          id: ids.teacher,
          firstName: "Sara",
          lastName: "Ahmadi",
          avatarUrl: null,
        },
        branch: null,
        classroom: null,
        classRequirement: {
          id: ids.requirement,
          courseId: ids.course,
          requiredClassCount: 1,
          capacity: 12,
          deliveryMode: "ONLINE",
          course: { id: ids.course, title: "A2" },
        },
        lockedBy: null,
      }).success
    ).toBe(true)
    expect(
      SchedulingProposalSchema.safeParse({
        ...result,
        startTime: "11:00",
        endTime: "10:30",
      }).success
    ).toBe(false)
  })
})

describe("MVP-027 scheduling dispatch result schema", () => {
  it("accepts balanced worker counters", () => {
    expect(
      SchedulingDispatchResultSchema.safeParse({
        discoveredRunCount: 3,
        completedRunCount: 1,
        failedRunCount: 1,
        skippedRunCount: 1,
        requeuedStaleRunCount: 2,
      }).success
    ).toBe(true)
  })

  it("rejects counters that do not match discovered runs", () => {
    expect(
      SchedulingDispatchResultSchema.safeParse({
        discoveredRunCount: 2,
        completedRunCount: 1,
        failedRunCount: 0,
        skippedRunCount: 0,
        requeuedStaleRunCount: 0,
      }).success
    ).toBe(false)
  })
})

describe("MVP-028 scheduling run query schemas", () => {
  const completedRun = {
    runId: ids.plan,
    status: "COMPLETED",
    isTerminal: true,
    result: {
      planIds: [ids.requirement],
      recommendedPlanId: ids.requirement,
    },
    preflightReport: null,
    failureCode: null,
    failureMessage: null,
    startedAt: "2026-09-09T10:00:00.000Z",
    completedAt: "2026-09-09T10:01:00.000Z",
    createdAt: "2026-09-09T09:59:00.000Z",
    updatedAt: "2026-09-09T10:01:00.000Z",
  }

  it("accepts an optional institute lookup scope", () => {
    expect(SchedulingRunQuerySchema.parse({})).toEqual({})
    expect(
      SchedulingRunQuerySchema.parse({ instituteId: ids.institute })
    ).toEqual({ instituteId: ids.institute })
  })

  it("validates a completed result reference", () => {
    expect(SchedulingRunStatusSchema.safeParse(completedRun).success).toBe(true)
  })

  it("rejects inconsistent terminal and result states", () => {
    expect(
      SchedulingRunStatusSchema.safeParse({
        ...completedRun,
        isTerminal: false,
      }).success
    ).toBe(false)
    expect(
      SchedulingRunStatusSchema.safeParse({
        ...completedRun,
        status: "GENERATING",
      }).success
    ).toBe(false)
    expect(
      SchedulingRunStatusSchema.safeParse({
        ...completedRun,
        result: {
          ...completedRun.result,
          recommendedPlanId: ids.course,
        },
      }).success
    ).toBe(false)
  })
})

describe("MVP-030 scheduling review schemas", () => {
  it("validates manual proposal edits", () => {
    expect(
      UpdateSchedulingProposalSchema.safeParse({
        teacherId: ids.teacher,
        daysOfWeek: ["SUNDAY", "TUESDAY"],
        startTime: "09:00",
        endTime: "10:30",
      }).success
    ).toBe(true)
    expect(UpdateSchedulingProposalSchema.safeParse({}).success).toBe(false)
    expect(
      UpdateSchedulingProposalSchema.safeParse({
        deliveryMode: "ONLINE",
        classroomId: ids.institute,
      }).success
    ).toBe(false)
  })

  it("validates lock and selection results", () => {
    expect(SetSchedulingProposalLockSchema.parse({ isLocked: true })).toEqual({
      isLocked: true,
    })
    expect(
      SchedulingPlanSelectionResultSchema.safeParse({
        planId: ids.plan,
        runId: ids.requirement,
        status: "SELECTED",
        selectedAt: "2026-09-09T15:00:00.000Z",
      }).success
    ).toBe(true)
  })
})

describe("MVP-031 scheduling plan validation schema", () => {
  it("keeps validation summaries consistent", () => {
    const result = {
      planId: ids.plan,
      isValid: false,
      validatedAt: "2026-09-09T16:00:00.000Z",
      violations: [
        {
          code: "TEACHER_TIME_CONFLICT",
          scope: "PROPOSAL",
          proposalId: ids.requirement,
          conflictingEntityIds: [ids.teacher],
          context: {},
        },
      ],
      summary: {
        proposalCount: 1,
        violationCount: 1,
        invalidProposalCount: 1,
      },
    }

    expect(SchedulingPlanValidationSchema.safeParse(result).success).toBe(true)
    expect(
      SchedulingPlanValidationSchema.safeParse({
        ...result,
        isValid: true,
      }).success
    ).toBe(false)
  })
})

describe("MVP-032 scheduling publication result schema", () => {
  it("requires a published class for every non-empty result", () => {
    const result = {
      planId: ids.plan,
      runId: ids.requirement,
      status: "PUBLISHED",
      classIds: [ids.course],
      proposalCount: 1,
      publishedAt: "2026-09-09T17:00:00.000Z",
    }

    expect(
      SchedulingPlanPublicationResultSchema.safeParse(result).success
    ).toBe(true)
    expect(
      SchedulingPlanPublicationResultSchema.safeParse({
        ...result,
        classIds: [],
      }).success
    ).toBe(false)
    expect(
      SchedulingPlanPublicationResultSchema.safeParse({
        ...result,
        proposalCount: 2,
      }).success
    ).toBe(false)
  })
})

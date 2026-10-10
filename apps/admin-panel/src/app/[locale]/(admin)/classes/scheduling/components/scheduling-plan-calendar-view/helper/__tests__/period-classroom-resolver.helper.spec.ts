import { describe, expect, it } from "vitest"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import {
  planSessionSwap,
  resolvePeriodClassroomAssignment,
  type ClassroomOption,
} from "../period-classroom-resolver.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

describe("period-classroom-resolver helper", () => {
  const classrooms: ClassroomOption[] = [
    { id: "room-18", name: "کلاس ۱۰۱", capacity: 18 },
    { id: "room-8", name: "کلاس ۱۰۲", capacity: 8 },
  ]

  it("Strategy 1: assigns directly to an empty room when its capacity is sufficient", () => {
    const incomingSession: Proposal = {
      id: "prop-incoming",
      planId: "plan-1",
      instituteId: "inst-1",
      title: "AME 1-1",
      course: { id: "c1", title: "AME 1-1" },
      teacher: null,
      teacherId: null,
      branch: null,
      classroom: null,
      classroomId: null,
      capacity: 6,
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:00",
      endTime: "16:30",
      deliveryMode: "IN_PERSON",
      isLocked: false,
      isManuallyEdited: false,
      warnings: [],
      scoreBreakdown: [],
    }

    const resolution = resolvePeriodClassroomAssignment(
      incomingSession,
      "prop-leaving",
      {
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "15:00",
        endTime: "16:30",
      },
      [],
      classrooms
    )

    // Room 8 (cap 8 >= 6) is the smallest room that fits
    expect(resolution.assignedClassroom?.id).toBe("room-8")
    expect(resolution.innerReassignments).toHaveLength(0)
  })

  it("Strategy 2 (User Scenario): swaps classrooms with a concurrent session in that period when the only empty room is too small", () => {
    // User scenario:
    // odd-class needs 12 students.
    // The only empty room on Odd days (15:00 - 16:30) is room-8 (capacity 8).
    // An existing session on Odd days needs 7 students and is currently using room-18 (capacity 18).
    // System must switch classrooms: odd-class gets room-18, existing session gets room-8.

    const incomingOddClass: Proposal = {
      id: "prop-odd-class",
      planId: "plan-1",
      instituteId: "inst-1",
      title: "AME 2-3",
      course: { id: "c-ame-2-3", title: "American English File 2-3" },
      teacher: { id: "t-old", firstName: "استاد", lastName: "قدیمی" },
      teacherId: "t-old",
      branch: null,
      classroom: null,
      classroomId: null,
      capacity: 12,
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:00",
      endTime: "16:30",
      deliveryMode: "IN_PERSON",
      isLocked: false,
      isManuallyEdited: false,
      warnings: [],
      scoreBreakdown: [],
    }

    const existingSessionInSlot: Proposal = {
      id: "prop-existing-in-slot",
      planId: "plan-1",
      instituteId: "inst-1",
      title: "Touchstone 1",
      course: { id: "c-ts-1", title: "Touchstone 1" },
      teacher: { id: "t-existing", firstName: "مدرس", lastName: "فعلی" },
      teacherId: "t-existing",
      branch: null,
      classroom: { id: "room-18", name: "کلاس ۱۰۱", capacity: 18 },
      classroomId: "room-18",
      capacity: 7, // needs only 7 students
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:00",
      endTime: "16:30",
      deliveryMode: "IN_PERSON",
      isLocked: false,
      isManuallyEdited: false,
      warnings: [],
      scoreBreakdown: [],
    }

    const resolution = resolvePeriodClassroomAssignment(
      incomingOddClass,
      "prop-leaving-slot",
      {
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "15:00",
        endTime: "16:30",
      },
      [existingSessionInSlot],
      classrooms
    )

    // odd-class is assigned room-18
    expect(resolution.assignedClassroom?.id).toBe("room-18")

    // existingSessionInSlot is reassigned to room-8
    expect(resolution.innerReassignments).toHaveLength(1)
    expect(resolution.innerReassignments[0]?.proposal.id).toBe(
      "prop-existing-in-slot"
    )
    expect(resolution.innerReassignments[0]?.toClassroom.id).toBe("room-8")
  })

  it("planSessionSwap sets teacherId to null for both swapped sessions and plans classroom assignments", () => {
    const sessionA: Proposal = {
      id: "prop-a",
      planId: "plan-1",
      instituteId: "inst-1",
      title: "Class A",
      course: { id: "c1", title: "Course A" },
      teacher: { id: "t1", firstName: "T1", lastName: "L1" },
      teacherId: "t1",
      branch: null,
      classroom: { id: "room-18", name: "Room 18", capacity: 18 },
      classroomId: "room-18",
      capacity: 10,
      daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      startTime: "18:00",
      endTime: "19:30",
      deliveryMode: "IN_PERSON",
      isLocked: false,
      isManuallyEdited: false,
      warnings: [],
      scoreBreakdown: [],
    }

    const sessionB: Proposal = {
      id: "prop-b",
      planId: "plan-1",
      instituteId: "inst-1",
      title: "Class B",
      course: { id: "c2", title: "Course B" },
      teacher: { id: "t2", firstName: "T2", lastName: "L2" },
      teacherId: "t2",
      branch: null,
      classroom: { id: "room-8", name: "Room 8", capacity: 8 },
      classroomId: "room-8",
      capacity: 7,
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:00",
      endTime: "16:30",
      deliveryMode: "IN_PERSON",
      isLocked: false,
      isManuallyEdited: false,
      warnings: [],
      scoreBreakdown: [],
    }

    const plan = planSessionSwap(
      sessionA,
      sessionB,
      [sessionA, sessionB],
      classrooms
    )

    // Rule 1: Masters MUST be null for both swapped classes
    expect(plan.sourceNewTeacherId).toBeNull()
    expect(plan.targetNewTeacherId).toBeNull()

    // Rule 2: Session A gets Slot B days/time and a valid classroom
    expect(plan.sourceNewDays).toEqual(["SUNDAY", "TUESDAY", "THURSDAY"])
    expect(plan.sourceNewStartTime).toBe("15:00")
    expect(plan.sourceNewEndTime).toBe("16:30")
    expect(plan.sourceNewClassroom).not.toBeNull()

    // Session B gets Slot A days/time and a valid classroom
    expect(plan.targetNewDays).toEqual(["SATURDAY", "MONDAY", "WEDNESDAY"])
    expect(plan.targetNewStartTime).toBe("18:00")
    expect(plan.targetNewEndTime).toBe("19:30")
    expect(plan.targetNewClassroom).not.toBeNull()
  })
})

import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import type { SchedulingNewTeacherHiringAssignment } from "@workspace/types"
import { ClassesCarousel } from "../index"

describe("ClassesCarousel Component", () => {
  const mockAssignments: SchedulingNewTeacherHiringAssignment[] = [
    {
      key: "req-1#1",
      requirementId: "r1",
      course: { id: "c1", title: "AME 1" },
      classNumber: 1,
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "14:00",
      endTime: "15:30",
      classroom: { id: "room-1", name: "اتاق ۱۰۱", capacity: 15 },
    },
    {
      key: "req-1#2",
      requirementId: "r1",
      course: { id: "c1", title: "AME 1" },
      classNumber: 2,
      deliveryMode: "ONLINE",
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:30",
      endTime: "17:00",
      classroom: null,
    },
  ]

  it("renders null when assignments list is empty", () => {
    const { container } = render(
      <ClassesCarousel assignments={[]} activeAssignmentsState={{}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders carousel items and navigation buttons for multiple classes", () => {
    render(
      <ClassesCarousel
        assignments={mockAssignments}
        activeAssignmentsState={{
          "req-1#1": {
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "14:00",
            endTime: "15:30",
            classroomId: "room-1",
            classroomName: "اتاق ۱۰۱",
            isAssigned: true,
          },
          "req-1#2": {
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "15:30",
            endTime: "17:00",
            classroomId: null,
            classroomName: null,
            isAssigned: true,
          },
        }}
      />
    )

    expect(screen.getByText(/کلاس‌های پیشنهادی/)).toBeInTheDocument()
    expect(screen.getByText(/AME 1 · کلاس ۱/)).toBeInTheDocument()
    expect(screen.getByText(/AME 1 · کلاس ۲/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /previous slide/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /next slide/i })
    ).toBeInTheDocument()
  })
})

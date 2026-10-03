import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import type { SchedulingTeacherCalendar } from "@workspace/types"
import { ORDERED_WEEK_DAYS, TeacherAvailabilityCalendar } from "../index"

describe("TeacherAvailabilityCalendar Component", () => {
  const mockCalendars: SchedulingTeacherCalendar[] = [
    {
      teacher: {
        id: "t1",
        firstName: "علی",
        lastName: "محمدی",
        phone: "09120000001",
        avatarUrl: null,
      },
      teachableCourseIds: ["c1"],
      teachableCourses: [{ id: "c1", title: "AME 1" }],
      slots: [
        {
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "15:30",
          status: "FREE",
        },
        {
          dayOfWeek: "MONDAY",
          startTime: "16:00",
          endTime: "17:30",
          status: "BUSY",
          title: "AME 1",
        },
      ],
    },
  ]

  it("renders sticky header with all week days in page mode", () => {
    const { container } = render(
      <TeacherAvailabilityCalendar
        calendars={mockCalendars}
        scope="ALL"
        stickyTop="page"
      />
    )

    for (const day of ORDERED_WEEK_DAYS) {
      expect(
        container.querySelector(`[data-day-header="${day}"]`)
      ).toBeInTheDocument()
    }

    const header = container.querySelector(
      '[data-day-header="SATURDAY"]'
    )?.parentElement
    expect(header).toHaveClass("sticky")
    expect(header).toHaveClass("top-16")
    expect(screen.getByText("14:00–15:30")).toBeInTheDocument()
    expect(screen.getAllByText("AME 1").length).toBeGreaterThanOrEqual(1)
  })

  it("renders sticky header with top-0 in dialog mode", () => {
    const { container } = render(
      <TeacherAvailabilityCalendar
        calendars={mockCalendars}
        scope="QUALIFIED"
        stickyTop="dialog"
      />
    )

    const header = container.querySelector(
      '[data-day-header="SATURDAY"]'
    )?.parentElement
    expect(header).toHaveClass("sticky")
    expect(header).toHaveClass("top-0")
  })
})

import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import type { SchedulingTeacherOutreachOption } from "@workspace/types"
import { OutreachCarousel } from "../index"

describe("OutreachCarousel Component", () => {
  const mockOptions: SchedulingTeacherOutreachOption[] = [
    {
      key: "opt-1",
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "17:00",
      endTime: "18:30",
      teacher: {
        id: "teacher-1",
        firstName: "کامران",
        lastName: "حسینی",
      },
      higherLevelCourseTitle: "AME 2-2",
      availabilityChangeDays: [],
      availableClassrooms: [
        {
          id: "room-1",
          name: "کلاس A",
          capacity: 20,
        },
      ],
      isAccepted: false,
    },
    {
      key: "opt-2",
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      startTime: "17:00",
      endTime: "18:30",
      teacher: {
        id: "teacher-2",
        firstName: "فاطمه",
        lastName: "مرادنژاد",
      },
      higherLevelCourseTitle: "AME 5-3",
      availabilityChangeDays: [],
      availableClassrooms: [
        {
          id: "room-2",
          name: "کلاس B",
          capacity: 18,
        },
      ],
      isAccepted: true,
    },
  ]

  it("renders null when options list is empty", () => {
    const { container } = render(
      <OutreachCarousel
        options={[]}
        canToggle={true}
        isPending={() => false}
        onToggle={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders carousel items and navigates between outreach options", () => {
    const onToggle = vi.fn()
    render(
      <OutreachCarousel
        options={mockOptions}
        canToggle={true}
        isPending={() => false}
        onToggle={onToggle}
      />
    )

    // Option 1 content
    expect(screen.getByText("کامران حسینی")).toBeInTheDocument()
    expect(screen.getByText(/کلاس A/)).toBeInTheDocument()

    // Option 2 content
    expect(screen.getByText("فاطمه مرادنژاد")).toBeInTheDocument()
    expect(screen.getByText(/کلاس B/)).toBeInTheDocument()

    // Toggle button on option 1
    const buttons = screen.getAllByRole("button", { name: /استاد پذیرفت/ })
    expect(buttons.length).toBeGreaterThan(0)

    fireEvent.click(buttons[0]!)
    expect(onToggle).toHaveBeenCalledWith(mockOptions[0])
  })
})

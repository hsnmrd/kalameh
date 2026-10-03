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

  it("renders carousel items filling 90% width when multiple options exist, and navigates between options", () => {
    const onToggle = vi.fn()
    const { container } = render(
      <OutreachCarousel
        options={mockOptions}
        canToggle={true}
        isPending={() => false}
        onToggle={onToggle}
      />
    )

    // Verify CarouselItem slides have basis-[90%] to give 10% peek affordance
    const carouselItems = container.querySelectorAll(
      '[data-slot="carousel-item"]'
    )
    expect(carouselItems.length).toBe(2)
    expect(carouselItems[0]).toHaveClass("basis-[90%]")
    expect(carouselItems[1]).toHaveClass("basis-[90%]")

    // Option 1 content
    expect(screen.getByText("کامران حسینی")).toBeInTheDocument()
    expect(screen.getByText(/کلاس A/)).toBeInTheDocument()
    expect(screen.getAllByText(/17:00–18:30/).length).toBe(2)

    // Option 2 content
    expect(screen.getByText("فاطمه مرادنژاد")).toBeInTheDocument()
    expect(screen.getByText(/کلاس B/)).toBeInTheDocument()

    // Toggle button on option 1
    const acceptButtons = screen.getAllByRole("button", {
      name: /استاد پذیرفت/,
    })
    expect(acceptButtons.length).toBeGreaterThan(0)
    fireEvent.click(acceptButtons[0]!)
    expect(onToggle).toHaveBeenCalledWith(mockOptions[0], "ACCEPT")

    const rejectButtons = screen.getAllByRole("button", {
      name: /استاد رد کرد/,
    })
    expect(rejectButtons.length).toBeGreaterThan(0)
    fireEvent.click(rejectButtons[0]!)
    expect(onToggle).toHaveBeenCalledWith(mockOptions[0], "REJECT")
  })

  it("renders rejected badge and destructive state when option isRejected is true", () => {
    const rejectedOption: SchedulingTeacherOutreachOption = {
      ...mockOptions[0]!,
      isRejected: true,
    }
    render(
      <OutreachCarousel
        options={[rejectedOption]}
        canToggle={true}
        isPending={() => false}
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByText("رد شده توسط استاد")).toBeInTheDocument()
    const rejectBtn = screen.getByRole("button", { name: /استاد رد کرد/ })
    expect(rejectBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("renders carousel item with basis-full when only a single option exists", () => {
    const { container } = render(
      <OutreachCarousel
        options={[mockOptions[0]!]}
        canToggle={true}
        isPending={() => false}
        onToggle={vi.fn()}
      />
    )

    const carouselItems = container.querySelectorAll(
      '[data-slot="carousel-item"]'
    )
    expect(carouselItems.length).toBe(1)
    expect(carouselItems[0]).toHaveClass("basis-full")
    expect(carouselItems[0]).not.toHaveClass("basis-[90%]")
  })
})

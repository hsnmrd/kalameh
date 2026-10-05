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
    const teacherSlides = screen.getAllByTestId("outreach-teacher-slide")
    expect(teacherSlides.length).toBe(2)
    expect(teacherSlides[0]).toHaveClass("basis-[90%]")
    expect(teacherSlides[1]).toHaveClass("basis-[90%]")

    // Option 1 content
    expect(screen.getByText("کامران حسینی")).toBeInTheDocument()
    expect(screen.getAllByText(/17:00–18:30/).length).toBe(2)

    // Option 2 content
    expect(screen.getByText("فاطمه مرادنژاد")).toBeInTheDocument()

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

    const teacherSlides = screen.getAllByTestId("outreach-teacher-slide")
    expect(teacherSlides.length).toBe(1)
    expect(teacherSlides[0]).toHaveClass("basis-full")
    expect(teacherSlides[0]).not.toHaveClass("basis-[90%]")
  })

  it("groups multiple options for the same master into a single teacher card with all periods", () => {
    const onToggle = vi.fn()
    const sameTeacherOptions: SchedulingTeacherOutreachOption[] = [
      {
        key: "opt-1",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "09:00",
        endTime: "10:30",
        teacher: {
          id: "teacher-1",
          firstName: "کامران",
          lastName: "حسینی",
        },
        higherLevelCourseTitle: "AME 2-2",
        availabilityChangeDays: [],
        availableClassrooms: [{ id: "r1", name: "کلاس A", capacity: 20 }],
        isAccepted: false,
      },
      {
        key: "opt-2",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "14:00",
        endTime: "15:30",
        teacher: {
          id: "teacher-1",
          firstName: "کامران",
          lastName: "حسینی",
        },
        higherLevelCourseTitle: "AME 2-2",
        availabilityChangeDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        availableClassrooms: [{ id: "r2", name: "کلاس B", capacity: 18 }],
        isAccepted: false,
      },
      {
        key: "opt-3",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "16:00",
        endTime: "17:30",
        teacher: {
          id: "teacher-1",
          firstName: "کامران",
          lastName: "حسینی",
        },
        higherLevelCourseTitle: "AME 2-2",
        availabilityChangeDays: [],
        availableClassrooms: [{ id: "r3", name: "کلاس C", capacity: 15 }],
        isAccepted: false,
      },
    ]

    const { container } = render(
      <OutreachCarousel
        options={sameTeacherOptions}
        canToggle={true}
        isPending={() => false}
        onToggle={onToggle}
      />
    )

    // Should only have 1 carousel item (1 teacher card), not 3 duplicate cards
    const teacherSlides = screen.getAllByTestId("outreach-teacher-slide")
    expect(teacherSlides.length).toBe(1)
    expect(teacherSlides[0]).toHaveClass("basis-full")

    // Teacher name is shown once
    expect(screen.getByText("کامران حسینی")).toBeInTheDocument()

    // Periods count badge shows 3 periods
    expect(screen.getByText("۳ بازه پیشنهادی")).toBeInTheDocument()

    // All 3 period times are rendered inside that card
    expect(screen.getByText("09:00–10:30")).toBeInTheDocument()
    expect(screen.getByText("14:00–15:30")).toBeInTheDocument()
    expect(screen.getByText("16:00–17:30")).toBeInTheDocument()

    // All 3 period test ids exist
    expect(screen.getByTestId("outreach-period-item-opt-1")).toBeInTheDocument()
    expect(screen.getByTestId("outreach-period-item-opt-2")).toBeInTheDocument()
    expect(screen.getByTestId("outreach-period-item-opt-3")).toBeInTheDocument()

    // Clicking accept on the 2nd period toggles opt-2
    const acceptButtons = screen.getAllByRole("button", {
      name: /استاد پذیرفت/,
    })
    expect(acceptButtons.length).toBe(3)
    fireEvent.click(acceptButtons[1]!)
    expect(onToggle).toHaveBeenCalledWith(sameTeacherOptions[1], "ACCEPT")
  })

  it("groups options by master when multiple teachers exist and displays master counter", () => {
    const multiTeacherOptions: SchedulingTeacherOutreachOption[] = [
      {
        key: "opt-1",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "09:00",
        endTime: "10:30",
        teacher: {
          id: "teacher-1",
          firstName: "کامران",
          lastName: "حسینی",
        },
        higherLevelCourseTitle: "AME 2-2",
        availabilityChangeDays: [],
        availableClassrooms: [{ id: "r1", name: "کلاس A", capacity: 20 }],
      },
      {
        key: "opt-2",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "14:00",
        endTime: "15:30",
        teacher: {
          id: "teacher-1",
          firstName: "کامران",
          lastName: "حسینی",
        },
        higherLevelCourseTitle: "AME 2-2",
        availabilityChangeDays: [],
        availableClassrooms: [],
      },
      {
        key: "opt-3",
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "16:00",
        endTime: "17:30",
        teacher: {
          id: "teacher-2",
          firstName: "فاطمه",
          lastName: "مرادنژاد",
        },
        higherLevelCourseTitle: "AME 5-3",
        availabilityChangeDays: [],
        availableClassrooms: [{ id: "r2", name: "کلاس B", capacity: 18 }],
      },
    ]

    const { container } = render(
      <OutreachCarousel
        options={multiTeacherOptions}
        canToggle={true}
        isPending={() => false}
        onToggle={vi.fn()}
      />
    )

    // 2 teacher groups in carousel
    const teacherSlides = screen.getAllByTestId("outreach-teacher-slide")
    expect(teacherSlides.length).toBe(2)
    expect(teacherSlides[0]).toHaveClass("basis-[90%]")

    // Counter displays "استاد ۱ از ۲"
    expect(screen.getByText("استاد ۱ از ۲")).toBeInTheDocument()

    // Both teachers are present
    expect(screen.getByText("کامران حسینی")).toBeInTheDocument()
    expect(screen.getByText("فاطمه مرادنژاد")).toBeInTheDocument()

    // Teacher 1 has 2 periods, Teacher 2 has 1 period
    expect(screen.getByText("۲ بازه پیشنهادی")).toBeInTheDocument()
    expect(screen.getByText("۱ بازه پیشنهادی")).toBeInTheDocument()
  })
})

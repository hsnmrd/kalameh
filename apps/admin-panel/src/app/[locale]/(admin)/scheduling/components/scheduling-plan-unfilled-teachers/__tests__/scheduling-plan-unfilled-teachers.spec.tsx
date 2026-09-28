import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import type { SchedulingTeacherCalendar } from "@workspace/types"
import { SchedulingPlanUnfilledTeachers } from "../index"

describe("SchedulingPlanUnfilledTeachers", () => {
  const mockCalendars: SchedulingTeacherCalendar[] = [
    {
      teacher: {
        id: "t-1",
        firstName: "علی",
        lastName: "محمدی",
      },
      teachableCourses: [{ id: "c-1", title: "کلاس ۱" }],
      slots: [
        {
          dayOfWeek: "SATURDAY",
          startTime: "09:00",
          endTime: "10:30",
          status: "BUSY",
          title: "کلاس فعال",
          source: "PLAN",
        },
        {
          dayOfWeek: "SATURDAY",
          startTime: "10:30",
          endTime: "12:00",
          status: "FREE",
          title: null,
          source: "AVAILABILITY",
        },
      ],
    },
    {
      teacher: {
        id: "t-2",
        firstName: "سارا",
        lastName: "احمدی",
      },
      teachableCourses: [],
      slots: [
        {
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "16:00",
          status: "BUSY",
          title: "کلاس دوم",
          source: "PLAN",
        },
      ],
    },
  ]

  it("renders names and free slots count only for teachers with unfilled free time", () => {
    render(<SchedulingPlanUnfilledTeachers calendars={mockCalendars} />)

    expect(
      screen.getByText("استادان با زمان آزاد باقی‌مانده")
    ).toBeInTheDocument()
    // Ali has 1 free slot -> shown
    expect(screen.getByText("علی محمدی")).toBeInTheDocument()
    expect(screen.getByText("۱ بازه آزاد")).toBeInTheDocument()

    // Sara has 0 free slots -> not in the unfilled list
    expect(screen.queryByText("سارا احمدی")).not.toBeInTheDocument()

    // Contains link to full calendar
    expect(
      screen.getByRole("link", { name: "مشاهده تقویم همه استادان" })
    ).toBeInTheDocument()
  })

  it("renders message when all teachers are fully occupied", () => {
    const fullyOccupiedCalendars: SchedulingTeacherCalendar[] = [
      {
        teacher: {
          id: "t-2",
          firstName: "سارا",
          lastName: "احمدی",
        },
        teachableCourses: [],
        slots: [
          {
            dayOfWeek: "MONDAY",
            startTime: "14:00",
            endTime: "16:00",
            status: "BUSY",
            title: "کلاس دوم",
            source: "PLAN",
          },
        ],
      },
    ]

    render(
      <SchedulingPlanUnfilledTeachers calendars={fullyOccupiedCalendars} />
    )
    expect(
      screen.getByText(
        "تمامی زمان‌های حضور استادان در این برنامه با کلاس پوشش داده شده است."
      )
    ).toBeInTheDocument()
  })

  it("returns null when no calendars are provided", () => {
    const { container } = render(
      <SchedulingPlanUnfilledTeachers calendars={[]} />
    )
    expect(container.firstChild).toBeNull()
  })
})

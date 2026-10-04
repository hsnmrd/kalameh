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

  it("renders names, summarized free time, and teachable levels for teachers with unfilled free time", () => {
    render(<SchedulingPlanUnfilledTeachers calendars={mockCalendars} />)

    expect(
      screen.getByText("استادان با زمان آزاد باقی‌مانده")
    ).toBeInTheDocument()
    // Ali has free slot on SATURDAY 10:30-12:00 -> shown as زوج ۱۰:۳۰ - ۱۲:۰۰ and teachable level کلاس ۱
    expect(screen.getByText("علی محمدی")).toBeInTheDocument()
    expect(screen.getByText("زوج ۱۰:۳۰ - ۱۲:۰۰")).toBeInTheDocument()
    expect(screen.getByText("کلاس ۱")).toBeInTheDocument()

    // Sara has 0 free slots -> not in the unfilled list
    expect(screen.queryByText("سارا احمدی")).not.toBeInTheDocument()

    // Contains link to full calendar
    expect(
      screen.getByRole("link", { name: "مشاهده تقویم همه استادان" })
    ).toBeInTheDocument()
  })

  it("groups multi-day even and odd free slots into concise track summaries", () => {
    const multiSlotCalendars: SchedulingTeacherCalendar[] = [
      {
        teacher: {
          id: "t-1",
          firstName: "علی",
          lastName: "محمدی",
        },
        teachableCourses: [],
        slots: [
          {
            dayOfWeek: "SATURDAY",
            startTime: "10:30",
            endTime: "12:00",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
          {
            dayOfWeek: "MONDAY",
            startTime: "10:30",
            endTime: "12:00",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
          {
            dayOfWeek: "WEDNESDAY",
            startTime: "10:30",
            endTime: "12:00",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
          {
            dayOfWeek: "SUNDAY",
            startTime: "14:00",
            endTime: "15:30",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
          {
            dayOfWeek: "TUESDAY",
            startTime: "14:00",
            endTime: "15:30",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
        ],
      },
    ]

    render(<SchedulingPlanUnfilledTeachers calendars={multiSlotCalendars} />)

    expect(screen.getAllByText("زوج ۱۰:۳۰ - ۱۲:۰۰")).toHaveLength(1)
    expect(screen.getAllByText("فرد ۱۴:۰۰ - ۱۵:۳۰")).toHaveLength(1)
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

import { describe, expect, it } from "vitest"
import { render, screen } from "../../../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { SchedulingPlanCalendarView } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const mockProposals: Proposal[] = [
  {
    id: "prop-1",
    title: "کلاس صبح سطح A1",
    course: { id: "c1", title: "American English File 1" },
    teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 15 },
    daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    startTime: "09:00",
    endTime: "10:30",
    deliveryMode: "IN_PERSON",
    isLocked: false,
    isManuallyEdited: false,
    warnings: [],
    scoreBreakdown: [],
  },
  {
    id: "prop-2",
    title: "کلاس عصر سطح A2",
    course: { id: "c2", title: "American English File 2" },
    teacher: { id: "t2", firstName: "مریم", lastName: "رضایی" },
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 20 },
    daysOfWeek: ["SATURDAY"],
    startTime: "16:00",
    endTime: "17:30",
    deliveryMode: "IN_PERSON",
    isLocked: true,
    isManuallyEdited: true,
    warnings: [
      { code: "MANUAL_EDIT_REQUIRES_VALIDATION", severity: "WARNING" },
    ],
    scoreBreakdown: [],
  },
]

describe("SchedulingPlanCalendarView Component", () => {
  it("renders empty state when no proposals are provided", () => {
    render(<SchedulingPlanCalendarView proposals={[]} canEdit={false} />)

    expect(screen.getByText("کلاس قابل اجرا ساخته نشد")).toBeInTheDocument()
  })

  it("renders 7 week days in Persian calendar order", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(screen.getByText("شنبه")).toBeInTheDocument()
    expect(screen.getByText("یکشنبه")).toBeInTheDocument()
    expect(screen.getByText("دوشنبه")).toBeInTheDocument()
    expect(screen.getByText("سه‌شنبه")).toBeInTheDocument()
    expect(screen.getByText("چهارشنبه")).toBeInTheDocument()
    expect(screen.getByText("پنجشنبه")).toBeInTheDocument()
    expect(screen.getByText("جمعه")).toBeInTheDocument()
  })

  it("shows all-in-one representative week notice", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(
      screen.getByText("برنامه یک هفته نمونه (تکرار هفتگی در طول ترم)")
    ).toBeInTheDocument()
  })

  it("distributes proposals into proper days and sorts by time", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Saturday has 2 classes: A1 and A2
    const saturdayColumn = screen.getByRole("region", { name: /^شنبه \(/ })
    expect(saturdayColumn).toBeInTheDocument()
    expect(saturdayColumn).toHaveTextContent("American English File 1")
    expect(saturdayColumn).toHaveTextContent("American English File 2")

    // Monday has 1 class: A1
    const mondayColumn = screen.getByRole("region", { name: /^دوشنبه \(/ })
    expect(mondayColumn).toBeInTheDocument()
    expect(mondayColumn).toHaveTextContent("American English File 1")
    expect(mondayColumn).not.toHaveTextContent("American English File 2")

    // Sunday has no classes
    const sundayColumn = screen.getByRole("region", { name: /^یکشنبه \(/ })
    expect(sundayColumn).toBeInTheDocument()
    expect(sundayColumn).toHaveTextContent("تعطیل هفتگی")
  })

  it("displays teacher name, time range, and classroom capacity", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(screen.getAllByText("علی محمدی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("مریم رضایی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("کلاس ۱۰۱").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("کلاس ۱۰۲").length).toBeGreaterThanOrEqual(1)
  })

  it("groups classes within a day into distinct time slot sections", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const saturdayColumn = screen.getByRole("region", { name: /^شنبه \(/ })
    expect(saturdayColumn).toHaveTextContent("09:00 تا 10:30")
    expect(saturdayColumn).toHaveTextContent("16:00 تا 17:30")
  })
})

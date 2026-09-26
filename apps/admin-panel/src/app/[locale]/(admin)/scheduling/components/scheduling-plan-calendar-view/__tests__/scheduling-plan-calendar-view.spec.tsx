import { describe, expect, it } from "vitest"
import { render, screen, within } from "../../../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { SchedulingPlanCalendarView } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const mockProposals: Proposal[] = [
  {
    id: "prop-1",
    planId: "plan-1",
    instituteId: "inst-1",
    title: "کلاس صبح سطح A1",
    course: { id: "c1", title: "American English File 1" },
    teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 15 },
    capacity: 15,
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
    planId: "plan-1",
    instituteId: "inst-1",
    title: "کلاس عصر سطح A2",
    course: { id: "c2", title: "American English File 2" },
    teacher: { id: "t2", firstName: "مریم", lastName: "رضایی" },
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 20 },
    capacity: 14,
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

  it("renders Time column header and 7 week days in Persian calendar order", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(screen.getByText("ساعت")).toBeInTheDocument()
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

  it("renders time slot rows with time column and day cells", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Check time slot rows exist
    const row1 = screen.getByTestId("time-slot-row-09:00-10:30")
    const row2 = screen.getByTestId("time-slot-row-16:00-17:30")
    expect(row1).toBeInTheDocument()
    expect(row2).toBeInTheDocument()

    // Row 1 (09:00 - 10:30)
    expect(within(row1).getByText("09:00")).toBeInTheDocument()
    expect(within(row1).getByText("10:30")).toBeInTheDocument()

    // Saturday in Row 1 has A1
    const satCellRow1 = row1.querySelector('[data-day="SATURDAY"]')
    expect(satCellRow1).toHaveTextContent("American English File 1")

    // Monday in Row 1 has A1
    const monCellRow1 = row1.querySelector('[data-day="MONDAY"]')
    expect(monCellRow1).toHaveTextContent("American English File 1")

    // Sunday in Row 1 has empty placeholder
    const sunCellRow1 = row1.querySelector('[data-day="SUNDAY"]')
    expect(sunCellRow1).toHaveTextContent("—")

    // Row 2 (16:00 - 17:30)
    expect(within(row2).getByText("16:00")).toBeInTheDocument()
    expect(within(row2).getByText("17:30")).toBeInTheDocument()

    // Saturday in Row 2 has A2
    const satCellRow2 = row2.querySelector('[data-day="SATURDAY"]')
    expect(satCellRow2).toHaveTextContent("American English File 2")

    // Monday in Row 2 has empty placeholder
    const monCellRow2 = row2.querySelector('[data-day="MONDAY"]')
    expect(monCellRow2).toHaveTextContent("—")
  })

  it("displays teacher name, location, and capacity without time inside the card", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(screen.getAllByText("علی محمدی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("مریم رضایی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("کلاس ۱۰۱").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("کلاس ۱۰۲").length).toBeGreaterThanOrEqual(1)

    // The class card itself should not render inline clock/timeRange since time is in the Time column
    const card = screen.getAllByRole("article")[0]
    expect(card).toBeDefined()
    expect(card).toHaveTextContent("American English File 1")
    expect(card).not.toHaveTextContent("09:00 تا 10:30")
  })

  it("shows day header summary badges", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const satHeader = container.querySelector('[data-day-header="SATURDAY"]')
    expect(satHeader).toHaveTextContent("شنبه")
    expect(satHeader).toHaveTextContent("۲ کلاس")

    const sunHeader = container.querySelector('[data-day-header="SUNDAY"]')
    expect(sunHeader).toHaveTextContent("یکشنبه")
    expect(sunHeader).toHaveTextContent("تعطیل هفتگی")
  })

  it("renders capacity stepper with limits and disables plus when max is reached", () => {
    const editableProposals: Proposal[] = [
      ...mockProposals,
      {
        id: "prop-3",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس سطح B1",
        course: { id: "c3", title: "American English File 3" },
        teacher: { id: "t3", firstName: "سارا", lastName: "احمدی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr3", name: "کلاس ۱۰۳", capacity: 20 },
        capacity: 14,
        daysOfWeek: ["SUNDAY"],
        startTime: "09:00",
        endTime: "10:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={editableProposals}
        canEdit={true}
      />
    )

    // prop-1 has capacity 15 and max room capacity 15 (at max)
    // prop-3 has capacity 14 and max room capacity 20 (below max, unlocked)
    expect(screen.getAllByText("ظرفیت").length).toBeGreaterThanOrEqual(2)

    // Check displays
    expect(screen.getAllByText(/\/\s*(15|۱۵)/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\/\s*(20|۲۰)/).length).toBeGreaterThanOrEqual(1)

    // For prop-1 (at max capacity 15/15), the plus button is disabled
    const prop1Card = screen.getAllByRole("article", {
      name: "American English File 1",
    })[0]
    expect(prop1Card).toBeDefined()
    const prop1Plus = within(prop1Card!).getByRole("button", {
      name: "افزایش ظرفیت",
    })
    expect(prop1Plus).toBeDisabled()

    // For prop-3 (unlocked and at 14/20), the plus and minus buttons are enabled
    const prop3Card = screen.getByRole("article", {
      name: "American English File 3",
    })
    expect(prop3Card).toBeDefined()
    const prop3Plus = within(prop3Card).getByRole("button", {
      name: "افزایش ظرفیت",
    })
    expect(prop3Plus).not.toBeDisabled()
    const prop3Minus = within(prop3Card).getByRole("button", {
      name: "کاهش ظرفیت",
    })
    expect(prop3Minus).not.toBeDisabled()
  })
})

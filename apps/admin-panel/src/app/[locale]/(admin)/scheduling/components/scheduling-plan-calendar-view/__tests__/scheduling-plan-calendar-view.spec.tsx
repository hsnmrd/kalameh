import { describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  within,
} from "../../../../../../../test/test-utils"
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

  it("renders Time column header and 6 week days in Persian calendar order (excluding Friday)", () => {
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
    expect(screen.queryByText("جمعه")).not.toBeInTheDocument()
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

    // Sunday in Row 1 has empty placeholder with low opacity
    const sunCellRow1 = row1.querySelector('[data-day="SUNDAY"]')
    expect(sunCellRow1).toHaveTextContent("بدون کلاس")

    // Row 2 (16:00 - 17:30)
    expect(within(row2).getByText("16:00")).toBeInTheDocument()
    expect(within(row2).getByText("17:30")).toBeInTheDocument()

    // Saturday in Row 2 has A2
    const satCellRow2 = row2.querySelector('[data-day="SATURDAY"]')
    expect(satCellRow2).toHaveTextContent("American English File 2")

    // Monday in Row 2 has empty placeholder with low opacity
    const monCellRow2 = row2.querySelector('[data-day="MONDAY"]')
    expect(monCellRow2).toHaveTextContent("بدون کلاس")
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

  it("renders clean capacity display with limits and without stepper buttons", () => {
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
    // prop-3 has capacity 14 and max room capacity 20
    expect(screen.getAllByText("ظرفیت").length).toBeGreaterThanOrEqual(2)

    // Check displays formatted capacity
    expect(screen.getAllByText(/\/\s*(15|۱۵)/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/\/\s*(20|۲۰)/).length).toBeGreaterThanOrEqual(1)

    // Stepper plus and minus buttons must NOT be rendered in the calendar class card
    expect(
      screen.queryByRole("button", { name: "افزایش ظرفیت" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "کاهش ظرفیت" })
    ).not.toBeInTheDocument()
  })

  it("assigns consistent color theme for same class occurrences across different days", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // mockProposals[0] (prop-1) is on SATURDAY, MONDAY, WEDNESDAY
    const prop1Cards = container.querySelectorAll('[data-class-id="prop-1"]')
    expect(prop1Cards.length).toBe(3)

    // All sessions of prop-1 must have the same color index
    const prop1ColorIndex = prop1Cards[0]?.getAttribute("data-color-index")
    expect(prop1ColorIndex).toBeDefined()
    prop1Cards.forEach((card) => {
      expect(card.getAttribute("data-color-index")).toBe(prop1ColorIndex)
    })

    // mockProposals[1] (prop-2) is a different class, should have a different color index
    const prop2Cards = container.querySelectorAll('[data-class-id="prop-2"]')
    expect(prop2Cards.length).toBe(1)
    const prop2ColorIndex = prop2Cards[0]?.getAttribute("data-color-index")
    expect(prop2ColorIndex).not.toBe(prop1ColorIndex)
  })

  it("renders missed classes with distinct amber warning styling and new teacher badge", () => {
    const assignmentsState = {
      "missed-1": {
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"] as const,
        startTime: "14:00",
        endTime: "15:30",
        classroomId: "cr1",
        classroomName: "کلاس ۱۰۱",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "14:00",
          endTime: "15:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-missed", title: "Touchstone 1" }],
          assignments: [
            {
              key: "missed-1",
              requirementId: "req-1",
              course: { id: "c-missed", title: "Touchstone 1" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
              startTime: "14:00",
              endTime: "15:30",
              classroom: { id: "cr1", name: "کلاس ۱۰۱" },
            },
          ],
          availableTimeSlots: [
            {
              key: "SUNDAY,TUESDAY,THURSDAY|14:00|15:30",
              daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
              startTime: "14:00",
              endTime: "15:30",
              availableClassrooms: [{ id: "cr1", name: "کلاس ۱۰۱" }],
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
      />
    )

    // Check legend / badge
    expect(screen.getAllByText("استاد جدید").length).toBeGreaterThanOrEqual(1)

    // Check missed class card is rendered
    expect(screen.getAllByText("Touchstone 1").length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText("استاد جدید (در انتظار جذب)").length
    ).toBeGreaterThanOrEqual(1)
  })

  it("allows unassigning a missed class from calendar via the X action", () => {
    const onUnassignSpy = vi.fn()
    const assignmentsState = {
      "missed-1": {
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"] as const,
        startTime: "14:00",
        endTime: "15:30",
        classroomId: "cr1",
        classroomName: "کلاس ۱۰۱",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "14:00",
          endTime: "15:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-missed", title: "Touchstone 1" }],
          assignments: [
            {
              key: "missed-1",
              requirementId: "req-1",
              course: { id: "c-missed", title: "Touchstone 1" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
              startTime: "14:00",
              endTime: "15:30",
              classroom: { id: "cr1", name: "کلاس ۱۰۱" },
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
        onUnassignMissedClass={onUnassignSpy}
      />
    )

    const unassignButtons = screen.getAllByRole("button", {
      name: "حذف از جدول",
    })
    expect(unassignButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(unassignButtons[0]!)

    expect(onUnassignSpy).toHaveBeenCalledWith("missed-1")
  })

  it("renders low opacity empty cell placeholders in calendar grid", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Tuesday has 0 classes in mockProposals, header is dimmed
    const tuesdayHeader = container.querySelector('[data-day-header="TUESDAY"]')
    expect(tuesdayHeader).toHaveClass("opacity-50")

    // Friday column must not be present
    expect(container.querySelector('[data-day-header="FRIDAY"]')).toBeNull()

    // Empty cell in Tuesday Row 1 has noClasses text and low opacity
    const tuesdayEmptyCell = screen.getByTestId(
      "empty-cell-TUESDAY-09:00-10:30"
    )
    expect(tuesdayEmptyCell).toBeInTheDocument()
    expect(tuesdayEmptyCell).toHaveClass("opacity-40")
    expect(tuesdayEmptyCell).toHaveClass("h-[134px]")
    expect(tuesdayEmptyCell).toHaveTextContent("بدون کلاس")

    // Empty cell in Sunday Row 1 has noClasses text and low opacity
    const sundayEmptyCell = screen.getByTestId("empty-cell-SUNDAY-09:00-10:30")
    expect(sundayEmptyCell).toBeInTheDocument()
    expect(sundayEmptyCell).toHaveClass("opacity-40")
    expect(sundayEmptyCell).toHaveClass("h-[134px]")
    expect(sundayEmptyCell).toHaveTextContent("بدون کلاس")
  })

  it("equalizes height between regular class cards and missed class cards", () => {
    const assignmentsState = {
      "missed-1": {
        daysOfWeek: ["SUNDAY"] as const,
        startTime: "09:00",
        endTime: "10:30",
        classroomId: "cr1",
        classroomName: "کلاس ۱۰۱",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["SUNDAY"],
          startTime: "09:00",
          endTime: "10:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-missed", title: "Touchstone 1" }],
          assignments: [
            {
              key: "missed-1",
              requirementId: "req-1",
              course: { id: "c-missed", title: "Touchstone 1" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SUNDAY"],
              startTime: "09:00",
              endTime: "10:30",
              classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 15 },
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
      />
    )

    const regularCard = screen.getAllByTestId("calendar-class-card-prop-1")[0]!
    const missedCard = screen.getByTestId("missed-class-card-missed-1")

    expect(regularCard).toHaveClass("h-[134px]")
    expect(regularCard).toHaveClass(
      "border-chart-1/20",
      "border-s-chart-1/45",
      "bg-chart-1/[0.04]"
    )
    expect(missedCard).toHaveClass("h-[134px]")
    expect(missedCard).toHaveClass(
      "border-dashed",
      "border-warning/70",
      "bg-warning/10"
    )
    expect(missedCard).toHaveTextContent("ظرفیت")
    expect(missedCard).toHaveTextContent("۱۵ نفر")
  })

  it("renders prominent free slot button when a slot is assignable", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["THURSDAY"],
          startTime: "09:00",
          endTime: "10:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-missed", title: "Touchstone 1" }],
          assignments: [
            {
              key: "missed-1",
              requirementId: "req-1",
              course: { id: "c-missed", title: "Touchstone 1" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["THURSDAY"],
              startTime: "09:00",
              endTime: "10:30",
              classroom: { id: "cr1", name: "کلاس ۱۰۱" },
            },
          ],
          availableTimeSlots: [
            {
              key: "THURSDAY|09:00|10:30",
              daysOfWeek: ["THURSDAY"],
              startTime: "09:00",
              endTime: "10:30",
              availableClassrooms: [
                { id: "cr1", name: "کلاس ۱۰۱", capacity: 20 },
              ],
              isFullyBooked: false,
            },
          ],
        }}
        missedClassesAssignments={{
          "missed-1": {
            daysOfWeek: [],
            startTime: "",
            endTime: "",
            classroomId: null,
            classroomName: null,
            isAssigned: false,
          },
        }}
      />
    )

    expect(screen.getByText("زمان آزاد")).toBeInTheDocument()
    expect(screen.getByText("تخصیص کلاس")).toBeInTheDocument()
    const freeSlotButton = screen.getByRole("button", { name: /زمان آزاد/ })
    expect(freeSlotButton).toHaveClass("h-[134px]")
  })

  it("does not place an IN_PERSON missed class orange card in a day or slot where all physical classrooms are full", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "09:00",
          endTime: "10:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-missed", title: "Touchstone Physical" }],
          assignments: [
            {
              key: "missed-full-day",
              requirementId: "req-1",
              course: { id: "c-missed", title: "Touchstone Physical" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              startTime: "09:00",
              endTime: "10:30",
              classroom: null,
            },
          ],
          availableTimeSlots: [
            {
              key: "SATURDAY,MONDAY,WEDNESDAY|09:00|10:30",
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              startTime: "09:00",
              endTime: "10:30",
              availableClassrooms: [],
              isFullyBooked: true,
            },
          ],
        }}
        missedClassesAssignments={{
          "missed-full-day": {
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            startTime: "09:00",
            endTime: "10:30",
            classroomId: null,
            classroomName: null,
            isAssigned: true,
          },
        }}
      />
    )

    expect(
      screen.queryByTestId("missed-class-card-missed-full-day")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Touchstone Physical")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /زمان آزاد/ })
    ).not.toBeInTheDocument()
  })

  it("does not dim other classes on hover (selection is based on click only)", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const prop1Cards = container.querySelectorAll('[data-class-id="prop-1"]')
    const prop2Cards = container.querySelectorAll('[data-class-id="prop-2"]')
    expect(prop1Cards.length).toBe(3)
    expect(prop2Cards.length).toBe(1)

    // Initially nothing is active or dimmed
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(prop2Cards[0]?.getAttribute("data-dimmed")).toBeNull()

    // Hover over the first instance of prop-1 (Saturday)
    fireEvent.mouseEnter(prop1Cards[0]!)

    // Hover does NOT trigger calendar-wide dimming or active states
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(prop2Cards[0]?.getAttribute("data-dimmed")).toBeNull()
    expect(prop2Cards[0]).not.toHaveClass("grayscale")
    expect(prop2Cards[0]).not.toHaveClass("opacity-25")
  })

  it("pins sibling class cards on click and unpins on toggle, clear button, or Escape with opacity dimming preserving color", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const prop1Cards = container.querySelectorAll('[data-class-id="prop-1"]')
    const prop2Cards = container.querySelectorAll('[data-class-id="prop-2"]')

    // Click on prop-1 card to pin
    fireEvent.click(prop1Cards[0]!)

    prop1Cards.forEach((card) => {
      expect(card.getAttribute("data-active")).toBe("true")
      expect(card).toHaveClass("ring-2")
      expect(card).toHaveClass("opacity-100")
    })

    // prop-2 must be dimmed via opacity only, keeping its color (no grayscale)
    expect(prop2Cards[0]?.getAttribute("data-dimmed")).toBe("true")
    expect(prop2Cards[0]).toHaveClass("opacity-25")
    expect(prop2Cards[0]).not.toHaveClass("grayscale")

    // Clear selection button is displayed in the header
    const clearBtn = screen.getByTestId("clear-selection-btn")
    expect(clearBtn).toBeInTheDocument()

    // Click clear selection button to unpin
    fireEvent.click(clearBtn)

    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(prop2Cards[0]?.getAttribute("data-dimmed")).toBeNull()
    expect(screen.queryByTestId("clear-selection-btn")).toBeNull()

    // Test Escape key unpins
    fireEvent.click(prop1Cards[1]!)
    expect(prop1Cards[0]?.getAttribute("data-active")).toBe("true")
    fireEvent.keyDown(window, { key: "Escape" })
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
  })
})

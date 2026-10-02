import { describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "../../../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto, WeekDay } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
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

  it("renders Time column header and day tracks (Even and Odd days) in Persian calendar order", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(screen.getAllByText("ساعت").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("روزهای زوج").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("روزهای فرد").length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/شنبه، دوشنبه، چهارشنبه/).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/یکشنبه، سه‌شنبه، پنج‌شنبه/).length
    ).toBeGreaterThanOrEqual(1)
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

  it("renders time slot rows with time column and day track cells", () => {
    render(
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

    // Even track in Row 1 has A1 (prop-1 on Sat, Mon, Wed)
    const evenCellRow1 = row1.querySelector('[data-day="EVEN"]')
    expect(evenCellRow1).toHaveTextContent("American English File 1")

    // Odd track in Row 1 has empty placeholder with low opacity
    const oddCellRow1 = row1.querySelector('[data-day="ODD"]')
    expect(oddCellRow1).toHaveTextContent("بدون کلاس")

    // Row 2 (16:00 - 17:30)
    expect(within(row2).getByText("16:00")).toBeInTheDocument()
    expect(within(row2).getByText("17:30")).toBeInTheDocument()

    // Even track in Row 2 has A2 (prop-2 on Sat)
    const evenCellRow2 = row2.querySelector('[data-day="EVEN"]')
    expect(evenCellRow2).toHaveTextContent("American English File 2")

    // Odd track in Row 2 has empty placeholder with low opacity
    const oddCellRow2 = row2.querySelector('[data-day="ODD"]')
    expect(oddCellRow2).toHaveTextContent("بدون کلاس")
  })

  it("displays teacher name, location, and capacity without time inside the card when expanded", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={false}
        defaultCollapsed={false}
      />
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

  it("renders delivery mode as icon-only and room name with ellipsis truncation to prioritize session title", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // The session cards should not contain visible text "حضوری" or "آنلاین" in delivery mode badge
    const card = screen.getAllByRole("article")[0]!
    expect(within(card).queryByText("حضوری")).not.toBeInTheDocument()
    expect(within(card).queryByText("آنلاین")).not.toBeInTheDocument()

    // But delivery mode is accessible via title / aria-label on the icon container
    const deliveryIcon = card.querySelector('[aria-label="حضوری"]')
    expect(deliveryIcon).toBeInTheDocument()
    expect(deliveryIcon).toHaveAttribute("title", "حضوری")

    // Session title is rendered prominently with full course title
    expect(
      within(card).getByText("American English File 1")
    ).toBeInTheDocument()

    // Room name is inside a truncating container
    const roomSpan = within(card).getByText("کلاس ۱۰۱")
    expect(roomSpan).toHaveClass("truncate")
  })

  it("does not render top mobile track switcher buttons", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    expect(
      screen.queryByTestId("mobile-track-even-btn")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("mobile-track-odd-btn")).not.toBeInTheDocument()
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
        defaultCollapsed={false}
      />
    )

    // prop-1 has capacity 15 and max room capacity 15 (at max)
    // prop-3 has capacity 14 and max room capacity 20
    expect(screen.getAllByText(/نفر/).length).toBeGreaterThanOrEqual(2)

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

    // mockProposals[0] (prop-1) is on SATURDAY, MONDAY, WEDNESDAY, which maps to EVEN track once
    const prop1Cards = container.querySelectorAll('[data-class-id="prop-1"]')
    expect(prop1Cards.length).toBe(1)

    const prop1ColorIndex = prop1Cards[0]?.getAttribute("data-color-index")
    expect(prop1ColorIndex).toBeDefined()

    // mockProposals[1] (prop-2) is a different class, should have a different color index
    const prop2Cards = container.querySelectorAll('[data-class-id="prop-2"]')
    expect(prop2Cards.length).toBe(1)
    const prop2ColorIndex = prop2Cards[0]?.getAttribute("data-color-index")
    expect(prop2ColorIndex).not.toBe(prop1ColorIndex)
  })

  it("provides a mobile snap carousel that mounts day columns with 10% peek affordance without top switcher buttons", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // The top button switcher is deleted in mobile view
    expect(
      screen.queryByTestId("mobile-track-even-btn")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("mobile-track-odd-btn")).not.toBeInTheDocument()

    // Both day columns are mounted in the carousel slides with basis-[88%] for 10% peek affordance
    const carouselItems = container.querySelectorAll(
      '[data-slot="carousel-item"]'
    )
    expect(carouselItems.length).toBeGreaterThanOrEqual(2)
    expect(carouselItems[0]).toHaveClass("basis-[88%]")

    const evenColumn = container.querySelector('[data-day="EVEN"]')
    const oddColumn = container.querySelector('[data-day="ODD"]')
    expect(evenColumn).toBeInTheDocument()
    expect(oddColumn).toBeInTheDocument()
  })

  it("renders mobile snap carousel slides with 10% peek width and desktop 2-column grid adaptation", () => {
    const { container } = render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Verify CarouselContent has desktop grid classes and mobile flex
    const carouselContent = container.querySelector(
      '[data-slot="carousel-content"]'
    )
    expect(carouselContent).toBeInTheDocument()
    const innerWrapper = carouselContent?.firstElementChild
    expect(innerWrapper).toHaveClass(
      "md:grid",
      "md:grid-cols-2",
      "md:gap-3.5",
      "md:items-start"
    )

    // Verify CarouselItem slides have basis-[88%] for mobile and md:basis-full for desktop
    const carouselItems = container.querySelectorAll(
      '[data-slot="carousel-item"]'
    )
    carouselItems.forEach((item) => {
      expect(item).toHaveClass(
        "basis-[88%]",
        "ps-2.5",
        "md:basis-full",
        "md:ps-0"
      )
    })
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
        defaultCollapsed={false}
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
        defaultCollapsed={false}
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
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={false}
        defaultCollapsed={false}
      />
    )

    // Empty cell in Odd Row 1 has noClasses text and low opacity
    const oddEmptyCell = screen.getByTestId("empty-cell-ODD-09:00-10:30")
    expect(oddEmptyCell).toBeInTheDocument()
    expect(oddEmptyCell).toHaveClass("opacity-40")
    expect(oddEmptyCell).toHaveClass("min-h-[84px]")
    expect(oddEmptyCell).toHaveTextContent("بدون کلاس")
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
        defaultCollapsed={false}
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

    expect(regularCard).toHaveClass("min-h-[84px]")
    expect(regularCard).toHaveClass(
      "border-border/80",
      "border-s-blue-500",
      "bg-card"
    )
    expect(missedCard).toHaveClass("min-h-[84px]")
    expect(missedCard).toHaveClass(
      "border-dashed",
      "border-warning/70",
      "bg-warning/10"
    )
    expect(missedCard).toHaveTextContent("۱۵ نفر")
  })

  it("renders prominent free slot button when a slot is assignable", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        defaultCollapsed={false}
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
    expect(freeSlotButton).toHaveClass("min-h-[84px]")
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
    expect(prop1Cards.length).toBe(1)
    expect(prop2Cards.length).toBe(1)

    // Initially nothing is active or dimmed
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(prop2Cards[0]?.getAttribute("data-dimmed")).toBeNull()

    // Hover over prop-1 (Even days)
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

    // prop-2 is an unrelated non-swappable card, so it is omitted from the DOM when a session is selected
    expect(container.querySelector('[data-class-id="prop-2"]')).toBeNull()

    // Clear selection button is displayed in the header
    const clearBtn = screen.getByTestId("clear-selection-btn")
    expect(clearBtn).toBeInTheDocument()

    // Click clear selection button to unpin and restore all cards
    fireEvent.click(clearBtn)

    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(container.querySelector('[data-class-id="prop-2"]')).not.toBeNull()
    expect(screen.queryByTestId("clear-selection-btn")).toBeNull()

    // Test Escape key unpins and restores all cards
    fireEvent.click(prop1Cards[0]!)
    expect(prop1Cards[0]?.getAttribute("data-active")).toBe("true")
    expect(container.querySelector('[data-class-id="prop-2"]')).toBeNull()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    expect(container.querySelector('[data-class-id="prop-2"]')).not.toBeNull()
  })

  it("defaults to collapsed state where time slots are collapsed showing period time and class count summary", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Time slot toggles are collapsed by default
    const row1Toggle = screen.getByTestId("time-slot-toggle-09:00-10:30")
    const row2Toggle = screen.getByTestId("time-slot-toggle-16:00-17:30")
    expect(row1Toggle).toHaveAttribute("aria-expanded", "false")
    expect(row2Toggle).toHaveAttribute("aria-expanded", "false")

    // Content of both rows is collapsed (0fr and opacity-0)
    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content1).toHaveClass("opacity-0")
    expect(content2).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("opacity-0")

    // Time slot header badges display classes count
    const badge1 = screen.getByTestId("slot-classes-badge-09:00-10:30")
    expect(badge1).toHaveTextContent("۱ کلاس")

    // Global expand/collapse toggle shows "باز کردن همه"
    const toggleAllBtn = screen.getByTestId("toggle-collapse-all-btn")
    expect(toggleAllBtn).toHaveTextContent("باز کردن همه")
  })

  it("toggles collapse and expand on individual period hour rows", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const row1Toggle = screen.getByTestId("time-slot-toggle-09:00-10:30")
    const row2Toggle = screen.getByTestId("time-slot-toggle-16:00-17:30")
    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")

    // Both rows initially collapsed
    expect(row1Toggle.getAttribute("aria-expanded")).toBe("false")
    expect(row1Toggle).toHaveClass("min-h-[52px]")
    expect(row2Toggle.getAttribute("aria-expanded")).toBe("false")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("grid-rows-[0fr]")

    // Both rows initially collapsed with class count badge visible
    expect(
      screen.getByTestId("slot-classes-badge-09:00-10:30")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("slot-classes-badge-16:00-17:30")
    ).toBeInTheDocument()
    expect(screen.queryByText("بستن بازه")).not.toBeInTheDocument()
    expect(screen.queryByText("باز کردن بازه")).not.toBeInTheDocument()

    // Expand Row 1
    fireEvent.click(row1Toggle)

    expect(row1Toggle.getAttribute("aria-expanded")).toBe("true")
    expect(row1Toggle).toHaveClass("min-h-[52px]")
    expect(row1Toggle).toHaveClass("sticky")
    expect(row1Toggle).toHaveClass("bg-background")
    expect(row1Toggle).toHaveClass("z-20")
    expect(row2Toggle.getAttribute("aria-expanded")).toBe("false")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content1).toHaveClass("opacity-100")
    // When expanded, the class count badge is hidden for Row 1
    expect(
      screen.queryByTestId("slot-classes-badge-09:00-10:30")
    ).not.toBeInTheDocument()
    // Row 2 remains collapsed, so its badge is still present
    expect(content2).toHaveClass("grid-rows-[0fr]")
    expect(
      screen.getByTestId("slot-classes-badge-16:00-17:30")
    ).toBeInTheDocument()

    // Collapse Row 1 back
    fireEvent.click(row1Toggle)

    expect(row1Toggle.getAttribute("aria-expanded")).toBe("false")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    // When collapsed again, the class count badge reappears
    expect(
      screen.getByTestId("slot-classes-badge-09:00-10:30")
    ).toBeInTheDocument()
  })

  it("expands and collapses all rows via the global expand/collapse all button", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const toggleAllBtn = screen.getByTestId("toggle-collapse-all-btn")
    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")

    expect(toggleAllBtn).toHaveTextContent("باز کردن همه")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("grid-rows-[0fr]")

    // Expand all
    fireEvent.click(toggleAllBtn)

    expect(toggleAllBtn).toHaveTextContent("بستن همه")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content1).toHaveClass("opacity-100")
    expect(content2).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("opacity-100")

    // Collapse all
    fireEvent.click(toggleAllBtn)

    expect(toggleAllBtn).toHaveTextContent("باز کردن همه")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("grid-rows-[0fr]")
  })

  it("automatically expands all time slots when a session card is clicked to enter swap mode", () => {
    const { container } = render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        defaultCollapsed={true}
      />
    )

    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")

    // Initially both rows are collapsed
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("grid-rows-[0fr]")

    // Click on a session card in the calendar
    const prop1Card = container.querySelector('[data-class-id="prop-1"]')!
    expect(prop1Card).toBeInTheDocument()
    fireEvent.click(prop1Card)

    // The session card becomes active with distinct background and border
    expect(prop1Card).toHaveAttribute("data-active", "true")
    expect(prop1Card).toHaveClass("bg-primary/15")
    expect(prop1Card).toHaveClass("border-primary")

    // Both time slots automatically expand so user can see all swappable target cards across all periods
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("grid-rows-[1fr]")
  })

  it("renders missed classes with title and teacher within the time slot accordion", () => {
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

    const slotContent = screen.getByTestId("time-slot-content-09:00-10:30")
    expect(slotContent).toHaveClass("grid-rows-[0fr]")

    // Expand slot 09:00-10:30
    const toggleBtn = screen.getByTestId("time-slot-toggle-09:00-10:30")
    fireEvent.click(toggleBtn)

    expect(slotContent).toHaveClass("grid-rows-[1fr]")
    const missedCard = screen.getByTestId("missed-class-card-missed-1")
    expect(missedCard).toHaveClass("min-h-[84px]")
    expect(missedCard).toHaveTextContent("Touchstone 1")
    expect(missedCard).toHaveTextContent("استاد جدید (در انتظار جذب)")
    expect(missedCard).toHaveTextContent("۱۵ نفر")
  })

  it("toggles showing free teacher names under class cards of each period", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={false}
        teacherCalendars={[
          {
            teacher: { id: "t-free-1", firstName: "حسین", lastName: "مرادی" },
            teachableCourses: [{ id: "c1", title: "American English File 1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "09:00",
                endTime: "12:00",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "BUSY",
                title: "کلاس ثبت‌شده",
                source: "PLAN",
              },
            ],
          },
          {
            teacher: { id: "t-free-2", firstName: "زهرا", lastName: "کریمی" },
            teachableCourses: [{ id: "c2", title: "American English File 2" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    const toggleFreeTeachersBtn = screen.getByTestId("toggle-free-teachers-btn")
    expect(toggleFreeTeachersBtn).toHaveTextContent("نمایش استادان آزاد")
    expect(toggleFreeTeachersBtn).toHaveAttribute("aria-pressed", "false")

    // Initially hidden
    expect(
      screen.queryByTestId("free-teachers-EVEN-09:00-10:30")
    ).not.toBeInTheDocument()

    // Toggle on
    fireEvent.click(toggleFreeTeachersBtn)
    expect(toggleFreeTeachersBtn).toHaveAttribute("aria-pressed", "true")

    // Even track 09:00-10:30 has both حسین مرادی and زهرا کریمی under the class card
    const evenFreeTeachers = screen.getByTestId(
      "free-teachers-EVEN-09:00-10:30"
    )
    expect(evenFreeTeachers).toBeInTheDocument()
    expect(evenFreeTeachers).toHaveTextContent("استاد آزاد")
    expect(evenFreeTeachers).toHaveTextContent("حسین مرادی")
    expect(evenFreeTeachers).toHaveTextContent("زهرا کریمی")

    // Odd track 09:00-10:30 has no free teachers
    expect(
      screen.queryByTestId("free-teachers-ODD-09:00-10:30")
    ).not.toBeInTheDocument()

    // Toggle off
    fireEvent.click(toggleFreeTeachersBtn)
    expect(toggleFreeTeachersBtn).toHaveAttribute("aria-pressed", "false")
    expect(
      screen.queryByTestId("free-teachers-EVEN-09:00-10:30")
    ).not.toBeInTheDocument()
  })

  it("renders free teacher card with the same UI structure as class card in collapsed and expanded modes", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={true}
        hiringPlan={{
          daysOfWeek: ["SATURDAY"],
          startTime: "09:00",
          endTime: "10:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-ame-2-2", title: "AME ۲-۲" }],
          assignments: [
            {
              key: "missed-ame-2-2",
              requirementId: "req-ame-2-2",
              course: { id: "c-ame-2-2", title: "AME ۲-۲" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY"],
              startTime: "09:00",
              endTime: "10:30",
              classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 20 },
            },
          ],
        }}
        missedClassesAssignments={{
          "missed-ame-2-2": {
            daysOfWeek: ["SATURDAY"],
            startTime: "09:00",
            endTime: "10:30",
            classroomId: "cr2",
            classroomName: "کلاس ۱۰۲",
            isAssigned: true,
          },
        }}
        teacherCalendars={[
          {
            teacher: {
              id: "t-higher",
              firstName: "نیلوفر",
              lastName: "صادقی",
            },
            teachableCourses: [
              { id: "c-ame-3-1", title: "AME ۳-۱" },
              { id: "c-ame-3-2", title: "AME ۳-۲" },
              { id: "c-ame-4-1", title: "AME ۴-۱" },
              { id: "c-ame-4-2", title: "AME ۴-۲" },
            ],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    // Turn on free teachers display
    fireEvent.click(screen.getByTestId("toggle-free-teachers-btn"))

    // Expand all rows to view inside accordion
    fireEvent.click(screen.getByTestId("toggle-collapse-all-btn"))

    const freeTeacherCard = screen.getByTestId(
      "free-teacher-card-t-higher-EVEN-09:00-10:30"
    )

    expect(freeTeacherCard).toHaveClass("min-h-[84px]")
    expect(freeTeacherCard).toHaveTextContent("نیلوفر صادقی")
    expect(freeTeacherCard).toHaveTextContent("پیشنهاد برای AME ۲-۲")
    expect(freeTeacherCard).toHaveTextContent("AME ۳-۱ ~ AME ۴-۲")
    expect(freeTeacherCard).not.toHaveTextContent("AME ۳-۲")
    expect(freeTeacherCard).not.toHaveTextContent("AME ۴-۱")
  })

  it("shakes compatible class cards and free teacher cards when a class card is clicked and opens the swap dialog on click", () => {
    const swappableProposals: Proposal[] = [
      ...mockProposals, // prop-1 (unlocked, 09:00-10:30, A1, cr1 cap 15) & prop-2 (locked)
      {
        id: "prop-swap-target",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس صبح موازی A1",
        course: { id: "c1", title: "American English File 1" },
        teacher: { id: "t-swap", firstName: "رضا", lastName: "نوری" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr3", name: "کلاس ۱۰۳", capacity: 18 },
        capacity: 14,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "11:00",
        endTime: "12:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={swappableProposals}
        canEdit={true}
        teacherCalendars={[
          {
            teacher: {
              id: "t-free-swap",
              firstName: "سارا",
              lastName: "احمدی",
            },
            teachableCourses: [{ id: "c1", title: "American English File 1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    // Turn on free teachers display
    fireEvent.click(screen.getByTestId("toggle-free-teachers-btn"))

    const prop1Card = screen.getAllByTestId("calendar-class-card-prop-1")[0]!
    const prop2LockedCard = screen.getByTestId("calendar-class-card-prop-2")
    const swapTargetCard = screen.getAllByTestId(
      "calendar-class-card-prop-swap-target"
    )[0]!
    const freeTeacherCard = screen.getByTestId(
      "free-teacher-card-t-free-swap-EVEN-09:00-10:30"
    )

    // Click prop-1 to enter swap mode
    fireEvent.click(prop1Card)

    // prop-1 is active
    expect(prop1Card).toHaveAttribute("data-active", "true")

    // prop-2 is locked, so it cannot swap and is omitted
    expect(
      screen.queryByTestId("calendar-class-card-prop-2")
    ).not.toBeInTheDocument()

    // prop-swap-target is compatible, so it shakes and is not dimmed
    expect(swapTargetCard).toHaveAttribute("data-swappable", "true")
    expect(swapTargetCard).toHaveClass("animate-calendar-card-shake")
    expect(swapTargetCard).not.toHaveAttribute("data-dimmed")

    // freeTeacherCard is qualified and free across SAT/MON/WED 09:00-10:30, so it also shakes
    expect(freeTeacherCard).toHaveAttribute("data-swappable", "true")
    expect(freeTeacherCard).toHaveClass("animate-calendar-card-shake")
    expect(freeTeacherCard).not.toHaveAttribute("data-dimmed")

    // Clicking on the shaking swapTargetCard opens the SwapClassDialog with checkbox options
    fireEvent.click(swapTargetCard)

    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()
    expect(screen.getByTestId("swap-option-teacher")).toBeInTheDocument()
    expect(screen.getByTestId("swap-option-classroom")).toBeInTheDocument()
    expect(screen.getByTestId("swap-option-date")).toBeInTheDocument()
    expect(screen.getByTestId("swap-confirm-btn")).not.toBeDisabled()
  })

  it("keeps the swap dialog open when clicking checkboxes, option cards, or summary cards, and applies swap changes on submit", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    const toMutationSpy = vi
      .spyOn(schedulingResource.updateProposal, "toMutation")
      .mockReturnValue({
        mutationKey: ["scheduling", "updateProposal"],
        mutationFn: updateProposalMutationFn,
      })

    const swappableProposals: Proposal[] = [
      ...mockProposals,
      {
        id: "prop-swap-target",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس صبح موازی A1",
        course: { id: "c1", title: "American English File 1" },
        teacher: { id: "t-swap", firstName: "رضا", lastName: "نوری" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr3", name: "کلاس ۱۰۳", capacity: 18 },
        capacity: 14,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "11:00",
        endTime: "12:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={swappableProposals}
        canEdit={true}
        defaultCollapsed={false}
      />
    )

    // 1. Select prop-1 and click prop-swap-target to open SwapClassDialog
    fireEvent.click(screen.getAllByTestId("calendar-class-card-prop-1")[0]!)
    fireEvent.click(
      screen.getAllByTestId("calendar-class-card-prop-swap-target")[0]!
    )

    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    const sourceCard = screen.getByTestId("swap-source-card")
    const targetCard = screen.getByTestId("swap-target-card")
    const teacherCheckbox = screen.getByTestId("swap-option-teacher")
    const classroomCheckbox = screen.getByTestId("swap-option-classroom")
    const classroomOptionCard = screen.getByTestId(
      "swap-option-classroom-label"
    )
    const dateOptionCard = screen.getByTestId("swap-option-date-label")

    // Default selection is changeTeacher = true
    expect(teacherCheckbox).toHaveAttribute("aria-checked", "true")
    expect(classroomCheckbox).toHaveAttribute("aria-checked", "false")
    expect(sourceCard).toHaveTextContent("رضا نوری")
    expect(targetCard).toHaveTextContent("علی محمدی")

    // 2. Clicking on the summary cards inside the dialog must NOT close the dialog
    fireEvent.click(sourceCard)
    fireEvent.click(targetCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    // 3. Clicking on the classroom option card switches to { changeTeacher: false, changeClassroom: true, changeDate: true } without closing the dialog
    fireEvent.click(classroomOptionCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()
    expect(classroomCheckbox).toHaveAttribute("aria-checked", "true")
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(teacherCheckbox).toHaveAttribute("aria-checked", "false")
    expect(sourceCard).toHaveTextContent("کلاس ۱۰۳")
    expect(targetCard).toHaveTextContent("کلاس ۱۰۱")

    // 4. Clicking directly on the classroom checkbox unchecks both paired options (changeClassroom & changeDate) without closing the dialog
    fireEvent.click(classroomCheckbox)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()
    expect(classroomCheckbox).toHaveAttribute("aria-checked", "false")
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "false"
    )

    // Clicking date option card checks both changeDate and changeClassroom so physical classrooms swap together with periods
    fireEvent.click(dateOptionCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(classroomCheckbox).toHaveAttribute("aria-checked", "true")
    expect(teacherCheckbox).toHaveAttribute("aria-checked", "false")

    // 5. Clicking the submit button calls updateProposal with both classroomId and schedule fields for both classes
    const confirmBtn = screen.getByTestId("swap-confirm-btn")
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual({
      planId: "plan-1",
      proposalId: "prop-1",
      instituteId: "inst-1",
      body: {
        classroomId: "cr3",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "11:00",
        endTime: "12:30",
      },
    })
    expect(updateProposalMutationFn.mock.calls[1]?.[0]).toEqual({
      planId: "plan-1",
      proposalId: "prop-swap-target",
      instituteId: "inst-1",
      body: {
        classroomId: "cr1",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "09:00",
        endTime: "10:30",
      },
    })

    // Dialog closes and calendar reflects the swapped classroom and period
    await waitFor(() => {
      expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()
    })

    const updatedProp1Card = screen.getAllByTestId(
      "calendar-class-card-prop-1"
    )[0]!
    expect(updatedProp1Card).toHaveTextContent("کلاس ۱۰۳")

    toMutationSpy.mockRestore()
  })

  it("does not mark two same-course classes as swappable when teachers are only available in their own slots and share the same classroom", () => {
    const sameCourseLockedToOwnSlotProposals: Proposal[] = [
      {
        id: "prop-a",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس صبح A1",
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
        id: "prop-b",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس ظهر A1",
        course: { id: "c1", title: "American English File 1" },
        teacher: { id: "t2", firstName: "رضا", lastName: "نوری" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 15 },
        capacity: 15,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "11:00",
        endTime: "12:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={sameCourseLockedToOwnSlotProposals}
        canEdit={true}
        teacherCalendars={[
          {
            teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
            teachableCourses: [{ id: "c1", title: "American English File 1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "09:00",
                endTime: "10:30",
                status: "BUSY",
                title: "کلاس صبح A1",
                source: "PLAN",
              },
            ],
          },
          {
            teacher: { id: "t2", firstName: "رضا", lastName: "نوری" },
            teachableCourses: [{ id: "c1", title: "American English File 1" }],
            slots: [
              {
                dayOfWeek: "SUNDAY",
                startTime: "11:00",
                endTime: "12:30",
                status: "BUSY",
                title: "کلاس ظهر A1",
                source: "PLAN",
              },
            ],
          },
        ]}
      />
    )

    const propACard = screen.getAllByTestId("calendar-class-card-prop-a")[0]!
    const propBCard = screen.getAllByTestId("calendar-class-card-prop-b")[0]!

    fireEvent.click(propACard)
    // Non-swappable same-course class is omitted from the grid when prop-a is selected
    expect(
      screen.queryByTestId("calendar-class-card-prop-b")
    ).not.toBeInTheDocument()

    // When selection is cleared, prop-b is visible again
    const clearBtn = screen.getByTestId("clear-selection-btn")
    fireEvent.click(clearBtn)
    expect(screen.getByTestId("calendar-class-card-prop-b")).toBeInTheDocument()
  })

  it("does not suggest swapping with another teacher in a period where the selected teacher already teaches another class", () => {
    const proposalsWithTeacherInBothPeriods: Proposal[] = [
      {
        id: "prop-maryam-1700",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-2",
        course: { id: "c-ame-2-2", title: "AME 2-2" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-maryam-1530",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-1",
        course: { id: "c-ame-2-1", title: "AME 2-1" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr3", name: "کلاس ۱۰۳", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-alireza-1530",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1-1", title: "AME 1-1" },
        teacher: { id: "t-alireza", firstName: "علیرضا", lastName: "شمس" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={proposalsWithTeacherInBothPeriods}
        canEdit={true}
      />
    )

    const maryam1700Card = screen.getAllByTestId(
      "calendar-class-card-prop-maryam-1700"
    )[0]!
    const alireza1530Card = screen.getAllByTestId(
      "calendar-class-card-prop-alireza-1530"
    )[0]!

    fireEvent.click(maryam1700Card)

    expect(maryam1700Card).toHaveAttribute("data-active", "true")
    // alireza1530Card cannot swap with maryam, so it is omitted from the grid
    expect(
      screen.queryByTestId("calendar-class-card-prop-alireza-1530")
    ).not.toBeInTheDocument()
  })

  it("does not allow swapping between odd days and even days when a teacher is only available on odd days (and vice versa)", () => {
    const oddEvenProposals: Proposal[] = [
      {
        id: "prop-maryam-odd",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-2",
        course: { id: "c-ame-2-2", title: "AME 2-2" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-arezoo-even",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1-1", title: "AME 1-1" },
        teacher: { id: "t-arezoo", firstName: "آرزو", lastName: "احمدی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={oddEvenProposals}
        canEdit={true}
        teacherCalendars={[
          {
            teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
            teachableCourses: [
              { id: "c-ame-1-1", title: "AME 1-1" },
              { id: "c-ame-2-2", title: "AME 2-2" },
            ],
            slots: [
              {
                dayOfWeek: "SUNDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 2-2",
                source: "PLAN",
              },
              {
                dayOfWeek: "TUESDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 2-2",
                source: "PLAN",
              },
              {
                dayOfWeek: "THURSDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 2-2",
                source: "PLAN",
              },
            ],
          },
          {
            teacher: { id: "t-arezoo", firstName: "آرزو", lastName: "احمدی" },
            teachableCourses: [
              { id: "c-ame-1-1", title: "AME 1-1" },
              { id: "c-ame-2-2", title: "AME 2-2" },
            ],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 1-1",
                source: "PLAN",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 1-1",
                source: "PLAN",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "BUSY",
                title: "AME 1-1",
                source: "PLAN",
              },
              {
                dayOfWeek: "SUNDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "TUESDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "THURSDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    const maryamOddCard = screen.getAllByTestId(
      "calendar-class-card-prop-maryam-odd"
    )[0]!
    const arezooEvenCard = screen.getAllByTestId(
      "calendar-class-card-prop-arezoo-even"
    )[0]!

    // 1. Select Maryam (odd days only) -> Arezoo on even days cannot swap and is omitted
    fireEvent.click(maryamOddCard)
    expect(maryamOddCard).toHaveAttribute("data-active", "true")
    expect(
      screen.queryByTestId("calendar-class-card-prop-arezoo-even")
    ).not.toBeInTheDocument()

    // Clear selection
    fireEvent.click(screen.getByTestId("clear-selection-btn"))

    // 2. Vice versa: Select Arezoo (even days) -> Maryam (odd days only) cannot swap and is omitted
    const arezooCard = screen.getAllByTestId(
      "calendar-class-card-prop-arezoo-even"
    )[0]!
    fireEvent.click(arezooCard)
    expect(arezooCard).toHaveAttribute("data-active", "true")
    expect(
      screen.queryByTestId("calendar-class-card-prop-maryam-odd")
    ).not.toBeInTheDocument()
  })

  it("swaps physical classrooms together when changing periods and prevents moving into a period where the physical classroom is already occupied", () => {
    const periodRoomProposals: Proposal[] = [
      {
        id: "prop-p1-room101",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1-1", title: "AME 1-1" },
        teacher: { id: "t-1", firstName: "سارا", lastName: "احمدی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-p2-room102",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-2",
        course: { id: "c-ame-2-2", title: "AME 2-2" },
        teacher: { id: "t-2", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-p2-room101-occupied",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 3-1",
        course: { id: "c-ame-3-1", title: "AME 3-1" },
        teacher: { id: "t-3", firstName: "حسین", lastName: "مرادی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: true,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={periodRoomProposals}
        canEdit={true}
        defaultCollapsed={false}
        teacherCalendars={[
          {
            teacher: { id: "t-1", firstName: "سارا", lastName: "احمدی" },
            teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
          {
            teacher: { id: "t-2", firstName: "مریم", lastName: "کاظمی" },
            teachableCourses: [{ id: "c-ame-2-2", title: "AME 2-2" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
          {
            teacher: { id: "t-free-p2", firstName: "علی", lastName: "رضایی" },
            teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "17:00",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    fireEvent.click(screen.getByTestId("toggle-free-teachers-btn"))

    const p1Room101Card = screen.getAllByTestId(
      "calendar-class-card-prop-p1-room101"
    )[0]!
    const p2Room102Card = screen.getAllByTestId(
      "calendar-class-card-prop-p2-room102"
    )[0]!
    const freeTeacherP2Card = screen.getByTestId(
      "free-teacher-card-t-free-p2-EVEN-17:00-18:30"
    )

    // Select prop-p1-room101 (15:30-17:00 in Room 101)
    fireEvent.click(p1Room101Card)

    // Free teacher in 17:00-18:30 must NOT be swappable because moving prop-p1-room101 to 17:00-18:30
    // while keeping Room 101 would collide with prop-p2-room101-occupied in Room 101, so it is omitted
    expect(
      screen.queryByTestId("free-teacher-card-t-free-p2-EVEN-17:00-18:30")
    ).not.toBeInTheDocument()

    // However, prop-p2-room102 (17:00-18:30 in Room 102) IS swappable because swapping periods AND classrooms
    // puts prop-p1 into Room 102 at 17:00-18:30 and prop-p2 into Room 101 at 15:30-17:00 with zero room conflict!
    expect(p2Room102Card).toHaveAttribute("data-swappable", "true")

    fireEvent.click(p2Room102Card)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    // changeDate is checked by default; changeClassroom option is hidden because Room 101 is occupied at 17:00-18:30
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(
      screen.queryByTestId("swap-option-classroom")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("swap-source-card")).toHaveTextContent("کلاس ۱۰۲")
    expect(screen.getByTestId("swap-target-card")).toHaveTextContent("کلاس ۱۰۱")
  })

  it("does not show change room option in modal when swapping classes across periods where the target physical room is already occupied during the source period", () => {
    const proposals: Proposal[] = [
      {
        id: "prop-ame-1-3",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-3",
        course: { id: "c-ame-1-3", title: "AME 1-3" },
        teacher: null,
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: {
          id: "cr-d",
          name: "کلاس D (آزمایشگاه زبان)",
          capacity: 30,
        },
        capacity: 25,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "20:00",
        endTime: "21:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-ame-1-2",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-2",
        course: { id: "c-ame-1-2", title: "AME 1-2" },
        teacher: null,
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-b", name: "کلاس B (اتاق ۱۰۲)", capacity: 30 },
        capacity: 18,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "20:00",
        endTime: "21:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-ame-2-3",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-3",
        course: { id: "c-ame-2-3", title: "AME 2-3" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-b", name: "کلاس B (اتاق ۱۰۲)", capacity: 18 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "20:00",
        endTime: "21:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-ame-1-1",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1-1", title: "AME 1-1" },
        teacher: { id: "t-amir", firstName: "امیرحسین", lastName: "رضایی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: {
          id: "cr-d",
          name: "کلاس D (آزمایشگاه زبان)",
          capacity: 25,
        },
        capacity: 13,
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "20:00",
        endTime: "21:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    render(
      <SchedulingPlanCalendarView
        proposals={proposals}
        canEdit={true}
        defaultCollapsed={false}
      />
    )

    const ame13Card = screen.getAllByTestId(
      "calendar-class-card-prop-ame-1-3"
    )[0]!
    const ame12Card = screen.getAllByTestId(
      "calendar-class-card-prop-ame-1-2"
    )[0]!

    // 1. Click AME 1-3: AME 1-2 is swappable by swapping days & time slots
    fireEvent.click(ame13Card)
    expect(ame12Card).toHaveAttribute("data-swappable", "true")

    // 2. Click AME 1-2 to open the swap modal
    fireEvent.click(ame12Card)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    // 3. Changing room option MUST NOT be shown in the modal because Class B is occupied on Saturday by AME 2-3
    expect(
      screen.queryByTestId("swap-option-classroom")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("swap-option-classroom-label")
    ).not.toBeInTheDocument()

    // 4. Changing date and time IS shown and checked by default
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    // 5. Summary preview correctly reflects destination slots
    expect(screen.getByTestId("swap-source-card")).toHaveTextContent("کلاس B")
    expect(screen.getByTestId("swap-target-card")).toHaveTextContent("کلاس D")
  })

  it("allows swapping time and classroom with an unknown master (missed class), shaking and updating both classes on submit", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    const toMutationSpy = vi
      .spyOn(schedulingResource.updateProposal, "toMutation")
      .mockReturnValue({
        mutationKey: ["scheduling", "updateProposal"],
        mutationFn: updateProposalMutationFn,
      })

    const onUpdateMissedSpy = vi.fn()

    const proposalsWithKnownTeacher: Proposal[] = [
      {
        id: "prop-maryam",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1", title: "AME 1-1" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const assignmentsState = {
      "missed-unknown": {
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as const,
        startTime: "17:00",
        endTime: "18:30",
        classroomId: "cr102",
        classroomName: "کلاس ۱۰۲",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={proposalsWithKnownTeacher}
        canEdit={true}
        defaultCollapsed={false}
        hiringPlan={{
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "17:00",
          endTime: "18:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-ame-2", title: "AME 2-2" }],
          assignments: [
            {
              key: "missed-unknown",
              requirementId: "req-unknown",
              course: { id: "c-ame-2", title: "AME 2-2" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              startTime: "17:00",
              endTime: "18:30",
              classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 18 },
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
        onUpdateMissedClassesAssignments={onUpdateMissedSpy}
        teacherCalendars={[
          {
            teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
            teachableCourses: [{ id: "c-ame-1", title: "AME 1-1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    const maryamCard = screen.getAllByTestId(
      "calendar-class-card-prop-maryam"
    )[0]!
    const missedCard = screen.getAllByTestId(
      "missed-class-card-missed-unknown"
    )[0]!

    // 1. Click Maryam card -> Missed card (Unknown Master) shakes!
    fireEvent.click(maryamCard)
    expect(maryamCard).toHaveAttribute("data-active", "true")
    expect(missedCard).toHaveAttribute("data-swappable", "true")
    expect(missedCard).toHaveClass("animate-calendar-card-shake")
    expect(missedCard).not.toHaveAttribute("data-dimmed")

    // 2. Click the shaking missed card -> Swap dialog opens
    fireEvent.click(missedCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    // Source is Maryam Kazemi, Target is Unknown Master
    const sourceCard = screen.getByTestId("swap-source-card")
    const targetCard = screen.getByTestId("swap-target-card")
    expect(sourceCard).toHaveTextContent("مریم کاظمی")
    expect(targetCard).toHaveTextContent("استاد جدید (در انتظار جذب)")

    // Change Date and Change Classroom are active; Change Teacher is not offered (unknown master has no teacher)
    expect(screen.queryByTestId("swap-option-teacher")).not.toBeInTheDocument()
    expect(screen.getByTestId("swap-option-date")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(screen.getByTestId("swap-option-classroom")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    // 3. Confirm swap
    const confirmBtn = screen.getByTestId("swap-confirm-btn")
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      // updateProposal is called ONLY for the real proposal (prop-maryam)
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(1)
    })

    expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual({
      planId: "plan-1",
      proposalId: "prop-maryam",
      instituteId: "inst-1",
      body: {
        classroomId: "cr102",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "17:00",
        endTime: "18:30",
      },
    })

    // onUpdateMissedClassesAssignments was called to update the unknown master's schedule and room
    expect(onUpdateMissedSpy).toHaveBeenCalledWith({
      "missed-unknown": {
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        classroomId: "cr101",
        classroomName: "کلاس ۱۰۱",
        isAssigned: true,
      },
    })

    toMutationSpy.mockRestore()
  })

  it("allows selecting an unknown master class first to swap with a compatible regular class", () => {
    const proposalsWithKnownTeacher: Proposal[] = [
      {
        id: "prop-maryam",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-1",
        course: { id: "c-ame-1", title: "AME 1-1" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const assignmentsState = {
      "missed-unknown": {
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as const,
        startTime: "17:00",
        endTime: "18:30",
        classroomId: "cr102",
        classroomName: "کلاس ۱۰۲",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={proposalsWithKnownTeacher}
        canEdit={true}
        defaultCollapsed={false}
        hiringPlan={{
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "17:00",
          endTime: "18:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-ame-2", title: "AME 2-2" }],
          assignments: [
            {
              key: "missed-unknown",
              requirementId: "req-unknown",
              course: { id: "c-ame-2", title: "AME 2-2" },
              classNumber: 1,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              startTime: "17:00",
              endTime: "18:30",
              classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 18 },
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
        teacherCalendars={[
          {
            teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
            teachableCourses: [{ id: "c-ame-1", title: "AME 1-1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    const maryamCard = screen.getAllByTestId(
      "calendar-class-card-prop-maryam"
    )[0]!
    const missedCard = screen.getAllByTestId(
      "missed-class-card-missed-unknown"
    )[0]!

    // Click Missed class (Unknown Master) first
    fireEvent.click(missedCard)
    expect(missedCard).toHaveAttribute("data-active", "true")

    // Maryam card is compatible and shakes!
    expect(maryamCard).toHaveAttribute("data-swappable", "true")
    expect(maryamCard).toHaveClass("animate-calendar-card-shake")
    expect(maryamCard).not.toHaveAttribute("data-dimmed")

    // Clicking Maryam card opens swap dialog with Missed class as source
    fireEvent.click(maryamCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()
    expect(screen.getByTestId("swap-source-card")).toHaveTextContent(
      "استاد جدید (در انتظار جذب)"
    )
    expect(screen.getByTestId("swap-target-card")).toHaveTextContent(
      "مریم کاظمی"
    )
  })

  it("allows swapping time between a regular class and an unknown master of the SAME course", () => {
    const sameCourseWithUnknownTeacher: Proposal[] = [
      {
        id: "prop-same-course-maryam",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "Touchstone 1",
        course: { id: "c-same", title: "Touchstone 1" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 16 },
        capacity: 12,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const assignmentsState = {
      "missed-same-course": {
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as const,
        startTime: "17:00",
        endTime: "18:30",
        classroomId: "cr102",
        classroomName: "کلاس ۱۰۲",
        isAssigned: true,
      },
    }

    render(
      <SchedulingPlanCalendarView
        proposals={sameCourseWithUnknownTeacher}
        canEdit={true}
        defaultCollapsed={false}
        hiringPlan={{
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "17:00",
          endTime: "18:30",
          totalClassCount: 1,
          requiredCourses: [{ id: "c-same", title: "Touchstone 1" }],
          assignments: [
            {
              key: "missed-same-course",
              requirementId: "req-same",
              course: { id: "c-same", title: "Touchstone 1" },
              classNumber: 2,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              startTime: "17:00",
              endTime: "18:30",
              classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 18 },
            },
          ],
        }}
        missedClassesAssignments={assignmentsState}
        teacherCalendars={[
          {
            teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
            teachableCourses: [{ id: "c-same", title: "Touchstone 1" }],
            slots: [
              {
                dayOfWeek: "SATURDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "MONDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
              {
                dayOfWeek: "WEDNESDAY",
                startTime: "15:30",
                endTime: "18:30",
                status: "FREE",
                title: null,
                source: "AVAILABILITY",
              },
            ],
          },
        ]}
      />
    )

    const maryamCard = screen.getAllByTestId(
      "calendar-class-card-prop-same-course-maryam"
    )[0]!
    const missedCard = screen.getAllByTestId(
      "missed-class-card-missed-same-course"
    )[0]!

    // Clicking Maryam's Touchstone 1 card must make the Unknown Master's Touchstone 1 card shake
    fireEvent.click(maryamCard)
    expect(maryamCard).toHaveAttribute("data-active", "true")
    expect(missedCard).toHaveAttribute("data-swappable", "true")
    expect(missedCard).toHaveClass("animate-calendar-card-shake")
  })

  it("preserves unknown master missed class card on the calendar and updates classroom when swapped with a proposal", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    vi.spyOn(schedulingResource.updateProposal, "toMutation").mockReturnValue({
      mutationKey: ["scheduling", "updateProposal"],
      mutationFn: updateProposalMutationFn,
    })

    const onUpdateMissedClassesAssignments = vi.fn()

    const initialProposals: Proposal[] = [
      {
        id: "prop-known-teacher",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس با استاد",
        course: { id: "c-1", title: "Touchstone 1" },
        teacher: { id: "t-ali", firstName: "علی", lastName: "محمدی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr101", name: "کلاس ۱۰۱", capacity: 20 },
        capacity: 15,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const hiringPlan = {
      daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as WeekDay[],
      startTime: "15:30",
      endTime: "17:00",
      totalClassCount: 1,
      requiredCourses: [{ id: "c-1", title: "Touchstone 1" }],
      assignments: [
        {
          key: "missed-req-1",
          requirementId: "req-1",
          course: { id: "c-1", title: "Touchstone 1" },
          classNumber: 1,
          deliveryMode: "IN_PERSON" as const,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as WeekDay[],
          startTime: "15:30",
          endTime: "17:00",
          classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 20 },
        },
      ],
    }

    const assignmentsState = {
      "missed-req-1": {
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as WeekDay[],
        startTime: "15:30",
        endTime: "17:00",
        classroomId: "cr102",
        classroomName: "کلاس ۱۰۲",
        isAssigned: true,
      },
    }

    const { rerender } = render(
      <SchedulingPlanCalendarView
        proposals={initialProposals}
        canEdit={true}
        canSwap={true}
        defaultCollapsed={false}
        hiringPlan={hiringPlan}
        missedClassesAssignments={assignmentsState}
        onUpdateMissedClassesAssignments={onUpdateMissedClassesAssignments}
      />
    )

    // Initially, both cards are rendered on the calendar in their respective rooms
    const knownCard = screen.getAllByTestId(
      "calendar-class-card-prop-known-teacher"
    )[0]!
    const missedCard = screen.getAllByTestId(
      "missed-class-card-missed-req-1"
    )[0]!
    expect(knownCard).toBeInTheDocument()
    expect(missedCard).toBeInTheDocument()
    expect(missedCard).toHaveTextContent("کلاس ۱۰۲")
    expect(knownCard).toHaveTextContent("کلاس ۱۰۱")

    // Click known teacher card to enter swap mode
    fireEvent.click(knownCard)
    expect(knownCard).toHaveAttribute("data-active", "true")
    expect(missedCard).toHaveAttribute("data-swappable", "true")

    // Click missed card to open SwapClassDialog
    fireEvent.click(missedCard)
    expect(screen.getByText("جابجایی کلاس")).toBeInTheDocument()

    // Verify changeClassroom is checked by default
    const classroomCheckbox = screen.getByTestId("swap-option-classroom")
    expect(classroomCheckbox).toHaveAttribute("aria-checked", "true")

    // Submit the swap
    const confirmBtn = screen.getByTestId("swap-confirm-btn")
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    // Verify backend update was called for the proposal with classroom cr102
    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(1)
    })
    expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        proposalId: "prop-known-teacher",
        body: expect.objectContaining({
          classroomId: "cr102",
        }),
      })
    )

    // Verify parent onUpdateMissedClassesAssignments was called for the missed class with cr101
    expect(onUpdateMissedClassesAssignments).toHaveBeenCalledWith({
      "missed-req-1": expect.objectContaining({
        classroomId: "cr101",
        classroomName: "کلاس ۱۰۱",
        isAssigned: true,
      }),
    })

    // The unknown master missed class card must NOT hide, and must be visible with updated room name
    await waitFor(() => {
      const updatedMissedCard = screen.getAllByTestId(
        "missed-class-card-missed-req-1"
      )[0]!
      expect(updatedMissedCard).toBeInTheDocument()
      expect(updatedMissedCard).toHaveTextContent("کلاس ۱۰۱")
    })

    const updatedKnownCard = screen.getAllByTestId(
      "calendar-class-card-prop-known-teacher"
    )[0]!
    expect(updatedKnownCard).toHaveTextContent("کلاس ۱۰۲")

    // Simulate query refetch where proposals and missedClassesAssignments update with fresh objects
    rerender(
      <SchedulingPlanCalendarView
        proposals={[
          {
            ...initialProposals[0]!,
            classroom: { id: "cr102", name: "کلاس ۱۰۲", capacity: 20 },
            classroomId: "cr102",
          },
        ]}
        canEdit={true}
        canSwap={true}
        defaultCollapsed={false}
        hiringPlan={hiringPlan}
        missedClassesAssignments={{
          "missed-req-1": {
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as WeekDay[],
            startTime: "15:30",
            endTime: "17:00",
            classroomId: "cr101",
            classroomName: "کلاس ۱۰۱",
            isAssigned: true,
          },
        }}
        onUpdateMissedClassesAssignments={onUpdateMissedClassesAssignments}
      />
    )

    // The missed class card must STILL be visible in the document with the swapped classroom
    const rerenderedMissedCard = screen.getAllByTestId(
      "missed-class-card-missed-req-1"
    )[0]!
    expect(rerenderedMissedCard).toBeInTheDocument()
    expect(rerenderedMissedCard).toHaveTextContent("کلاس ۱۰۱")
  })

  it("highlights master and course title in other cards, shows counts, keeps related cards undimmed, and supports toolbar toggle", () => {
    const proposalsForHighlight: Proposal[] = [
      {
        id: "prop-target",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-3",
        course: { id: "c-ame-2", title: "American English File 2" },
        teacher: { id: "t-alireza", firstName: "علیرضا", lastName: "شمس" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-a", name: "کلاس A", capacity: 15 },
        capacity: 12,
        daysOfWeek: ["SATURDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      // Same teacher, different course (e.g. Alireza teaching AME 3 in another period)
      {
        id: "prop-same-teacher",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 3-1",
        course: { id: "c-ame-3", title: "American English File 3" },
        teacher: { id: "t-alireza", firstName: "علیرضا", lastName: "شمس" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-b", name: "کلاس B", capacity: 15 },
        capacity: 12,
        daysOfWeek: ["SATURDAY"],
        startTime: "17:00",
        endTime: "18:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      // Same course, different teacher (e.g. Maryam teaching AME 2 in another period)
      {
        id: "prop-same-course",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 2-1",
        course: { id: "c-ame-2", title: "American English File 2" },
        teacher: { id: "t-maryam", firstName: "مریم", lastName: "کاظمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-c", name: "کلاس C", capacity: 15 },
        capacity: 12,
        daysOfWeek: ["SUNDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      // Completely unrelated class (different teacher and different course)
      {
        id: "prop-unrelated",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "IELTS 1",
        course: { id: "c-ielts", title: "IELTS Preparation" },
        teacher: { id: "t-zahra", firstName: "زهرا", lastName: "کریمی" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr-d", name: "کلاس D", capacity: 15 },
        capacity: 10,
        daysOfWeek: ["MONDAY"],
        startTime: "15:30",
        endTime: "17:00",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const hiringPlan: SchedulingNewTeacherHiringPlan = {
      isFeasible: true,
      hasEnoughFreeSlots: true,
      totalUnfilledClasses: 1,
      scheduledUnfilledClasses: 1,
      assignments: [
        {
          key: "missed-ame-2",
          course: { id: "c-ame-2", title: "American English File 2" },
          classroom: { id: "cr-b", name: "کلاس B", capacity: 15 },
          deliveryMode: "IN_PERSON",
          classIndex: 1,
        },
      ],
      availableTimeSlots: [],
      recommendedTrack: "ODD_DAYS",
    }

    render(
      <SchedulingPlanCalendarView
        proposals={proposalsForHighlight}
        canEdit={true}
        canSwap={false}
        defaultCollapsed={false}
        hiringPlan={hiringPlan}
        missedClassesAssignments={{
          "missed-ame-2": {
            daysOfWeek: ["TUESDAY"] as WeekDay[],
            startTime: "15:30",
            endTime: "17:00",
            classroomId: "cr-b",
            classroomName: "کلاس B",
            isAssigned: true,
          },
        }}
      />
    )

    // Initially no class is selected
    expect(
      screen.queryByTestId("selected-class-match-summary")
    ).not.toBeInTheDocument()

    // Click on target card (AME 2-3 taught by Alireza Shams)
    const targetCard = screen.getAllByTestId(
      "calendar-class-card-prop-target"
    )[0]!
    fireEvent.click(targetCard)

    // Summary chip should appear in toolbar with count badges
    const summary = screen.getByTestId("selected-class-match-summary")
    expect(summary).toBeInTheDocument()

    // Same course total count: 3 (prop-target, prop-same-course, missed-ame-2)
    const courseCountChip = screen.getByTestId("same-course-count-chip")
    expect(courseCountChip).toHaveTextContent("۳")

    // Same teacher total count: 2 (prop-target, prop-same-teacher)
    const teacherCountChip = screen.getByTestId("same-teacher-count-chip")
    expect(teacherCountChip).toHaveTextContent("۲")

    // Non-swappable cards are omitted from the DOM when a session is selected so user only sees active and swappable shaking cards
    expect(
      screen.queryByTestId("calendar-class-card-prop-same-teacher")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("calendar-class-card-prop-same-course")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("missed-class-card-missed-ame-2")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("calendar-class-card-prop-unrelated")
    ).not.toBeInTheDocument()

    // Target card itself is active
    expect(targetCard).toHaveAttribute("data-active", "true")

    // Clicking clear selection button unpins and restores all omitted cards back to view
    const clearBtn = screen.getByTestId("clear-selection-btn")
    fireEvent.click(clearBtn)

    expect(
      screen.queryByTestId("selected-class-match-summary")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("calendar-class-card-prop-same-teacher")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("calendar-class-card-prop-same-course")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("missed-class-card-missed-ame-2")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("calendar-class-card-prop-unrelated")
    ).toBeInTheDocument()
  })
})

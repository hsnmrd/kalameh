import { describe, expect, it, vi } from "vitest"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@/test/test-utils"
import type {
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
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
    expect(screen.getAllByTitle("کلاس ۱۰۱").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTitle("کلاس ۱۰۲").length).toBeGreaterThanOrEqual(1)

    // The class card itself should not render inline clock/timeRange since time is in the Time column
    const card = screen.getAllByRole("article")[0]
    expect(card).toBeDefined()
    expect(card).toHaveTextContent("American English File 1")
    expect(card).not.toHaveTextContent("09:00 تا 10:30")
  })

  it("does not render delivery mode icon and renders only room icon without room name text", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // The session cards should not contain delivery mode icon or text "حضوری" / "آنلاین"
    const card = screen.getAllByRole("article")[0]!
    expect(within(card).queryByText("حضوری")).not.toBeInTheDocument()
    expect(within(card).queryByText("آنلاین")).not.toBeInTheDocument()
    expect(card.querySelector('[aria-label="حضوری"]')).not.toBeInTheDocument()

    // Session title is rendered prominently with full course title
    expect(
      within(card).getByText("American English File 1")
    ).toBeInTheDocument()

    // Room icon is rendered without room name text, room name available via title
    expect(within(card).queryByText("کلاس ۱۰۱")).not.toBeInTheDocument()
    expect(within(card).getByTitle("کلاس ۱۰۱")).toBeInTheDocument()
  })

  it("uses warning border instead of warning icon when session has warnings", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // prop-2 has warnings
    const warningCard = screen.getByTestId("calendar-class-card-prop-2")
    expect(warningCard).toHaveClass("border-warning/80")
    expect(warningCard).toHaveAttribute("data-has-warnings", "true")
    expect(warningCard).toHaveAttribute(
      "title",
      "این کلاس پس از ویرایش دستی باید دوباره اعتبارسنجی شود."
    )

    // No TriangleAlert warning icon rendered inside the card
    expect(warningCard.querySelector(".lucide-triangle-alert")).toBeNull()
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
      "md:items-stretch"
    )

    // Verify CarouselItem slides have basis-[88%] for mobile and md:basis-full for desktop
    const carouselItems = container.querySelectorAll(
      '[data-track-carousel-item="true"]'
    )
    carouselItems.forEach((item) => {
      expect(item).toHaveClass(
        "h-full",
        "basis-[88%]",
        "ps-2.5",
        "md:basis-full",
        "md:ps-0"
      )
    })
  })

  it("uses max height and space between classes and masters section when they need space", () => {
    const { container } = render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={false}
        defaultCollapsed={false}
      />
    )

    const evenTrack = container.querySelector('[data-day="EVEN"]')
    const oddTrack = container.querySelector('[data-day="ODD"]')

    expect(evenTrack).toHaveClass(
      "flex",
      "h-full",
      "flex-col",
      "justify-between"
    )
    expect(oddTrack).toHaveClass(
      "flex",
      "h-full",
      "flex-col",
      "justify-between"
    )

    const mastersCarousels = container.querySelectorAll(
      '[data-testid^="group-teachers-carousel-"]'
    )
    mastersCarousels.forEach((carousel) => {
      expect(carousel).toHaveClass("mt-auto")
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

    // Check legend / badge and card label
    expect(screen.getAllByText("استاد جدید").length).toBeGreaterThanOrEqual(2)

    // Check missed class card is rendered
    expect(screen.getAllByText("Touchstone 1").length).toBeGreaterThanOrEqual(1)
    expect(
      screen.queryByText("استاد جدید (در انتظار جذب)")
    ).not.toBeInTheDocument()
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

    // prop-2 is an unrelated non-swappable card, so it is dimmed when a session is selected
    const prop2CardsAfterPin = container.querySelectorAll(
      '[data-class-id="prop-2"]'
    )
    expect(prop2CardsAfterPin.length).toBeGreaterThan(0)
    prop2CardsAfterPin.forEach((card) => {
      expect(card.getAttribute("data-dimmed")).toBe("true")
      expect(card).toHaveClass("opacity-25")
      expect(card).toHaveClass("grayscale")
    })

    // Clear selection button is displayed in the header
    const clearBtn = screen.getByTestId("clear-selection-btn")
    expect(clearBtn).toBeInTheDocument()

    // Click clear selection button to unpin and restore all cards
    fireEvent.click(clearBtn)

    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    prop2Cards.forEach((card) => {
      expect(card.getAttribute("data-dimmed")).toBeNull()
    })
    expect(screen.queryByTestId("clear-selection-btn")).toBeNull()

    // Test Escape key unpins and restores all cards
    fireEvent.click(prop1Cards[0]!)
    expect(prop1Cards[0]?.getAttribute("data-active")).toBe("true")
    prop2Cards.forEach((card) => {
      expect(card.getAttribute("data-dimmed")).toBe("true")
    })
    fireEvent.keyDown(window, { key: "Escape" })
    expect(prop1Cards[0]?.getAttribute("data-active")).toBeNull()
    prop2Cards.forEach((card) => {
      expect(card.getAttribute("data-dimmed")).toBeNull()
    })
  })

  it("defaults to expanded state where all time slots are expanded showing period content", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    // Time slot toggles are expanded by default
    const row1Toggle = screen.getByTestId("time-slot-toggle-09:00-10:30")
    const row2Toggle = screen.getByTestId("time-slot-toggle-16:00-17:30")
    expect(row1Toggle).toHaveAttribute("aria-expanded", "true")
    expect(row2Toggle).toHaveAttribute("aria-expanded", "true")

    // Content of both rows is expanded (1fr and opacity-100)
    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content1).toHaveClass("opacity-100")
    expect(content2).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("opacity-100")

    // Global expand/collapse toggle shows "بستن همه"
    const toggleAllBtn = screen.getByTestId("toggle-collapse-all-btn")
    expect(toggleAllBtn).toHaveTextContent("بستن همه")
  })

  it("supports defaultCollapsed={true} where time slots are initially collapsed", () => {
    render(
      <SchedulingPlanCalendarView
        proposals={mockProposals}
        canEdit={false}
        defaultCollapsed={true}
      />
    )

    const row1Toggle = screen.getByTestId("time-slot-toggle-09:00-10:30")
    const row2Toggle = screen.getByTestId("time-slot-toggle-16:00-17:30")
    expect(row1Toggle).toHaveAttribute("aria-expanded", "false")
    expect(row2Toggle).toHaveAttribute("aria-expanded", "false")

    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content1).toHaveClass("opacity-0")
    expect(content2).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("opacity-0")

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

    // Both rows initially expanded
    expect(row1Toggle.getAttribute("aria-expanded")).toBe("true")
    expect(row1Toggle).toHaveClass("min-h-[52px]")
    expect(within(row1Toggle).getByText("09:00")).toHaveClass(
      "text-xl",
      "sm:text-2xl",
      "lg:text-3xl",
      "font-bold"
    )
    expect(row2Toggle.getAttribute("aria-expanded")).toBe("true")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("grid-rows-[1fr]")

    // Collapse Row 1
    fireEvent.click(row1Toggle)

    expect(row1Toggle.getAttribute("aria-expanded")).toBe("false")
    expect(row1Toggle).not.toHaveClass("rounded-none")
    expect(row1Toggle).toHaveClass("rounded-2xl")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content1).toHaveClass("opacity-0")
    // When collapsed, the class count badge is visible for Row 1
    expect(
      screen.getByTestId("slot-classes-badge-09:00-10:30")
    ).toBeInTheDocument()
    // Row 2 remains expanded
    expect(row2Toggle.getAttribute("aria-expanded")).toBe("true")
    expect(content2).toHaveClass("grid-rows-[1fr]")

    // Expand Row 1 back
    fireEvent.click(row1Toggle)

    expect(row1Toggle.getAttribute("aria-expanded")).toBe("true")
    expect(row1Toggle).toHaveClass("rounded-none")
    expect(row1Toggle).not.toHaveClass("border-b")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content1).toHaveClass("opacity-100")
    // When expanded again, the class count badge is hidden
    expect(
      screen.queryByTestId("slot-classes-badge-09:00-10:30")
    ).not.toBeInTheDocument()
  })

  it("expands and collapses all rows via the global expand/collapse all button", () => {
    render(
      <SchedulingPlanCalendarView proposals={mockProposals} canEdit={false} />
    )

    const toggleAllBtn = screen.getByTestId("toggle-collapse-all-btn")
    const content1 = screen.getByTestId("time-slot-content-09:00-10:30")
    const content2 = screen.getByTestId("time-slot-content-16:00-17:30")

    // Initially all expanded
    expect(toggleAllBtn).toHaveTextContent("بستن همه")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("grid-rows-[1fr]")

    // Collapse all
    fireEvent.click(toggleAllBtn)

    expect(toggleAllBtn).toHaveTextContent("باز کردن همه")
    expect(content1).toHaveClass("grid-rows-[0fr]")
    expect(content2).toHaveClass("grid-rows-[0fr]")

    // Expand all back
    fireEvent.click(toggleAllBtn)

    expect(toggleAllBtn).toHaveTextContent("بستن همه")
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content1).toHaveClass("opacity-100")
    expect(content2).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("opacity-100")
  })

  it("automatically expands all time slots when swap button is clicked to enter swap mode", () => {
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

    // Click swap button on a session card in the calendar
    const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
    fireEvent.click(swapBtn)

    const prop1Card = container.querySelector('[data-class-id="prop-1"]')!
    // The session card becomes active with distinct background and border
    expect(prop1Card).toHaveAttribute("data-active", "true")
    expect(prop1Card).toHaveClass("bg-primary/15")
    expect(prop1Card).toHaveClass("border-primary")

    // All time slots automatically expand when entering swap mode
    expect(content1).toHaveClass("grid-rows-[1fr]")
    expect(content2).toHaveClass("grid-rows-[1fr]")
    const prop2Card = container.querySelector('[data-class-id="prop-2"]')!
    expect(prop2Card).toHaveAttribute("data-dimmed", "true")
  })

  it("when a session is selected, keeps all periods visible and dims non-swappable sessions", () => {
    const proposalsWithSwapAndNonSwap: Proposal[] = [
      {
        id: "prop-active",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس فعال",
        course: { id: "c1", title: "Course 1" },
        teacher: { id: "t1", firstName: "استاد", lastName: "اول" },
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
        id: "prop-swappable",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس قابل تعویض",
        course: { id: "c2", title: "Course 2" },
        teacher: { id: "t2", firstName: "استاد", lastName: "دوم" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 20 },
        capacity: 15,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "11:00",
        endTime: "12:30",
        deliveryMode: "IN_PERSON",
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
      {
        id: "prop-locked-slot",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "کلاس قفل‌شده در بازه سوم",
        course: { id: "c3", title: "Course 3" },
        teacher: { id: "t3", firstName: "استاد", lastName: "سوم" },
        branch: { id: "b1", name: "شعبه مرکزی" },
        classroom: { id: "cr3", name: "کلاس ۱۰۳", capacity: 20 },
        capacity: 15,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "16:00",
        endTime: "17:30",
        deliveryMode: "IN_PERSON",
        isLocked: true,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      },
    ]

    const { container } = render(
      <SchedulingPlanCalendarView
        proposals={proposalsWithSwapAndNonSwap}
        canEdit={true}
        canSwap={true}
      />
    )

    // Initially all 3 periods are visible
    expect(screen.getByTestId("time-slot-row-09:00-10:30")).toBeInTheDocument()
    expect(screen.getByTestId("time-slot-row-11:00-12:30")).toBeInTheDocument()
    expect(screen.getByTestId("time-slot-row-16:00-17:30")).toBeInTheDocument()

    // Select the active session in 09:00-10:30
    const activeCard = container.querySelector('[data-class-id="prop-active"]')!
    fireEvent.click(activeCard)

    // Slot 1 (active session) is visible
    expect(screen.getByTestId("time-slot-row-09:00-10:30")).toBeInTheDocument()

    // Slot 2 (has swappable option prop-swappable) is visible
    expect(screen.getByTestId("time-slot-row-11:00-12:30")).toBeInTheDocument()

    // Slot 3 (has only prop-locked-slot, no swap options) remains visible, and its card is dimmed
    expect(screen.getByTestId("time-slot-row-16:00-17:30")).toBeInTheDocument()
    const lockedCard = container.querySelector(
      '[data-class-id="prop-locked-slot"]'
    )!
    expect(lockedCard).toHaveAttribute("data-dimmed", "true")
    expect(lockedCard).toHaveClass("opacity-25")
    expect(lockedCard).toHaveClass("grayscale")

    // Clear selection
    const clearBtn = screen.getByTestId("clear-selection-btn")
    fireEvent.click(clearBtn)

    // All 3 slots remain visible and lockedCard is no longer dimmed
    expect(screen.getByTestId("time-slot-row-09:00-10:30")).toBeInTheDocument()
    expect(screen.getByTestId("time-slot-row-11:00-12:30")).toBeInTheDocument()
    expect(screen.getByTestId("time-slot-row-16:00-17:30")).toBeInTheDocument()
    expect(lockedCard).not.toHaveAttribute("data-dimmed")
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
    expect(slotContent).toHaveClass("grid-rows-[1fr]")
    const missedCard = screen.getByTestId("missed-class-card-missed-1")
    expect(missedCard).toHaveClass("min-h-[84px]")
    expect(missedCard).toHaveTextContent("Touchstone 1")
    expect(missedCard).toHaveTextContent("استاد جدید")
    expect(missedCard).not.toHaveTextContent("در انتظار جذب")
    expect(missedCard).toHaveTextContent("۱۵ نفر")
    expect(missedCard).toHaveTextContent("کلاس ۱۰۱")
    expect(missedCard).not.toHaveTextContent("فضای فیزیکی")
  })

  it("does not render the obsolete free teachers toggle button and displays teachers in the group carousel instead", () => {
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

    expect(
      screen.queryByTestId("toggle-free-teachers-btn")
    ).not.toBeInTheDocument()

    // Even track 09:00-10:30 has both حسین مرادی and زهرا کریمی in the period group teachers carousel
    const evenGroupCarousel = screen.getByTestId(
      "group-teachers-carousel-EVEN-09:00-10:30"
    )
    expect(evenGroupCarousel).toBeInTheDocument()
    const toggleBtn = within(evenGroupCarousel).getByRole("button", {
      name: /نمایش اساتید|دسترسی اساتید/,
    })
    fireEvent.click(toggleBtn)
    expect(evenGroupCarousel).toHaveTextContent("حسین مرادی")
    expect(evenGroupCarousel).toHaveTextContent("زهرا کریمی")
  })

  it("renders teacher accessibility carousel under class card in period slot with qualified teachers", () => {
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

    const carousel = screen.getByTestId(
      "group-teachers-carousel-EVEN-09:00-10:30"
    )
    expect(carousel).toBeInTheDocument()
    const toggleBtn = within(carousel).getByRole("button", {
      name: /نمایش اساتید|دسترسی اساتید/,
    })
    fireEvent.click(toggleBtn)
    expect(carousel).toHaveTextContent("نیلوفر صادقی")
  })

  it("shakes compatible class cards when swap button is clicked and executes session swap directly on click", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    const toMutationSpy = vi
      .spyOn(schedulingResource.updateProposal, "toMutation")
      .mockReturnValue({
        mutationKey: ["scheduling", "updateProposal"],
        mutationFn: updateProposalMutationFn,
      })

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
      />
    )

    const prop1Card = screen.getAllByTestId("calendar-class-card-prop-1")[0]!
    const prop2LockedCard = screen.getByTestId("calendar-class-card-prop-2")
    const swapTargetCard = screen.getAllByTestId(
      "calendar-class-card-prop-swap-target"
    )[0]!

    // Clicking prop-1 directly does NOT enter swap mode (no shaking cards)
    fireEvent.click(prop1Card)
    expect(prop1Card).toHaveAttribute("data-active", "true")
    expect(swapTargetCard).not.toHaveAttribute("data-swappable")

    // Clicking swap button explicitly enters swap mode
    const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
    fireEvent.click(swapBtn)

    // prop-1 is active
    expect(prop1Card).toHaveAttribute("data-active", "true")

    // prop-2 is locked, so it cannot swap and is dimmed
    expect(prop2LockedCard).toHaveAttribute("data-dimmed", "true")
    expect(prop2LockedCard).toHaveClass("opacity-25")
    expect(prop2LockedCard).toHaveClass("grayscale")
    expect(prop2LockedCard).not.toHaveAttribute("data-swappable")

    // prop-swap-target is compatible, so it shakes and is not dimmed
    expect(swapTargetCard).toHaveAttribute("data-swappable", "true")
    expect(swapTargetCard).toHaveClass("animate-calendar-card-shake")
    expect(swapTargetCard).not.toHaveAttribute("data-dimmed")

    // Clicking on the shaking swapTargetCard executes swap directly without showing modal
    fireEvent.click(swapTargetCard)

    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()
    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    toMutationSpy.mockRestore()
  })

  it("prevents inner icon buttons on shaking cards from opening room/teacher modals and directly triggers session swap", async () => {
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
      />
    )

    // Enter swap mode from prop-1
    fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-1"))

    const swapTargetCard = screen.getAllByTestId(
      "calendar-class-card-prop-swap-target"
    )[0]!
    expect(swapTargetCard).toHaveClass("animate-calendar-card-shake")

    // 1. Clicking room badge on the shaking card does NOT open SwitchRoomDialog and directly triggers swap
    const roomBadge = screen.getAllByTestId(
      "calendar-class-room-badge-prop-swap-target"
    )[0]!
    expect(roomBadge).toHaveClass("pointer-events-none")
    fireEvent.click(roomBadge)

    expect(screen.queryByText("تعویض کلاس / اتاق")).not.toBeInTheDocument()
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    toMutationSpy.mockRestore()
  })

  it("directly swaps sessions on target card click without showing options modal", async () => {
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

    // Click swap button on prop-1 and click prop-swap-target
    fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-1"))
    fireEvent.click(
      screen.getAllByTestId("calendar-class-card-prop-swap-target")[0]!
    )

    // No modal is displayed
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    // Direct API mutation executed
    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    expect(updateProposalMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "prop-1",
        body: expect.objectContaining({
          teacherId: null,
          classroomId: "cr3",
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "11:00",
          endTime: "12:30",
        }),
      }),
      expect.anything()
    )

    expect(updateProposalMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "prop-swap-target",
        body: expect.objectContaining({
          teacherId: null,
          classroomId: "cr1",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "09:00",
          endTime: "10:30",
        }),
      }),
      expect.anything()
    )

    // Calendar reflects the swapped classroom and period
    await waitFor(() => {
      const updatedProp1Card = screen.getAllByTestId(
        "calendar-class-card-prop-1"
      )[0]!
      expect(
        within(updatedProp1Card).getByTitle("کلاس ۱۰۳")
      ).toBeInTheDocument()
    })

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

    // Clicking card directly (selection mode, not swapping mode) keeps same course undimmed (opacity 1)
    fireEvent.click(propACard)
    expect(propBCard).toHaveAttribute("data-same-course", "true")
    expect(propBCard).not.toHaveAttribute("data-dimmed")

    // Clicking the swap button enters swap mode, where non-swappable same-course class is dimmed
    const swapBtn = screen.getByTestId("swap-teacher-btn-prop-a")
    fireEvent.click(swapBtn)
    expect(propBCard).toHaveAttribute("data-dimmed", "true")
    expect(propBCard).not.toHaveAttribute("data-swappable")

    // When selection is cleared, prop-b is no longer dimmed
    const clearBtn = screen.getByTestId("clear-selection-btn")
    fireEvent.click(clearBtn)
    expect(propBCard).not.toHaveAttribute("data-dimmed")
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
    // alireza1530Card cannot swap with maryam, so it remains in the grid with dimming
    expect(alireza1530Card).toHaveAttribute("data-dimmed", "true")
    expect(alireza1530Card).not.toHaveAttribute("data-swappable")
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

    // 1. Select Maryam (odd days only) -> Arezoo on even days cannot swap and is dimmed
    fireEvent.click(maryamOddCard)
    expect(maryamOddCard).toHaveAttribute("data-active", "true")
    expect(arezooEvenCard).toHaveAttribute("data-dimmed", "true")
    expect(arezooEvenCard).not.toHaveAttribute("data-swappable")

    // Clear selection
    fireEvent.click(screen.getByTestId("clear-selection-btn"))

    // 2. Vice versa: Select Arezoo (even days) -> Maryam (odd days only) cannot swap and is dimmed
    const arezooCard = screen.getAllByTestId(
      "calendar-class-card-prop-arezoo-even"
    )[0]!
    fireEvent.click(arezooCard)
    expect(arezooCard).toHaveAttribute("data-active", "true")
    expect(maryamOddCard).toHaveAttribute("data-dimmed", "true")
    expect(maryamOddCard).not.toHaveAttribute("data-swappable")
  })

  it("swaps physical classrooms together when changing periods and prevents moving into a period where the physical classroom is already occupied", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    const toMutationSpy = vi
      .spyOn(schedulingResource.updateProposal, "toMutation")
      .mockReturnValue({
        mutationKey: ["scheduling", "updateProposal"],
        mutationFn: updateProposalMutationFn,
      })
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

    const p1Room101Card = screen.getAllByTestId(
      "calendar-class-card-prop-p1-room101"
    )[0]!
    const p2Room102Card = screen.getAllByTestId(
      "calendar-class-card-prop-p2-room102"
    )[0]!

    // Click swap button on prop-p1-room101 (15:30-17:00 in Room 101)
    fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-p1-room101"))

    // However, prop-p2-room102 (17:00-18:30 in Room 102) IS swappable because swapping periods AND classrooms
    // puts prop-p1 into Room 102 at 17:00-18:30 and prop-p2 into Room 101 at 15:30-17:00 with zero room conflict!
    expect(p2Room102Card).toHaveAttribute("data-swappable", "true")

    fireEvent.click(p2Room102Card)
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    toMutationSpy.mockRestore()
  })

  it("swaps classes across periods and directly assigns compatible classrooms without modal", async () => {
    const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
    const toMutationSpy = vi
      .spyOn(schedulingResource.updateProposal, "toMutation")
      .mockReturnValue({
        mutationKey: ["scheduling", "updateProposal"],
        mutationFn: updateProposalMutationFn,
      })
    const proposals: Proposal[] = [
      {
        id: "prop-ame-1-3",
        planId: "plan-1",
        instituteId: "inst-1",
        title: "AME 1-3",
        course: { id: "c-ame-1-3", title: "AME 1-3" },
        teacher: { id: "t-t1", firstName: "استاد", lastName: "یک" },
        teacherId: "t-t1",
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
        teacher: { id: "t-t2", firstName: "استاد", lastName: "دو" },
        teacherId: "t-t2",
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

    // 1. Click swap button on AME 1-3: AME 1-2 is swappable by swapping days & time slots
    fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-ame-1-3"))
    expect(ame12Card).toHaveAttribute("data-swappable", "true")

    // 2. Click AME 1-2 to trigger direct swap without modal
    fireEvent.click(ame12Card)
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    await waitFor(() => {
      expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
    })

    toMutationSpy.mockRestore()
  })

  it("does not allow swapping with an unknown master missed class and opens staffing fallback dialog on click", async () => {
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

    // 1. Click Maryam card -> Missed card (Unknown Master) is not swappable and does not shake
    fireEvent.click(maryamCard)
    expect(maryamCard).toHaveAttribute("data-active", "true")
    expect(missedCard).not.toHaveAttribute("data-swappable")
    expect(missedCard).not.toHaveClass("animate-calendar-card-shake")

    // 2. Click the missed card -> Staffing Fallback dialog opens instead of swap dialog
    fireEvent.click(missedCard)
    expect(screen.getByTestId("staffing-fallback-dialog")).toBeInTheDocument()
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    toMutationSpy.mockRestore()
  })

  it("does not allow selecting an unknown master class to swap and opens staffing fallback dialog instead", () => {
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

    // Click Missed class (Unknown Master) first -> does not enter swap mode and opens fallback dialog
    fireEvent.click(missedCard)
    expect(missedCard).not.toHaveAttribute("data-active")
    expect(maryamCard).not.toHaveAttribute("data-swappable")
    expect(maryamCard).not.toHaveClass("animate-calendar-card-shake")
    expect(screen.getByTestId("staffing-fallback-dialog")).toBeInTheDocument()
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()
  })

  it("does not allow swapping a regular class with an unknown master even of the SAME course and opens staffing fallback dialog", () => {
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

    // Clicking Maryam's Touchstone 1 card: Missed class (Unknown Master) is not swappable
    fireEvent.click(maryamCard)
    expect(maryamCard).toHaveAttribute("data-active", "true")
    expect(missedCard).not.toHaveAttribute("data-swappable")
    expect(missedCard).not.toHaveClass("animate-calendar-card-shake")

    // Clicking the missed card opens staffing fallback dialog instead of swap dialog
    fireEvent.click(missedCard)
    expect(screen.getByTestId("staffing-fallback-dialog")).toBeInTheDocument()
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()
  })

  it("preserves unknown master missed class card on the calendar while preventing swap and opening staffing fallback dialog", () => {
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
    expect(within(knownCard).getByTitle("کلاس ۱۰۱")).toBeInTheDocument()

    // Click known teacher card to enter swap mode
    fireEvent.click(knownCard)
    expect(knownCard).toHaveAttribute("data-active", "true")
    // Missed card does NOT become swappable
    expect(missedCard).not.toHaveAttribute("data-swappable")

    // Click missed card -> opens Staffing Fallback Dialog instead of swap dialog
    fireEvent.click(missedCard)
    expect(screen.getByTestId("staffing-fallback-dialog")).toBeInTheDocument()
    expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

    // Missed card is preserved on calendar
    expect(
      screen.getAllByTestId("missed-class-card-missed-req-1")[0]
    ).toBeInTheDocument()

    // Simulate query refetch / state update
    rerender(
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

    // Missed class card remains visible
    expect(
      screen.getAllByTestId("missed-class-card-missed-req-1")[0]
    ).toBeInTheDocument()
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

    // Card with same teacher (prop-same-teacher): sessions with same master have opacity 1 (undimmed)
    const sameTeacherCard = screen.getAllByTestId(
      "calendar-class-card-prop-same-teacher"
    )[0]!
    expect(sameTeacherCard).toHaveAttribute("data-same-teacher", "true")
    expect(sameTeacherCard).not.toHaveAttribute("data-dimmed")
    expect(sameTeacherCard).not.toHaveClass("opacity-25")
    expect(sameTeacherCard).not.toHaveClass("grayscale")
    expect(sameTeacherCard.querySelector("mark")).toHaveTextContent(
      "علیرضا شمس"
    )

    // Card with same course (prop-same-course): sessions with same course have opacity 1 (undimmed) and display "همین سطح" badge
    const sameCourseCard = screen.getAllByTestId(
      "calendar-class-card-prop-same-course"
    )[0]!
    expect(sameCourseCard).toHaveAttribute("data-same-course", "true")
    expect(sameCourseCard).not.toHaveAttribute("data-dimmed")
    expect(sameCourseCard).not.toHaveClass("opacity-25")
    expect(sameCourseCard).not.toHaveClass("grayscale")
    expect(
      within(sameCourseCard).getByTestId("same-course-badge-prop-same-course")
    ).toHaveTextContent("همین سطح")

    // Missed class card with same course (missed-ame-2) is not swappable, so it has the same dimmed opacity, but highlights content with mark tag and does NOT have grayscale
    const missedSameCourseCard = screen.getAllByTestId(
      "missed-class-card-missed-ame-2"
    )[0]!
    expect(missedSameCourseCard).toHaveAttribute("data-same-course", "true")
    expect(missedSameCourseCard).toHaveAttribute("data-dimmed", "true")
    expect(missedSameCourseCard).toHaveClass("opacity-25")
    expect(missedSameCourseCard).not.toHaveClass("grayscale")
    expect(missedSameCourseCard.querySelector("mark")).toHaveTextContent(
      "American English File 2"
    )
    expect(
      within(missedSameCourseCard).queryByText("همین درس")
    ).not.toBeInTheDocument()

    // Unrelated card (which does not show highlight words) has container-level opacity-25 AND grayscale
    const unrelatedCard = screen.getAllByTestId(
      "calendar-class-card-prop-unrelated"
    )[0]!
    expect(unrelatedCard).toHaveAttribute("data-dimmed", "true")
    expect(unrelatedCard).toHaveClass("opacity-25")
    expect(unrelatedCard).toHaveClass("grayscale")
    expect(unrelatedCard).not.toHaveAttribute("data-same-teacher")
    expect(unrelatedCard).not.toHaveAttribute("data-same-course")
    expect(unrelatedCard.querySelector("mark")).toBeNull()

    // Toggle highlight matches OFF via toolbar button
    const toggleBtn = screen.getByTestId("toggle-highlight-matches-btn")
    fireEvent.click(toggleBtn)

    // Now same-teacher and same-course cards should lose highlight mark tags and gain grayscale
    expect(sameTeacherCard).not.toHaveAttribute("data-same-teacher")
    expect(sameTeacherCard).toHaveAttribute("data-dimmed", "true")
    expect(sameTeacherCard).toHaveClass("opacity-25")
    expect(sameTeacherCard).toHaveClass("grayscale")
    expect(sameTeacherCard.querySelector("mark")).toBeNull()
    expect(sameCourseCard).not.toHaveAttribute("data-same-course")
    expect(sameCourseCard).toHaveAttribute("data-dimmed", "true")
    expect(sameCourseCard).toHaveClass("opacity-25")
    expect(sameCourseCard).toHaveClass("grayscale")
    expect(sameCourseCard.querySelector("mark")).toBeNull()
    expect(missedSameCourseCard).not.toHaveAttribute("data-same-course")
    expect(missedSameCourseCard).toHaveAttribute("data-dimmed", "true")
    expect(missedSameCourseCard).toHaveClass("opacity-25")
    expect(missedSameCourseCard).toHaveClass("grayscale")
    expect(missedSameCourseCard.querySelector("mark")).toBeNull()

    // Toggle highlight back ON
    fireEvent.click(toggleBtn)
    expect(sameTeacherCard).toHaveAttribute("data-same-teacher", "true")
    expect(sameTeacherCard).not.toHaveAttribute("data-dimmed")
    expect(sameTeacherCard).not.toHaveClass("opacity-25")
    expect(sameTeacherCard).not.toHaveClass("grayscale")
    expect(sameTeacherCard.querySelector("mark")).toHaveTextContent(
      "علیرضا شمس"
    )
    expect(sameCourseCard).toHaveAttribute("data-same-course", "true")
    expect(sameCourseCard).not.toHaveAttribute("data-dimmed")
    expect(sameCourseCard).not.toHaveClass("opacity-25")
    expect(sameCourseCard).not.toHaveClass("grayscale")
    expect(
      within(sameCourseCard).getByTestId("same-course-badge-prop-same-course")
    ).toHaveTextContent("همین سطح")
    expect(missedSameCourseCard).toHaveAttribute("data-same-course", "true")
    expect(missedSameCourseCard).toHaveAttribute("data-dimmed", "true")
    expect(missedSameCourseCard).toHaveClass("opacity-25")
    expect(missedSameCourseCard).not.toHaveClass("grayscale")
    expect(missedSameCourseCard.querySelector("mark")).toHaveTextContent(
      "American English File 2"
    )
  })

  it("renders cards in a responsive 2-column grid at xl screens to save vertical height", () => {
    const multiProposals = [
      {
        ...mockProposals[0]!,
        id: "prop-multi-1",
        daysOfWeek: ["SATURDAY"] as const,
        startTime: "09:00",
        endTime: "10:30",
      },
      {
        ...mockProposals[0]!,
        id: "prop-multi-2",
        daysOfWeek: ["SATURDAY"] as const,
        startTime: "09:00",
        endTime: "10:30",
      },
    ]

    const { container } = render(
      <SchedulingPlanCalendarView
        proposals={multiProposals}
        canEdit={false}
        defaultCollapsed={false}
      />
    )

    const evenTrack = container.querySelector(
      '[data-day="EVEN"][data-slot="09:00-10:30"]'
    )!
    expect(evenTrack).toBeInTheDocument()

    const cardsGrid = evenTrack.querySelector(".grid.lg\\:grid-cols-2")
    expect(cardsGrid).toBeInTheDocument()
    expect(cardsGrid).toHaveClass("grid", "grid-cols-1", "lg:grid-cols-2")
    expect(cardsGrid).not.toHaveClass("[&>*:only-child]:xl:col-span-2")
  })

  const mockCalendars: SchedulingTeacherCalendar[] = [
    {
      teacher: {
        id: "t-accessible",
        firstName: "سارا",
        lastName: "حسینی",
        avatarUrl: null,
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
          dayOfWeek: "SUNDAY",
          startTime: "16:00",
          endTime: "17:30",
          status: "FREE",
          title: null,
          source: "AVAILABILITY",
        },
      ],
    },
    {
      teacher: {
        id: "t1",
        firstName: "علی",
        lastName: "محمدی",
        avatarUrl: null,
      },
      teachableCourses: [{ id: "c1", title: "American English File 1" }],
      slots: [
        {
          dayOfWeek: "SATURDAY",
          startTime: "09:00",
          endTime: "10:30",
          status: "BUSY",
          title: "کلاس صبح سطح A1",
          source: "PLAN",
        },
      ],
    },
  ]

  describe("Teacher filter selection and accessible slot highlighting", () => {
    it("highlights group card border and displays accessible badge when selected teacher is accessible", () => {
      const { container } = render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          selectedTeacherId="t-accessible"
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      // Even track for 09:00-10:30 has Saturday free -> should be highlighted as accessible
      const accessibleEvenSlot = container.querySelector(
        '[data-day="EVEN"][data-slot="09:00-10:30"]'
      )
      expect(accessibleEvenSlot).toBeInTheDocument()
      expect(accessibleEvenSlot).toHaveAttribute(
        "data-teacher-accessible",
        "true"
      )
      expect(accessibleEvenSlot).toHaveClass(
        "border-2",
        "border-success",
        "bg-success/5"
      )
      expect(
        screen.getByTestId("teacher-accessible-badge-EVEN-09:00-10:30")
      ).toHaveTextContent("در دسترس")

      // Odd track for 09:00-10:30 does NOT have availability -> should have default border
      const regularOddSlot = container.querySelector(
        '[data-day="ODD"][data-slot="09:00-10:30"]'
      )
      expect(regularOddSlot).toBeInTheDocument()
      expect(regularOddSlot).not.toHaveAttribute("data-teacher-accessible")
      expect(regularOddSlot).toHaveClass("border-border/50", "bg-background/50")

      // Odd track for 16:00-17:30 has Sunday free -> should be highlighted as accessible
      const accessibleOddSlot = container.querySelector(
        '[data-day="ODD"][data-slot="16:00-17:30"]'
      )
      expect(accessibleOddSlot).toBeInTheDocument()
      expect(accessibleOddSlot).toHaveAttribute(
        "data-teacher-accessible",
        "true"
      )
      expect(accessibleOddSlot).toHaveClass(
        "border-2",
        "border-success",
        "bg-success/5"
      )
      expect(
        screen.getByTestId("teacher-accessible-badge-ODD-16:00-17:30")
      ).toHaveTextContent("در دسترس")

      // Toolbar chip displays selected teacher name
      const filterChip = screen.getByTestId("selected-teacher-filter-chip")
      expect(filterChip).toBeInTheDocument()
      expect(filterChip).toHaveTextContent("فیلتر استاد: سارا حسینی")
    })

    it("highlights group card border with primary and displays teaching badge when selected teacher is teaching in that slot", () => {
      const { container } = render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          selectedTeacherId="t1"
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      // Teacher t1 is assigned to prop-1 on EVEN track 09:00-10:30
      const teachingSlot = container.querySelector(
        '[data-day="EVEN"][data-slot="09:00-10:30"]'
      )
      expect(teachingSlot).toBeInTheDocument()
      expect(teachingSlot).toHaveAttribute("data-teacher-teaching", "true")
      expect(teachingSlot).toHaveClass(
        "border-2",
        "border-primary",
        "bg-primary/5"
      )
      expect(
        screen.getByTestId("teacher-teaching-badge-EVEN-09:00-10:30")
      ).toHaveTextContent("در حال تدریس")

      // The class card taught by this teacher has data-same-teacher="true"
      const prop1Card = container.querySelector('[data-class-id="prop-1"]')
      expect(prop1Card).toHaveAttribute("data-same-teacher", "true")
    })

    it("invokes onTeacherChange when clear button on chip is clicked", () => {
      const onTeacherChange = vi.fn()
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          selectedTeacherId="t-accessible"
          onTeacherChange={onTeacherChange}
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      const clearBtn = screen.getByTestId("clear-teacher-filter-btn")
      fireEvent.click(clearBtn)
      expect(onTeacherChange).toHaveBeenCalledWith(null)
    })

    it("reverts group card border to default when no teacher is selected", () => {
      const { container } = render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          selectedTeacherId={null}
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      const slot = container.querySelector(
        '[data-day="EVEN"][data-slot="09:00-10:30"]'
      )
      expect(slot).toBeInTheDocument()
      expect(slot).not.toHaveAttribute("data-teacher-accessible")
      expect(slot).not.toHaveAttribute("data-teacher-teaching")
      expect(slot).toHaveClass("border-border/50", "bg-background/50")
      expect(
        screen.queryByTestId("selected-teacher-filter-chip")
      ).not.toBeInTheDocument()
    })
  })

  describe("Group Teachers Accessibility Carousel", () => {
    it("renders carousel of masters accessibility below class session cards in each period group with available and teaching teachers", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      const carouselEven09 = screen.getByTestId(
        "group-teachers-carousel-EVEN-09:00-10:30"
      )
      expect(carouselEven09).toBeInTheDocument()

      expect(screen.getAllByText("دسترسی اساتید").length).toBeGreaterThan(0)
      const countBadge = screen.getByTestId(
        "group-teachers-count-badge-EVEN-09:00-10:30"
      )
      expect(countBadge).toHaveTextContent("۲ استاد")

      // Expand collapsed carousel
      const toggleBtn = within(carouselEven09).getByRole("button", {
        name: /نمایش اساتید|دسترسی اساتید/,
      })
      fireEvent.click(toggleBtn)

      // Free / Available teacher: سارا حسینی
      const availableTeacherCard = screen.getByTestId(
        "group-teacher-card-t-accessible-EVEN-09:00-10:30"
      )
      expect(availableTeacherCard).toBeInTheDocument()
      expect(availableTeacherCard).toHaveTextContent("سارا حسینی")
      expect(
        screen.getByTestId("teacher-status-badge-t-accessible-EVEN-09:00-10:30")
      ).toHaveTextContent("در دسترس")

      // Teaching teacher (who has class in that time): علی محمدی
      const teachingTeacherCard = screen.getByTestId(
        "group-teacher-card-t1-EVEN-09:00-10:30"
      )
      expect(teachingTeacherCard).toBeInTheDocument()
      expect(teachingTeacherCard).toHaveTextContent("علی محمدی")
      expect(
        screen.getByTestId("teacher-status-badge-t1-EVEN-09:00-10:30")
      ).toHaveTextContent("در حال تدریس")
    })

    it("highlights teacher card in group carousel when selected in filter, and clicking toggles filter", () => {
      const onTeacherChange = vi.fn()
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          teacherCalendars={mockCalendars}
          selectedTeacherId="t-accessible"
          onTeacherChange={onTeacherChange}
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      const teacherCard = screen.getByTestId(
        "group-teacher-card-t-accessible-EVEN-09:00-10:30"
      )
      expect(teacherCard).toHaveAttribute("data-selected", "true")

      fireEvent.click(teacherCard)
      expect(onTeacherChange).toHaveBeenCalledWith(null)
    })
  })

  describe("Master Swap and Delete Actions on Card", () => {
    it("renders swap button on card and delete teacher in actions popup when teacher is assigned and canEdit is true", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      expect(screen.getByTestId("swap-teacher-btn-prop-1")).toBeInTheDocument()

      const trigger = screen.getByTestId("proposal-actions-trigger-prop-1")
      fireEvent.click(trigger)

      expect(
        screen.getByTestId("delete-teacher-btn-prop-1")
      ).toBeInTheDocument()
      expect(
        screen.getByTestId("toggle-delivery-mode-btn-prop-1")
      ).toBeInTheDocument()
      expect(screen.queryByText("ویرایش کلاس پیشنهادی")).not.toBeInTheDocument()
    })

    it("does not render edit option in actions popup on session cards", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      const trigger = screen.getByTestId("proposal-actions-trigger-prop-1")
      fireEvent.click(trigger)

      expect(screen.queryByText("ویرایش کلاس پیشنهادی")).not.toBeInTheDocument()
    })

    it("does not render swap button or actions popup when canEdit is false", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={false}
          defaultCollapsed={false}
        />
      )

      expect(
        screen.queryByTestId("swap-teacher-btn-prop-1")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("proposal-actions-trigger-prop-1")
      ).not.toBeInTheDocument()
    })

    it("does not render delete option in actions popup when card has no master assigned", () => {
      const proposalsWithoutTeacher: Proposal[] = [
        {
          ...mockProposals[0]!,
          id: "prop-no-teacher",
          teacher: null,
          teacherId: null,
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={proposalsWithoutTeacher}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      const trigger = screen.getByTestId(
        "proposal-actions-trigger-prop-no-teacher"
      )
      fireEvent.click(trigger)

      expect(
        screen.queryByTestId("delete-teacher-btn-prop-no-teacher")
      ).not.toBeInTheDocument()
      expect(
        screen.getByTestId("toggle-delivery-mode-btn-prop-no-teacher")
      ).toBeInTheDocument()
    })

    it("clicking card directly does not enter swap mode, only swap button enters swap mode", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      const card = screen.getByTestId("calendar-class-card-prop-1")
      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")

      // 1. Click card directly: selects card but does NOT enter swap mode
      fireEvent.click(card)
      expect(card).toHaveAttribute("data-active", "true")
      expect(swapBtn).not.toHaveClass("ring-1")

      // 2. Click swap button: enters swap mode for prop-1
      fireEvent.click(swapBtn)
      expect(card).toHaveAttribute("data-active", "true")
      expect(swapBtn).toHaveClass("ring-1")

      // 3. Click swap button again: toggles off swap mode and selection
      fireEvent.click(swapBtn)
      expect(card).not.toHaveAttribute("data-active")
    })

    it("clicking delete button in actions popup opens confirmation dialog and confirms removing teacher from class", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        teacherId: null,
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
        />
      )

      const trigger = screen.getByTestId("proposal-actions-trigger-prop-1")
      fireEvent.click(trigger)

      const deleteBtn = screen.getByTestId("delete-teacher-btn-prop-1")
      fireEvent.click(deleteBtn)

      expect(screen.getByText("حذف استاد از کلاس")).toBeInTheDocument()
      expect(
        screen.getByText(/آیا از حذف استاد «علی محمدی» از کلاس/)
      ).toBeInTheDocument()

      const confirmBtn = screen.getByRole("button", { name: "حذف استاد" })
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-1",
          body: { teacherId: null },
        })
      )

      toMutationSpy.mockRestore()
    })

    it("toggles class delivery mode between in-person and online from actions popup", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        deliveryMode: "ONLINE",
        classroomId: null,
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
        />
      )

      const trigger = screen.getByTestId("proposal-actions-trigger-prop-1")
      fireEvent.click(trigger)

      const toggleDeliveryBtn = screen.getByTestId(
        "toggle-delivery-mode-btn-prop-1"
      )
      expect(toggleDeliveryBtn).toBeInTheDocument()
      fireEvent.click(toggleDeliveryBtn)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-1",
          body: { deliveryMode: "ONLINE", classroomId: null },
        })
      )

      toMutationSpy.mockRestore()
    })

    it("does not show dashed move card in the source period of the selected session", () => {
      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
      fireEvent.click(swapBtn)

      expect(
        screen.queryByTestId("move-target-card-EVEN-09:00-10:30")
      ).not.toBeInTheDocument()
    })

    it("shows dashed move card in a period with an available room of sufficient capacity and moves session with updated room", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "16:00",
        endTime: "17:30",
        classroomId: "cr2",
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
      fireEvent.click(swapBtn)

      const moveCard = screen.getByTestId("move-target-card-EVEN-16:00-17:30")
      expect(moveCard).toBeInTheDocument()
      expect(
        within(moveCard).getByText("انتقال به این زمان")
      ).toBeInTheDocument()

      fireEvent.click(moveCard)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-1",
          body: expect.objectContaining({
            startTime: "16:00",
            endTime: "17:30",
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          }),
        })
      )

      toMutationSpy.mockRestore()
    })

    it("does not show dashed move card when room capacity is less than proposal students count", () => {
      const proposalsWithLargeClass: Proposal[] = [
        {
          ...mockProposals[0],
          id: "prop-large",
          capacity: 25,
          classroom: { id: "cr-large", name: "سالن بزرگ", capacity: 25 },
          classroomId: "cr-large",
          startTime: "09:00",
          endTime: "10:30",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        {
          ...mockProposals[1],
          id: "prop-occupier",
          classroom: { id: "cr-large", name: "سالن بزرگ", capacity: 25 },
          classroomId: "cr-large",
          startTime: "16:00",
          endTime: "17:30",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        {
          id: "prop-small-room-holder",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "کلاس اتاق کوچک",
          course: { id: "c3", title: "American English File 3" },
          teacher: { id: "t3", firstName: "رضا", lastName: "کریمی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-small", name: "کلاس کوچک", capacity: 10 },
          capacity: 10,
          daysOfWeek: ["SUNDAY"],
          startTime: "16:00",
          endTime: "17:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={proposalsWithLargeClass}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-large")
      fireEvent.click(swapBtn)

      expect(
        screen.queryByTestId("move-target-card-EVEN-16:00-17:30")
      ).not.toBeInTheDocument()
    })

    it("updates room to available Room B when Room A is occupied in target period", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-a",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "16:00",
        endTime: "17:30",
        classroomId: "room-b",
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const testProposals: Proposal[] = [
        {
          ...mockProposals[0],
          id: "prop-a",
          capacity: 15,
          classroom: { id: "room-a", name: "اتاق الف", capacity: 15 },
          classroomId: "room-a",
          startTime: "09:00",
          endTime: "10:30",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        {
          ...mockProposals[1],
          id: "prop-other",
          capacity: 12,
          classroom: { id: "room-a", name: "اتاق الف", capacity: 15 },
          classroomId: "room-a",
          startTime: "16:00",
          endTime: "17:30",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        {
          id: "prop-b",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "کلاس سطح دیگر",
          course: { id: "c3", title: "American English File 3" },
          teacher: { id: "t3", firstName: "رضا", lastName: "کریمی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "room-b", name: "اتاق ب", capacity: 18 },
          capacity: 18,
          daysOfWeek: ["SUNDAY"],
          startTime: "16:00",
          endTime: "17:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={testProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-a")
      fireEvent.click(swapBtn)

      const moveCard = screen.getByTestId("move-target-card-EVEN-16:00-17:30")
      expect(moveCard).toBeInTheDocument()
      expect(within(moveCard).getByText("اتاق ب")).toBeInTheDocument()

      fireEvent.click(moveCard)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-a",
          body: expect.objectContaining({
            startTime: "16:00",
            endTime: "17:30",
            classroomId: "room-b",
          }),
        })
      )

      toMutationSpy.mockRestore()
    })

    it("reassigns to free qualified teacher when current teacher is unavailable in target slot", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "16:00",
        endTime: "17:30",
        teacherId: "t-free",
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const testTeacherCalendars: SchedulingTeacherCalendar[] = [
        {
          teacher: {
            id: "t1",
            firstName: "علی",
            lastName: "محمدی",
            avatarUrl: null,
          },
          teachableCourses: [{ id: "c1", title: "American English File 1" }],
          slots: [
            // Busy on Sunday 16:00-17:30
            {
              dayOfWeek: "SUNDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "BUSY",
              source: "EXISTING_CLASS",
              title: "کلاس دیگر",
            },
          ],
        },
        {
          teacher: {
            id: "t-free",
            firstName: "نرگس",
            lastName: "کریمی",
            avatarUrl: null,
          },
          teachableCourses: [{ id: "c1", title: "American English File 1" }],
          slots: [
            {
              dayOfWeek: "SUNDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
            {
              dayOfWeek: "TUESDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
            {
              dayOfWeek: "THURSDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
          ],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
          teacherCalendars={testTeacherCalendars}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
      fireEvent.click(swapBtn)

      const moveCard = screen.getByTestId("move-target-card-ODD-16:00-17:30")
      expect(moveCard).toBeInTheDocument()
      expect(within(moveCard).getByText("نرگس کریمی")).toBeInTheDocument()

      fireEvent.click(moveCard)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-1",
          body: expect.objectContaining({
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "16:00",
            endTime: "17:30",
            teacherId: "t-free",
          }),
        })
      )

      toMutationSpy.mockRestore()
    })

    it("moves session with unassigned teacher (teacherId: null) when current teacher is unavailable and no qualified free teacher exists", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "16:00",
        endTime: "17:30",
        teacherId: null,
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const testTeacherCalendars: SchedulingTeacherCalendar[] = [
        {
          teacher: {
            id: "t1",
            firstName: "علی",
            lastName: "محمدی",
            avatarUrl: null,
          },
          teachableCourses: [{ id: "c1", title: "American English File 1" }],
          slots: [
            // Busy on Sunday 16:00-17:30
            {
              dayOfWeek: "SUNDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "BUSY",
              source: "EXISTING_CLASS",
              title: "کلاس دیگر",
            },
          ],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
          teacherCalendars={testTeacherCalendars}
        />
      )

      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
      fireEvent.click(swapBtn)

      const moveCard = screen.getByTestId("move-target-card-ODD-16:00-17:30")
      expect(moveCard).toBeInTheDocument()
      expect(within(moveCard).getByText("استاد جدید")).toBeInTheDocument()

      fireEvent.click(moveCard)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      expect(updateProposalMutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          planId: "plan-1",
          proposalId: "prop-1",
          body: expect.objectContaining({
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "16:00",
            endTime: "17:30",
            teacherId: null,
          }),
        })
      )

      // The moved session card has no master, so it must render with the orange dashed theme!
      await waitFor(() => {
        const movedCard = screen.getByTestId("calendar-class-card-prop-1")
        expect(movedCard).toHaveAttribute("data-has-no-teacher", "true")
        expect(movedCard).toHaveClass("border-dashed")
        expect(movedCard).toHaveClass("border-warning/70")
        expect(movedCard).toHaveClass("bg-warning/10")
        expect(movedCard).toHaveTextContent("استاد جدید")
      })

      toMutationSpy.mockRestore()
    })

    it("releases teacher as AVAILABLE in source slot after session is moved away", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "16:00",
        endTime: "17:30",
        warnings: [],
      })
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const testTeacherCalendars: SchedulingTeacherCalendar[] = [
        {
          teacher: {
            id: "t1",
            firstName: "علی",
            lastName: "محمدی",
            avatarUrl: null,
          },
          teachableCourses: [{ id: "c1", title: "American English File 1" }],
          slots: [
            // Original plan slot in EVEN 09:00-10:30
            {
              dayOfWeek: "SATURDAY",
              startTime: "09:00",
              endTime: "10:30",
              status: "BUSY",
              source: "PLAN",
              title: "کلاس صبح سطح A1",
            },
            {
              dayOfWeek: "MONDAY",
              startTime: "09:00",
              endTime: "10:30",
              status: "BUSY",
              source: "PLAN",
              title: "کلاس صبح سطح A1",
            },
            {
              dayOfWeek: "WEDNESDAY",
              startTime: "09:00",
              endTime: "10:30",
              status: "BUSY",
              source: "PLAN",
              title: "کلاس صبح سطح A1",
            },
            // Also available on Sunday/Tuesday/Thursday 16:00-17:30 so move target can resolve
            {
              dayOfWeek: "SUNDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
            {
              dayOfWeek: "TUESDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
            {
              dayOfWeek: "THURSDAY",
              startTime: "16:00",
              endTime: "17:30",
              status: "FREE",
              source: "AVAILABILITY",
              title: null,
            },
          ],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={mockProposals}
          canEdit={true}
          planId="plan-1"
          defaultCollapsed={false}
          teacherCalendars={testTeacherCalendars}
        />
      )

      // Expand carousel in source slot (EVEN 09:00-10:30)
      const carouselEven09 = screen.getByTestId(
        "group-teachers-carousel-EVEN-09:00-10:30"
      )
      const toggleBtn = within(carouselEven09).getByRole("button", {
        name: /نمایش اساتید|دسترسی اساتید/,
      })
      fireEvent.click(toggleBtn)

      // In source slot (EVEN 09:00-10:30), teacher t1 is initially TEACHING
      const sourceTeacherCardBefore = screen.getByTestId(
        "group-teacher-card-t1-EVEN-09:00-10:30"
      )
      expect(sourceTeacherCardBefore).toHaveAttribute("data-status", "TEACHING")
      expect(
        screen.getByTestId("teacher-status-badge-t1-EVEN-09:00-10:30")
      ).toHaveTextContent("در حال تدریس")

      // Click swap to start move mode
      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
      fireEvent.click(swapBtn)

      // Click target move card in ODD 16:00-17:30
      const moveCard = screen.getByTestId("move-target-card-ODD-16:00-17:30")
      fireEvent.click(moveCard)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalled()
      })

      // After move, in the vacated source slot (EVEN 09:00-10:30), teacher t1 must be released as AVAILABLE!
      await waitFor(() => {
        const sourceTeacherCardAfter = screen.getByTestId(
          "group-teacher-card-t1-EVEN-09:00-10:30"
        )
        expect(sourceTeacherCardAfter).toHaveAttribute(
          "data-status",
          "AVAILABLE"
        )
        expect(
          screen.getByTestId("teacher-status-badge-t1-EVEN-09:00-10:30")
        ).toHaveTextContent("در دسترس")
      })

      toMutationSpy.mockRestore()
    })

    it("allows swapping sessions between Even and Odd days for different courses without being blocked by teacher availability or room capacity", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const crossDayProposals: Proposal[] = [
        {
          id: "prop-even-ame-2-3",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-3",
          course: { id: "c-ame-2-3", title: "American English File 2-3" },
          teacher: { id: "t-nastaran", firstName: "نسترن", lastName: "عزیزی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-101", name: "کلاس ۱۰۱", capacity: 20 },
          capacity: 18,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-odd-ame-2-1",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-1",
          course: { id: "c-ame-2-1", title: "American English File 2-1" },
          teacher: { id: "t-odd", firstName: "محمد", lastName: "کریمی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-105", name: "کلاس ۱۰۵", capacity: 15 }, // Capacity 15 is less than AME 2-3's 18 students
          capacity: 14,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
      ]

      // Nastaran is ONLY available on Even days (no availability on Odd days).
      // Mohammad is ONLY available on Odd days (no availability on Even days).
      const calendars: SchedulingTeacherCalendar[] = [
        {
          teacher: { id: "t-nastaran", firstName: "نسترن", lastName: "عزیزی" },
          teachableCourses: [
            { id: "c-ame-2-3", title: "American English File 2-3" },
          ],
          slots: [
            {
              dayOfWeek: "SATURDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-3",
              source: "PLAN",
            },
            {
              dayOfWeek: "MONDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-3",
              source: "PLAN",
            },
            {
              dayOfWeek: "WEDNESDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-3",
              source: "PLAN",
            },
          ],
        },
        {
          teacher: { id: "t-odd", firstName: "محمد", lastName: "کریمی" },
          teachableCourses: [
            { id: "c-ame-2-1", title: "American English File 2-1" },
          ],
          slots: [
            {
              dayOfWeek: "SUNDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-1",
              source: "PLAN",
            },
            {
              dayOfWeek: "TUESDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-1",
              source: "PLAN",
            },
            {
              dayOfWeek: "THURSDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-1",
              source: "PLAN",
            },
          ],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={crossDayProposals}
          canEdit={true}
          defaultCollapsed={false}
          teacherCalendars={calendars}
        />
      )

      const evenCard = screen.getAllByTestId(
        "calendar-class-card-prop-even-ame-2-3"
      )[0]!
      const oddCard = screen.getAllByTestId(
        "calendar-class-card-prop-odd-ame-2-1"
      )[0]!

      // 1. Click swap button on AME 2-3 (Even days)
      const swapBtn = screen.getByTestId("swap-teacher-btn-prop-even-ame-2-3")
      fireEvent.click(swapBtn)

      // 2. The Odd-day session MUST NOT be dimmed and MUST be swappable!
      expect(oddCard).not.toHaveAttribute("data-dimmed")
      expect(oddCard).toHaveAttribute("data-swappable", "true")

      // 3. Clicking the Odd-day card directly executes the session swap without opening any dialog
      fireEvent.click(oddCard)
      expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
      })

      // Verify AME 2-3 moves to Odd days with unassigned master (teacherId: null) and automatic classroom (cr-101 has capacity 20 >= 18)
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-even-ame-2-3",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-101",
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      // Verify AME 2-1 moves to Even days with unassigned master (teacherId: null) and automatic classroom
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-odd-ame-2-1",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-101",
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      toMutationSpy.mockRestore()
    })

    it("directly swaps sessions across Even and Odd days without showing modal and resets teacherId to null", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const crossDayProposals: Proposal[] = [
        {
          id: "prop-even-ame-2-3",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-3",
          course: { id: "c-ame-2-3", title: "American English File 2-3" },
          teacher: { id: "t-nastaran", firstName: "نسترن", lastName: "عزیزی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-101", name: "کلاس ۱۰۱", capacity: 20 },
          capacity: 18,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-odd-ame-2-1",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-1",
          course: { id: "c-ame-2-1", title: "American English File 2-1" },
          teacher: { id: "t-kamran", firstName: "کامران", lastName: "میرزایی" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-105", name: "کلاس ۱۰۵", capacity: 20 },
          capacity: 14,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
      ]

      // Nastaran is only available Even days, Kamran only Odd days
      const calendars: SchedulingTeacherCalendar[] = [
        {
          teacher: { id: "t-nastaran", firstName: "نسترن", lastName: "عزیزی" },
          teachableCourses: [
            { id: "c-ame-2-3", title: "American English File 2-3" },
          ],
          slots: [
            {
              dayOfWeek: "SATURDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-3",
              source: "PLAN",
            },
          ],
        },
        {
          teacher: { id: "t-kamran", firstName: "کامران", lastName: "میرزایی" },
          teachableCourses: [
            { id: "c-ame-2-1", title: "American English File 2-1" },
          ],
          slots: [
            {
              dayOfWeek: "SUNDAY",
              startTime: "15:00",
              endTime: "16:30",
              status: "BUSY",
              title: "AME 2-1",
              source: "PLAN",
            },
          ],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={crossDayProposals}
          canEdit={true}
          defaultCollapsed={false}
          teacherCalendars={calendars}
        />
      )

      const oddCard = screen.getAllByTestId(
        "calendar-class-card-prop-odd-ame-2-1"
      )[0]!

      // 1. Click swap on AME 2-3 and select Odd-day AME 2-1
      fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-even-ame-2-3"))
      fireEvent.click(oddCard)

      // 2. No modal dialog is shown
      expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
      })

      // Verify AME 2-3 moves to Odd days with unassigned master (teacherId: null)
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-even-ame-2-3",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-105",
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      // Verify AME 2-1 moves to Even days with unassigned master (teacherId: null)
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-odd-ame-2-1",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-101",
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      toMutationSpy.mockRestore()
    })

    it("automatically rebalances classrooms with an existing concurrent session when the destination free room does not have enough capacity", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const rebalanceProposals: Proposal[] = [
        {
          id: "prop-even-12",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-3",
          course: { id: "c-ame-2-3", title: "American English File 2-3" },
          teacher: { id: "t-even", firstName: "استاد", lastName: "زوج" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-even", name: "Room Even", capacity: 15 },
          capacity: 12,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-odd-target",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "Touchstone 2",
          course: { id: "c-ts-2", title: "Touchstone 2" },
          teacher: { id: "t-odd-1", firstName: "استاد", lastName: "فرد یک" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-8", name: "Room 8", capacity: 8 },
          capacity: 6,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-odd-concurrent",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "Touchstone 1",
          course: { id: "c-ts-1", title: "Touchstone 1" },
          teacher: { id: "t-odd-2", firstName: "استاد", lastName: "فرد دو" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-18", name: "Room 18", capacity: 18 },
          capacity: 7,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-odd-in-even-room",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "English 1",
          course: { id: "c-eng-1", title: "English 1" },
          teacher: { id: "t-odd-3", firstName: "استاد", lastName: "فرد سه" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-even", name: "Room Even", capacity: 15 },
          capacity: 10,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={rebalanceProposals}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      // 1. Click swap on prop-even-12 and select prop-odd-target
      fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-even-12"))
      const oddTargetCard = screen.getAllByTestId(
        "calendar-class-card-prop-odd-target"
      )[0]!
      fireEvent.click(oddTargetCard)

      // 2. Direct execution: no modal dialog is opened
      expect(screen.queryByText("جابجایی کلاس")).not.toBeInTheDocument()

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledTimes(3)
      })

      // Verify prop-even-12 moves to Odd days in Room 18 with teacherId: null
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-even-12",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-18",
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      // Verify prop-odd-target moves to Even days in Room Even with teacherId: null
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-odd-target",
          body: expect.objectContaining({
            teacherId: null,
            classroomId: "cr-even",
            daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            startTime: "15:00",
            endTime: "16:30",
          }),
        }),
        expect.anything()
      )

      // Verify prop-odd-concurrent is rebalanced to Room 8
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-odd-concurrent",
          body: {
            classroomId: "cr-8",
          },
        }),
        expect.anything()
      )

      toMutationSpy.mockRestore()
    })

    it("opens SwitchTeacherDialog when clicking teacher info and switches to a free teacher", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({
        id: "prop-1",
        teacherId: "t-free",
        warnings: [],
      } as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const testProposals: Proposal[] = [
        {
          ...mockProposals[0]!,
          id: "prop-switch-teacher-test",
          teacherId: "t1",
          teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "09:00",
          endTime: "10:30",
        },
      ]

      const calendars: SchedulingTeacherCalendar[] = [
        {
          teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
          teachableCourses: [{ id: "c1", title: "American English File 1" }],
          slots: [],
        },
        {
          teacher: { id: "t-free", firstName: "زهرا", lastName: "حسینی" },
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
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={testProposals}
          canEdit={true}
          teacherCalendars={calendars}
          defaultCollapsed={false}
        />
      )

      // Click on teacher info of prop-switch-teacher-test
      const teacherInfo = screen.getByTestId(
        "calendar-class-teacher-info-prop-switch-teacher-test"
      )
      fireEvent.click(teacherInfo)

      // SwitchTeacherDialog opens
      expect(screen.getByTestId("switch-teacher-dialog")).toBeInTheDocument()
      expect(screen.getByTestId("teacher-item-t1")).toBeInTheDocument()
      expect(screen.getByTestId("teacher-item-t-free")).toBeInTheDocument()

      // Select free teacher
      const selectTeacherBtn = screen.getByTestId("switch-teacher-btn-t-free")
      fireEvent.click(selectTeacherBtn)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledWith(
          expect.objectContaining({
            proposalId: "prop-switch-teacher-test",
            body: expect.objectContaining({
              teacherId: "t-free",
            }),
          }),
          expect.anything()
        )
      })

      toMutationSpy.mockRestore()
    })

    it("opens SwitchTeacherDialog and swaps teachers between two sessions in the same period", async () => {
      const updateProposalMutationFn = vi.fn().mockResolvedValue({} as never)
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const twoProposalsInSlot: Proposal[] = [
        {
          ...mockProposals[0]!,
          id: "prop-slot-1",
          course: { id: "c1", title: "Course 1" },
          teacherId: "t-teacher-1",
          teacher: { id: "t-teacher-1", firstName: "مدرس", lastName: "یک" },
          classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 20 },
          classroomId: "cr1",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "09:00",
          endTime: "10:30",
        },
        {
          ...mockProposals[0]!,
          id: "prop-slot-2",
          course: { id: "c2", title: "Course 2" },
          teacherId: "t-teacher-2",
          teacher: { id: "t-teacher-2", firstName: "مدرس", lastName: "دو" },
          classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 20 },
          classroomId: "cr2",
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "09:00",
          endTime: "10:30",
        },
      ]

      render(
        <SchedulingPlanCalendarView
          proposals={twoProposalsInSlot}
          canEdit={true}
          defaultCollapsed={false}
        />
      )

      // Click teacher info of prop-slot-1
      const teacherInfo = screen.getByTestId(
        "calendar-class-teacher-info-prop-slot-1"
      )
      fireEvent.click(teacherInfo)

      expect(screen.getByTestId("switch-teacher-dialog")).toBeInTheDocument()

      // Teacher 2 is shown as swappable
      const swapTeacherBtn = screen.getByTestId(
        "switch-teacher-btn-t-teacher-2"
      )
      expect(swapTeacherBtn).toBeInTheDocument()
      fireEvent.click(swapTeacherBtn)

      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
      })

      // prop-slot-1 gets t-teacher-2
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-slot-1",
          body: { teacherId: "t-teacher-2" },
        }),
        expect.anything()
      )

      // prop-slot-2 gets t-teacher-1
      expect(updateProposalMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          proposalId: "prop-slot-2",
          body: { teacherId: "t-teacher-1" },
        }),
        expect.anything()
      )

      toMutationSpy.mockRestore()
    })

    it("shows loading overlay on target and source session cards while swap request is sending", async () => {
      let resolveFirst: (() => void) | undefined
      const updateProposalMutationFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            if (!resolveFirst) {
              resolveFirst = () => resolve({} as never)
            } else {
              resolve({} as never)
            }
          })
      )
      const toMutationSpy = vi
        .spyOn(schedulingResource.updateProposal, "toMutation")
        .mockReturnValue({
          mutationKey: ["scheduling", "updateProposal"],
          mutationFn: updateProposalMutationFn,
        })

      const proposals: Proposal[] = [
        {
          id: "prop-load-even",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-3",
          course: { id: "c-ame-2-3", title: "American English File 2-3" },
          teacher: { id: "t-1", firstName: "استاد", lastName: "یک" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-1", name: "Classroom 1", capacity: 20 },
          capacity: 15,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          startTime: "15:00",
          endTime: "16:30",
          deliveryMode: "IN_PERSON",
          isLocked: false,
          isManuallyEdited: false,
          warnings: [],
          scoreBreakdown: [],
        },
        {
          id: "prop-load-odd",
          planId: "plan-1",
          instituteId: "inst-1",
          title: "AME 2-1",
          course: { id: "c-ame-2-1", title: "American English File 2-1" },
          teacher: { id: "t-2", firstName: "استاد", lastName: "دو" },
          branch: { id: "b1", name: "شعبه مرکزی" },
          classroom: { id: "cr-2", name: "Classroom 2", capacity: 20 },
          capacity: 15,
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "15:00",
          endTime: "16:30",
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

      const evenCard = screen.getAllByTestId(
        "calendar-class-card-prop-load-even"
      )[0]!
      const oddCard = screen.getAllByTestId(
        "calendar-class-card-prop-load-odd"
      )[0]!

      // 1. Initiate swap on Even card
      fireEvent.click(screen.getByTestId("swap-teacher-btn-prop-load-even"))
      expect(oddCard).toHaveAttribute("data-swappable", "true")

      // 2. Click target Odd card
      fireEvent.click(oddCard)

      // 3. Target card MUST show loading overlay while mutation is pending!
      expect(oddCard).toHaveAttribute("data-loading", "true")
      expect(
        screen.getByTestId("calendar-class-card-loading-prop-load-odd")
      ).toBeInTheDocument()
      expect(evenCard).toHaveAttribute("data-loading", "true")

      // Neither card should shake while loading
      expect(oddCard).not.toHaveClass("animate-calendar-card-shake")

      // 4. Wait for mutation call to register, then resolve in-flight mutation
      await waitFor(() => {
        expect(resolveFirst).toBeDefined()
      })

      await act(async () => {
        resolveFirst!()
      })

      // 5. After mutation completes, loading is cleaned up
      await waitFor(() => {
        expect(updateProposalMutationFn).toHaveBeenCalledTimes(2)
      })

      await waitFor(() => {
        expect(
          screen.queryByTestId("calendar-class-card-loading-prop-load-odd")
        ).not.toBeInTheDocument()
      })

      toMutationSpy.mockRestore()
    })
  })
})

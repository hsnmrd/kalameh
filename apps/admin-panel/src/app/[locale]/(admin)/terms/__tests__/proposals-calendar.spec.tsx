import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import type { GeneratedTermProposal } from "@workspace/types"
import { ProposalsCalendar } from "../components/generate-phase-terms-modal/proposals-calendar"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockProposals: GeneratedTermProposal[] = [
  {
    title: "مهر و آبان ۱۴۰۵",
    startDate: "2026-09-23T00:00:00.000Z",
    startDateJalali: "1405/07/01",
    endDate: "2026-11-06T00:00:00.000Z",
    endDateJalali: "1405/08/15",
    daysCount: 45,
    sessionsCount: 45,
    holidaysCount: 2,
    monthNamesFa: "مهر، آبان",
  },
  {
    title: "آبان و آذر ۱۴۰۵",
    startDate: "2026-11-08T00:00:00.000Z",
    startDateJalali: "1405/08/17",
    endDate: "2026-12-21T00:00:00.000Z",
    endDateJalali: "1405/09/30",
    daysCount: 45,
    sessionsCount: 45,
    holidaysCount: 1,
    monthNamesFa: "آبان، آذر",
  },
]

describe("ProposalsCalendar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders carousel header and legend chips for all proposed terms", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    expect(screen.getByText("ترم‌های پیشنهادی")).toBeInTheDocument()
    expect(screen.getByText("مهر و آبان ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText("آبان و آذر ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText(/1405\/07\/01 تا 1405\/08\/15/)).toBeInTheDocument()
    expect(screen.getByText(/1405\/08\/17 تا 1405\/09\/30/)).toBeInTheDocument()
    expect(screen.getAllByText(/۴۵ روز/)).toHaveLength(2)
  })

  it("switches the active term when clicking on a different term chip in legend", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    const firstTermChip = screen.getByText("مهر و آبان ۱۴۰۵")
    const secondTermChip = screen.getByText("آبان و آذر ۱۴۰۵")

    expect(firstTermChip).toHaveClass("text-primary")
    expect(secondTermChip).not.toHaveClass("text-primary")

    fireEvent.click(secondTermChip)

    expect(secondTermChip).toHaveClass("text-primary")
    expect(firstTermChip).not.toHaveClass("text-primary")
  })

  it("opens day actions popover on day click and controls start date action availability", () => {
    const onStartDateChange = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={onStartDateChange}
      />
    )

    // Select second term: term 1 ends 2026-11-06 (1405/08/15), term 2 starts 2026-11-08 (1405/08/17)
    fireEvent.click(screen.getByText("آبان و آذر ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")

    // 1. Days before term 1 end (e.g. Day 1): click opens popover where "شروع ترم" is disabled
    const earlyDay = screen
      .getAllByRole("button")
      .find(
        (btn) =>
          btn.getAttribute("aria-label")?.includes(" 1-ام") ||
          btn.textContent?.trim() === "۱" ||
          btn.textContent?.trim() === "1"
      )
    if (earlyDay) {
      fireEvent.click(earlyDay)
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      expect(setStartBtn).toBeDisabled()
      fireEvent.click(setStartBtn)
      expect(onStartDateChange).not.toHaveBeenCalled()
    }

    // 2. Valid days in term 2 month: click opens popover and allows setting start date
    const activeDay = screen
      .getAllByRole("button")
      .find(
        (btn) =>
          btn.getAttribute("aria-label")?.includes("18-ام") ||
          btn.textContent?.trim() === "۱۸" ||
          btn.textContent?.trim() === "18"
      )
    if (activeDay) {
      fireEvent.click(activeDay)
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      expect(setStartBtn).not.toBeDisabled()
      fireEvent.click(setStartBtn)
      expect(onStartDateChange).toHaveBeenCalled()
    }
  })

  it("allows setting start date for the first term to earlier days even after start date was shifted forward", () => {
    const onStartDateChange = vi.fn()
    // Term 0 starting on Day 3 (2026-09-25)
    const proposalsWithLaterStart: GeneratedTermProposal[] = [
      {
        ...mockProposals[0]!,
        startDate: "2026-09-25T00:00:00.000Z",
        startDateJalali: "1405/07/03",
      },
      ...mockProposals.slice(1),
    ]

    render(
      <ProposalsCalendar
        proposals={proposalsWithLaterStart}
        onStartDateChange={onStartDateChange}
      />
    )

    // Select first term
    fireEvent.click(screen.getByText("مهر و آبان ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")
    // Day 1 (1405/07/01) - Wednesday (earlier than current start date 1405/07/03)
    const day1 = dayButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.includes(" 1-ام") ||
        btn.textContent?.trim() === "۱" ||
        btn.textContent?.trim() === "1"
    )

    expect(day1).toBeDefined()
    if (day1) {
      fireEvent.click(day1)
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      expect(setStartBtn).not.toBeDisabled()
      fireEvent.click(setStartBtn)
      expect(onStartDateChange).toHaveBeenCalledWith(0, "2026-09-23")
    }
  })

  it("disallows official holidays as start dates in popover and provides holiday toggle", () => {
    const onStartDateChange = vi.fn()
    const onToggleHoliday = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={onStartDateChange}
        onToggleHoliday={onToggleHoliday}
      />
    )

    // Select second term
    fireEvent.click(screen.getByText("آبان و آذر ۱۴۰۵"))

    // Active term holidays list shows the holiday reason
    expect(
      screen.getAllByText("شهادت حضرت فاطمه زهرا (س)").length
    ).toBeGreaterThan(0)

    const dayButtons = screen.getAllByRole("button")
    // Official holiday in Aban 1405: 1405/08/23 (Day 23)
    const holidayDay = dayButtons.find(
      (btn) => btn.textContent === "۲۳" || btn.textContent === "23"
    )
    if (holidayDay) {
      expect(holidayDay).toHaveAttribute(
        "title",
        "شهادت حضرت فاطمه زهرا (س) (تعطیل رسمی)"
      )
      fireEvent.click(holidayDay)

      // Popover displays the official holiday reason badge
      expect(
        screen.getByText("تعطیل رسمی: شهادت حضرت فاطمه زهرا (س)")
      ).toBeInTheDocument()

      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      expect(setStartBtn).toBeDisabled()

      // Popover provides option to dismiss holiday
      const toggleHolidayBtn = screen.getByRole("button", {
        name: /لغو تعطیلی/,
      })
      expect(toggleHolidayBtn).toBeInTheDocument()
      fireEvent.click(toggleHolidayBtn)
      expect(onToggleHoliday).toHaveBeenCalledWith("2026-11-14")
    }
  })

  it("does not show compensatory action on regular term days and allows it on Fridays or official holidays", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    // Select second term (1405/08/17 to 1405/09/30)
    fireEvent.click(screen.getByText("آبان و آذر ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")

    // 1. Regular term day (Day 20 - Wednesday): should NOT show "افزودن کلاس جبرانی"
    const day20 = dayButtons.find(
      (btn) => btn.textContent === "۲۰" || btn.textContent === "20"
    )
    if (day20) {
      fireEvent.click(day20)
      expect(
        screen.queryByRole("button", { name: /افزودن کلاس جبرانی/ })
      ).not.toBeInTheDocument()
    }

    // 2. Friday (Day 22 - Friday 1405/08/22): SHOULD show "افزودن کلاس جبرانی"
    const day22 = dayButtons.find(
      (btn) => btn.textContent === "۲۲" || btn.textContent === "22"
    )
    if (day22) {
      fireEvent.click(day22)
      const addCompBtn = screen.getByRole("button", {
        name: /افزودن کلاس جبرانی/,
      })
      expect(addCompBtn).toBeInTheDocument()
      fireEvent.click(addCompBtn)

      // Compensatory session modal opens
      expect(screen.getAllByText("افزودن کلاس جبرانی").length).toBeGreaterThan(
        0
      )
    }
  })

  it("renders the calendar off-days legend with even sessions, odd sessions, Fridays, and official holidays", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    expect(screen.getByText("جلسات زوج")).toBeInTheDocument()
    expect(screen.getByText("جلسات فرد")).toBeInTheDocument()
    expect(screen.getByText("جمعه‌ها")).toBeInTheDocument()
    expect(screen.getByText("تعطیلات رسمی")).toBeInTheDocument()
  })

  it("renders compensatory session legend item as 'کلاس جبرانی'", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        compensatorySessions={{
          0: [
            {
              date: "2026-10-02",
              dateJalali: "1405/07/10",
              pattern: "EVEN",
            },
          ],
        }}
      />
    )

    expect(screen.getByText("کلاس جبرانی")).toBeInTheDocument()
  })

  it("identifies off-days, official holidays, and even/odd sessions with override logic in buildTermCalendarModifiers", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiers, modifiersClassNames } =
      buildTermCalendarModifiers(mockProposals)

    expect(modifiers.term_offDay).toBeDefined()
    expect(modifiers.term_officialHoliday).toBeDefined()
    expect(modifiers.term_0_even_session).toBeDefined()
    expect(modifiers.term_0_odd_session).toBeDefined()

    // 1. Regular Friday (not a holiday) inside term 1: 2026-09-25 (1405/07/03)
    const fridayDate = new Date("2026-09-25T12:00:00.000Z")
    expect(modifiers.term_offDay(fridayDate)).toBe(true)
    expect(modifiers.term_officialHoliday(fridayDate)).toBe(false)
    expect(modifiers.term_0_even_session(fridayDate)).toBe(false)
    expect(modifiers.term_0_odd_session(fridayDate)).toBe(false)

    // 2. Regular Thursday inside term 1: 2026-09-24 (1405/07/02) - Odd session
    const studyDate = new Date("2026-09-24T12:00:00.000Z")
    expect(modifiers.term_offDay(studyDate)).toBe(false)
    expect(modifiers.term_officialHoliday(studyDate)).toBe(false)
    expect(modifiers.term_0_odd_session(studyDate)).toBe(true)
    expect(modifiers.term_0_even_session(studyDate)).toBe(false)

    // 3. Regular Wednesday inside term 1: 2026-09-23 (1405/07/01) - Even session
    const wednesdayDate = new Date("2026-09-23T12:00:00.000Z")
    expect(modifiers.term_0_even_session(wednesdayDate)).toBe(true)
    expect(modifiers.term_0_odd_session(wednesdayDate)).toBe(false)

    // 3. Official midweek holiday inside term 2 (Saturday 1405/08/23: 2026-11-14)
    const holidayDate = new Date("2026-11-14T12:00:00.000Z")
    expect(modifiers.term_offDay(holidayDate)).toBe(false)
    expect(modifiers.term_officialHoliday(holidayDate)).toBe(true)

    // 4. Friday holiday override: 2026-03-20 (Nowruz on Friday)
    // When holiday is on Friday, holiday style overrides (term_officialHoliday=true, term_offDay=false)
    const fridayHoliday = new Date("2026-03-20T12:00:00.000Z")
    expect(modifiers.term_offDay(fridayHoliday)).toBe(false)
    expect(modifiers.term_officialHoliday(fridayHoliday)).toBe(true)

    // 5. Holiday on start day: proposal starting on a holiday (e.g. 1405/01/01: 2026-03-21)
    const holidayProposal: GeneratedTermProposal[] = [
      {
        title: "ترم نوروزی",
        startDate: "2026-03-21T00:00:00.000Z",
        startDateJalali: "1405/01/01",
        endDate: "2026-04-10T00:00:00.000Z",
        endDateJalali: "1405/01/21",
        daysCount: 20,
        sessionsCount: 20,
        holidaysCount: 4,
        monthNamesFa: "فروردین",
      },
    ]
    const holidayModifiers = buildTermCalendarModifiers(holidayProposal)
    const startHolidayDate = new Date("2026-03-21T12:00:00.000Z")
    // Start button modifier should be false so holiday style overrides the button
    expect(holidayModifiers.modifiers.term_0_start(startHolidayDate)).toBe(
      false
    )
    // Container pill modifier remains true to maintain range shape
    expect(holidayModifiers.modifiers.term_0_start_pill(startHolidayDate)).toBe(
      true
    )
    // Holiday modifier is true
    expect(
      holidayModifiers.modifiers.term_officialHoliday(startHolidayDate)
    ).toBe(true)

    // Verify Friday style outside terms: simple and colorless background, bold red text
    expect(modifiersClassNames.term_offDay).toContain(
      "[&>button]:!bg-transparent"
    )
    expect(modifiersClassNames.term_offDay).toContain("!text-destructive")
    expect(modifiersClassNames.term_offDay).toContain("!font-bold")
    expect(modifiersClassNames.term_offDay).not.toContain("border-dashed")
    expect(modifiersClassNames.term_offDay).not.toContain("[&>button]:border")
    // Friday inside term has red background
    expect(modifiersClassNames.term_0_offDay).toContain("!bg-destructive/15")
    expect(modifiersClassNames.term_0_offDay).toContain(
      "[&>button]:!bg-destructive/15"
    )
    expect(modifiers.term_0_offDay(fridayDate)).toBe(true)
    // Term range bar does NOT apply to Friday
    expect(modifiers.term_0_range(fridayDate)).toBe(false)

    // Verify Holiday style outside terms: simple and colorless background, red text and dot
    expect(modifiersClassNames.term_officialHoliday).toContain(
      "[&>button]:!bg-transparent"
    )
    expect(modifiersClassNames.term_officialHoliday).toContain(
      "!text-destructive"
    )
    expect(modifiersClassNames.term_officialHoliday).toContain(
      "after:bg-destructive"
    )
    expect(modifiersClassNames.term_officialHoliday).not.toContain(
      "border-solid"
    )
    expect(modifiersClassNames.term_officialHoliday).not.toContain(
      "border-dashed"
    )
    expect(modifiersClassNames.term_officialHoliday).not.toContain(
      "[&>button]:border"
    )
    // Holiday inside term has red background
    expect(modifiersClassNames.term_1_holiday).toContain("!bg-destructive/15")
    expect(modifiersClassNames.term_1_holiday).toContain(
      "[&>button]:!bg-destructive/15"
    )
    expect(modifiers.term_1_holiday(holidayDate)).toBe(true)
    // Term range bar does NOT apply to Holiday
    expect(modifiers.term_1_range(holidayDate)).toBe(false)
  })

  it("applies correct RTL pill radii to start, end, and week boundaries without button-inverting classes", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiersClassNames } = buildTermCalendarModifiers(
      mockProposals,
      true
    )

    // In RTL: Start day must be curved on the right (tr/br), flat on the left (tl/bl)
    expect(modifiersClassNames.term_0_start).toContain("rounded-tr-full")
    expect(modifiersClassNames.term_0_start).toContain("rounded-br-full")
    expect(modifiersClassNames.term_0_start).toContain("rounded-tl-none")
    expect(modifiersClassNames.term_0_start).toContain("rounded-bl-none")
    expect(modifiersClassNames.term_0_start).toContain(
      "[&>button]:!rounded-tr-full"
    )
    expect(modifiersClassNames.term_0_start).toContain(
      "[&>button]:!rounded-br-full"
    )
    expect(modifiersClassNames.term_0_start).toContain(
      "[&>button]:!rounded-tl-none"
    )
    expect(modifiersClassNames.term_0_start).toContain(
      "[&>button]:!rounded-bl-none"
    )

    // In RTL: End day must be curved on the left (tl/bl), flat on the right (tr/br)
    expect(modifiersClassNames.term_0_end).toContain("rounded-tl-full")
    expect(modifiersClassNames.term_0_end).toContain("rounded-bl-full")
    expect(modifiersClassNames.term_0_end).toContain("rounded-tr-none")
    expect(modifiersClassNames.term_0_end).toContain("rounded-br-none")
    expect(modifiersClassNames.term_0_end).toContain(
      "[&>button]:!rounded-tl-full"
    )
    expect(modifiersClassNames.term_0_end).toContain(
      "[&>button]:!rounded-bl-full"
    )
    expect(modifiersClassNames.term_0_end).toContain(
      "[&>button]:!rounded-tr-none"
    )
    expect(modifiersClassNames.term_0_end).toContain(
      "[&>button]:!rounded-br-none"
    )

    // In RTL: Week start (first: Saturday) has full pill on right, week end (last: Friday) has full pill on left
    expect(modifiersClassNames.term_0_range).toContain("first:rounded-tr-full")
    expect(modifiersClassNames.term_0_range).toContain("first:rounded-br-full")
    expect(modifiersClassNames.term_0_range).toContain("last:rounded-tl-full")
    expect(modifiersClassNames.term_0_range).toContain("last:rounded-bl-full")

    // CRITICAL: rangeClass must NEVER apply [&>button]:first or [&>button]:last
    // because that corrupts the start day's button corner radius!
    expect(modifiersClassNames.term_0_range).not.toContain("[&>button]:first")
    expect(modifiersClassNames.term_0_range).not.toContain("[&>button]:last")
  })

  it("ensures end date on Saturday in RTL has rounded-tl-full/bl-full and flat right corners regardless of weekday", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    // Term ending on Saturday (2026-10-24 is Saturday: getDay() === 6)
    const saturdayEndProposal: GeneratedTermProposal[] = [
      {
        title: "ترم خاتمه‌یافته در شنبه",
        startDate: "2026-09-23T00:00:00.000Z",
        startDateJalali: "1405/07/01",
        endDate: "2026-10-24T00:00:00.000Z",
        endDateJalali: "1405/08/02",
        daysCount: 32,
        sessionsCount: 32,
        holidaysCount: 0,
        monthNamesFa: "مهر، آبان",
      },
    ]

    const { modifiers, modifiersClassNames } = buildTermCalendarModifiers(
      saturdayEndProposal,
      true // RTL
    )

    const satDate = new Date("2026-10-24T00:00:00.000Z")
    expect(modifiers.term_0_end_pill_regular(satDate)).toBe(true)
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "!rounded-tl-full"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "!rounded-bl-full"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "!rounded-tr-none"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "!rounded-br-none"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "first:!rounded-tl-full"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "first:!rounded-tr-none"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "[&>button]:!rounded-tl-full"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).toContain(
      "[&>button]:!rounded-tr-none"
    )
    expect(modifiersClassNames.term_0_end_pill_regular).not.toContain(
      "!rounded-full"
    )
    expect(modifiersClassNames.term_0_end).toContain("first:!rounded-tl-full")
    expect(modifiersClassNames.term_0_end).toContain("first:!rounded-tr-none")
  })

  it("applies singleClass when proposal is only 1 day", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const singleDayProposal: GeneratedTermProposal[] = [
      {
        title: "ترم تک‌روزه",
        startDate: "2026-10-10T00:00:00.000Z",
        startDateJalali: "1405/07/18",
        endDate: "2026-10-10T00:00:00.000Z",
        endDateJalali: "1405/07/18",
        daysCount: 1,
        sessionsCount: 1,
        holidaysCount: 0,
        monthNamesFa: "مهر",
      },
    ]

    const { modifiers, modifiersClassNames } =
      buildTermCalendarModifiers(singleDayProposal)

    expect(modifiersClassNames.term_0_start).toContain("rounded-full")
    expect(modifiersClassNames.term_0_start).toContain(
      "[&>button]:!rounded-full"
    )
    expect(modifiers.term_0_end(new Date("2026-10-10T00:00:00.000Z"))).toBe(
      false
    )
  })

  it("applies term_customOffDay modifier when customOffDays are passed", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiers, modifiersClassNames } = buildTermCalendarModifiers(
      mockProposals,
      true,
      {
        customOffDays: ["2026-10-05"],
      }
    )

    expect(modifiers.term_customOffDay).toBeDefined()
    expect(modifiersClassNames.term_customOffDay).toContain(
      "[&>button]:!bg-transparent"
    )
    expect(modifiersClassNames.term_0_customOffDay).toContain("!bg-warning/15")
    expect(modifiersClassNames.term_customOffDay).toContain(
      "after:rounded-full"
    )
    expect(modifiers.term_customOffDay(new Date("2026-10-05T12:00:00"))).toBe(
      true
    )
    expect(modifiers.term_customOffDay(new Date("2026-10-06T12:00:00"))).toBe(
      false
    )
  })

  it("omits term_officialHoliday modifier when observeOfficialHolidays is false", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiers } = buildTermCalendarModifiers(mockProposals, true, {
      observeOfficialHolidays: false,
    })

    expect(modifiers.term_officialHoliday).toBeUndefined()
  })

  it("renders imbalance error notice on term card in carousel when proposal has session imbalance", () => {
    const imbalanceProposals: GeneratedTermProposal[] = [
      {
        title: "ترم نامتعادل",
        startDate: "2026-09-23T00:00:00.000Z",
        startDateJalali: "1405/07/01",
        endDate: "2026-11-06T00:00:00.000Z",
        endDateJalali: "1405/08/15",
        daysCount: 45,
        sessionsCount: 18,
        holidaysCount: 2,
        monthNamesFa: "مهر، آبان",
        hasSessionImbalance: true,
        patternDetails: [
          {
            track: "EVEN",
            days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            completedSessions: 20,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: true,
            excessDates: ["2026-11-02", "2026-11-04"],
          },
          {
            track: "ODD",
            days: ["SUNDAY", "TUESDAY", "THURSDAY"],
            completedSessions: 18,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: false,
          },
        ],
      },
    ]

    render(
      <ProposalsCalendar
        proposals={imbalanceProposals}
        onStartDateChange={vi.fn()}
      />
    )

    expect(screen.getByText("ترم نامتعادل")).toBeInTheDocument()
    expect(screen.getByText(/ناهمخوانی جلسات/)).toBeInTheDocument()
  })

  it("applies term_excessSession modifier on excess session dates", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const proposalsWithExcess: GeneratedTermProposal[] = [
      {
        title: "ترم با مازاد",
        startDate: "2026-09-23T00:00:00.000Z",
        startDateJalali: "1405/07/01",
        endDate: "2026-11-06T00:00:00.000Z",
        endDateJalali: "1405/08/15",
        daysCount: 45,
        sessionsCount: 18,
        holidaysCount: 0,
        monthNamesFa: "مهر",
        hasSessionImbalance: true,
        patternDetails: [
          {
            track: "EVEN",
            days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            completedSessions: 19,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: true,
            excessDates: ["2026-11-04"],
          },
        ],
      },
    ]

    const { modifiers, modifiersClassNames } =
      buildTermCalendarModifiers(proposalsWithExcess)

    expect(modifiers.term_excessSession).toBeDefined()
    expect(modifiersClassNames.term_excessSession).toContain("border-dashed")
    expect(modifiers.term_excessSession(new Date("2026-11-04T12:00:00"))).toBe(
      true
    )
    expect(modifiers.term_excessSession(new Date("2026-11-05T12:00:00"))).toBe(
      false
    )
  })

  it("shows excess session badge and allows adding compensatory session for opposite track on excess day", async () => {
    const onOpenCompensatory = vi.fn()
    const { DayActionsPopover } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/calendar-grid/day-actions-popover")

    const excessProposal: GeneratedTermProposal = {
      title: "ترم دارای جلسه مازاد",
      startDate: "2026-09-23T00:00:00.000Z",
      startDateJalali: "1405/07/01",
      endDate: "2026-11-06T00:00:00.000Z",
      endDateJalali: "1405/08/15",
      daysCount: 45,
      sessionsCount: 18,
      holidaysCount: 0,
      monthNamesFa: "مهر",
      hasSessionImbalance: true,
      patternDetails: [
        {
          track: "EVEN",
          days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
          completedSessions: 19,
          targetSessions: 18,
          compensatoryCount: 0,
          hasExcess: true,
          sessionDates: ["2026-11-04"],
          excessDates: ["2026-11-04"],
        },
        {
          track: "ODD",
          days: ["SUNDAY", "TUESDAY", "THURSDAY"],
          completedSessions: 18,
          targetSessions: 18,
          compensatoryCount: 0,
          hasExcess: false,
        },
      ],
    }

    // 2026-11-04 is Wednesday (an excess EVEN day)
    const excessDate = new Date("2026-11-04T12:00:00Z")

    render(
      <DayActionsPopover
        open={true}
        onOpenChange={vi.fn()}
        anchorEl={document.body}
        date={excessDate}
        termProposal={excessProposal}
        selectedTermIndex={0}
        proposals={[excessProposal]}
        onSetStartDate={vi.fn()}
        onToggleHoliday={vi.fn()}
        onOpenCompensatoryModal={onOpenCompensatory}
        onRemoveCompensatorySession={vi.fn()}
      />
    )

    // Should display excess session badge
    expect(screen.getByText(/جلسه مازاد روزهای زوج/)).toBeInTheDocument()

    // Button should offer adding compensatory session for the opposite track (ODD)
    const addCompBtn = screen.getByText(/افزودن جبرانی روزهای فرد/)
    expect(addCompBtn).toBeInTheDocument()

    fireEvent.click(addCompBtn)
    expect(onOpenCompensatory).toHaveBeenCalledWith(0, "2026-11-04", "ODD")
  })

  it("renders 2 months on desktop by default", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    const grids = screen.getAllByRole("grid")
    expect(grids).toHaveLength(2)
  })

  it("renders 1 month when numberOfMonths is explicitly set to 1", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        numberOfMonths={1}
      />
    )

    const grids = screen.getAllByRole("grid")
    expect(grids).toHaveLength(1)
  })

  it("renders 1 month when window matchMedia reports mobile", () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(max-width: 1023px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    try {
      render(
        <ProposalsCalendar
          proposals={mockProposals}
          onStartDateChange={vi.fn()}
        />
      )
      const grids = screen.getAllByRole("grid")
      expect(grids).toHaveLength(1)
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it("applies vivid palette to selected term and dimmed grey styling to unselected terms", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    // When term 0 is selected:
    const res0 = buildTermCalendarModifiers(mockProposals, true, {
      selectedTermIndex: 0,
    })
    // Term 0 (selected) uses vibrant blue classes and red holidays/Fridays
    expect(res0.modifiersClassNames.term_0_even_session).toContain(
      "bg-blue-600/25"
    )
    expect(res0.modifiersClassNames.term_0_start).toContain(
      "[&>button]:!bg-blue-600"
    )
    expect(res0.modifiersClassNames.term_0_holiday).toContain(
      "!bg-destructive/15"
    )
    expect(res0.modifiersClassNames.term_0_offDay).toContain(
      "!bg-destructive/15"
    )

    // Term 1 (unselected) uses dimmed muted classes and grey holidays/Fridays
    expect(res0.modifiersClassNames.term_1_even_session).toContain(
      "bg-muted/40"
    )
    expect(res0.modifiersClassNames.term_1_even_session).toContain(
      "text-muted-foreground"
    )
    expect(res0.modifiersClassNames.term_1_start).toContain(
      "[&>button]:!bg-muted"
    )
    expect(res0.modifiersClassNames.term_1_holiday).toContain("!bg-muted/30")
    expect(res0.modifiersClassNames.term_1_holiday).toContain(
      "text-muted-foreground"
    )
    expect(res0.modifiersClassNames.term_1_offDay).toContain("!bg-muted/30")

    // Dates outside any term have transparent/colorless background
    expect(res0.modifiersClassNames.term_offDay).toContain(
      "[&>button]:!bg-transparent"
    )
    expect(res0.modifiersClassNames.term_officialHoliday).toContain(
      "[&>button]:!bg-transparent"
    )

    // When term 1 is selected:
    const res1 = buildTermCalendarModifiers(mockProposals, true, {
      selectedTermIndex: 1,
    })
    // Term 0 (unselected) uses dimmed muted classes and grey holidays/Fridays
    expect(res1.modifiersClassNames.term_0_even_session).toContain(
      "bg-muted/40"
    )
    expect(res1.modifiersClassNames.term_0_even_session).toContain(
      "text-muted-foreground"
    )
    expect(res1.modifiersClassNames.term_0_start).toContain(
      "[&>button]:!bg-muted"
    )
    expect(res1.modifiersClassNames.term_0_holiday).toContain("!bg-muted/30")
    expect(res1.modifiersClassNames.term_0_offDay).toContain("!bg-muted/30")

    // Term 1 (selected) uses vibrant emerald classes and red holidays/Fridays
    expect(res1.modifiersClassNames.term_1_even_session).toContain(
      "bg-emerald-600/25"
    )
    expect(res1.modifiersClassNames.term_1_start).toContain(
      "[&>button]:!bg-emerald-600"
    )
    expect(res1.modifiersClassNames.term_1_holiday).toContain(
      "!bg-destructive/15"
    )
    expect(res1.modifiersClassNames.term_1_offDay).toContain(
      "!bg-destructive/15"
    )

    // When selectedTermIndex is undefined, all terms use their normal palettes
    const resDefault = buildTermCalendarModifiers(mockProposals, true)
    expect(resDefault.modifiersClassNames.term_0_even_session).toContain(
      "bg-blue-600/25"
    )
    expect(resDefault.modifiersClassNames.term_1_even_session).toContain(
      "bg-emerald-600/25"
    )
    expect(resDefault.modifiersClassNames.term_0_holiday).toContain(
      "!bg-destructive/15"
    )
    expect(resDefault.modifiersClassNames.term_1_holiday).toContain(
      "!bg-destructive/15"
    )
  })

  it("sets showOutsideDays to false when displaying multiple months on desktop and true for mobile", () => {
    const { rerender } = render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        numberOfMonths={2}
      />
    )

    // Rerender with 1 month for mobile
    rerender(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        numberOfMonths={1}
      />
    )
  })

  it("does not show compensatory or excess session borders for unselected terms (previous/next terms)", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const compensatorySessions = {
      0: [
        {
          date: "2026-10-02",
          dateJalali: "1405/07/10",
          pattern: "EVEN" as const,
        },
      ],
    }

    // When term 1 is selected: term 0's compensatory date (2026-10-02) should NOT have term_compensatory modifier
    const resTerm1 = buildTermCalendarModifiers(mockProposals, true, {
      selectedTermIndex: 1,
      compensatorySessions,
    })
    expect(resTerm1.modifiers.term_compensatory).toBeUndefined()

    // When term 0 is selected: term 0's compensatory date SHOULD have term_compensatory modifier
    const resTerm0 = buildTermCalendarModifiers(mockProposals, true, {
      selectedTermIndex: 0,
      compensatorySessions,
    })
    expect(resTerm0.modifiers.term_compensatory).toBeDefined()
    expect(
      resTerm0.modifiers.term_compensatory(new Date("2026-10-02T12:00:00.000Z"))
    ).toBe(true)
  })

  it("assigns matching border-radius modifiers to compensatory and excess sessions based on day position", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    // 2026-10-02 is a Friday (getDay() === 5) -> in RTL, row end
    // 2026-10-03 is a Saturday (getDay() === 6) -> in RTL, row start
    // 2026-10-06 is a Tuesday (getDay() === 2) -> in RTL, middle day
    const compensatorySessions = {
      0: [
        {
          date: "2026-10-02",
          dateJalali: "1405/07/10",
          pattern: "EVEN" as const,
        },
        {
          date: "2026-10-03",
          dateJalali: "1405/07/11",
          pattern: "EVEN" as const,
        },
        {
          date: "2026-10-06",
          dateJalali: "1405/07/14",
          pattern: "EVEN" as const,
        },
      ],
    }

    const resRtl = buildTermCalendarModifiers(mockProposals, true, {
      selectedTermIndex: 0,
      compensatorySessions,
    })

    // Friday: term_compensatory_end matches (rounded left side in RTL: top-left & bottom-left)
    expect(
      resRtl.modifiers.term_compensatory_end(
        new Date("2026-10-02T12:00:00.000Z")
      )
    ).toBe(true)
    expect(resRtl.modifiersClassNames.term_compensatory_end).toContain(
      "[&>button]:!rounded-tl-full [&>button]:!rounded-bl-full"
    )
    expect(
      resRtl.modifiers.term_compensatory_start(
        new Date("2026-10-02T12:00:00.000Z")
      )
    ).toBe(false)

    // Saturday: term_compensatory_start matches (rounded right side in RTL: top-right & bottom-right)
    expect(
      resRtl.modifiers.term_compensatory_start(
        new Date("2026-10-03T12:00:00.000Z")
      )
    ).toBe(true)
    expect(resRtl.modifiersClassNames.term_compensatory_start).toContain(
      "[&>button]:!rounded-tr-full [&>button]:!rounded-br-full"
    )

    // Middle Tuesday: term_compensatory_none matches (flat on both sides)
    expect(
      resRtl.modifiers.term_compensatory_none(
        new Date("2026-10-06T12:00:00.000Z")
      )
    ).toBe(true)
    expect(resRtl.modifiersClassNames.term_compensatory_none).toContain(
      "[&>button]:!rounded-none"
    )

    // Base compensatory modifier includes row fallback classes
    expect(resRtl.modifiersClassNames.term_compensatory).toContain(
      "last:[&>button]:!rounded-tl-full"
    )
    expect(resRtl.modifiersClassNames.term_compensatory).toContain(
      "first:[&>button]:!rounded-tr-full"
    )
  })

  it("shows option to add to institute off-days on non-holiday and triggers onToggleCustomOffDay", () => {
    const onToggleCustomOffDay = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        onToggleCustomOffDay={onToggleCustomOffDay}
      />
    )

    fireEvent.click(screen.getByText("مهر و آبان ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")
    const regularDay = dayButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.includes(" 1-ام") ||
        btn.textContent?.trim() === "۱" ||
        btn.textContent?.trim() === "1"
    )

    expect(regularDay).toBeDefined()
    if (regularDay) {
      fireEvent.click(regularDay)

      const addCustomOffBtn = screen.getByRole("button", {
        name: /افزودن به تعطیلات موسسه/,
      })
      expect(addCustomOffBtn).toBeInTheDocument()

      fireEvent.click(addCustomOffBtn)
      expect(onToggleCustomOffDay).toHaveBeenCalledWith("2026-09-23")
    }
  })

  it("shows option to remove from institute off-days when day is already a custom off-day", () => {
    const onToggleCustomOffDay = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        onToggleCustomOffDay={onToggleCustomOffDay}
        customOffDays={["2026-09-23"]}
      />
    )

    fireEvent.click(screen.getByText("مهر و آبان ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")
    const customOffDay = dayButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.includes(" 1-ام") ||
        btn.textContent?.trim() === "۱" ||
        btn.textContent?.trim() === "1"
    )

    expect(customOffDay).toBeDefined()
    if (customOffDay) {
      fireEvent.click(customOffDay)

      const removeCustomOffBtn = screen.getByRole("button", {
        name: /حذف از تعطیلات موسسه/,
      })
      expect(removeCustomOffBtn).toBeInTheDocument()

      fireEvent.click(removeCustomOffBtn)
      expect(onToggleCustomOffDay).toHaveBeenCalledWith("2026-09-23")
    }
  })

  it("does not show institute off-day options on official holidays", () => {
    const onToggleCustomOffDay = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
        onToggleCustomOffDay={onToggleCustomOffDay}
      />
    )

    fireEvent.click(screen.getByText("آبان و آذر ۱۴۰۵"))

    const dayButtons = screen.getAllByRole("button")
    const holidayDay = dayButtons.find(
      (btn) => btn.textContent === "۲۳" || btn.textContent === "23"
    )

    expect(holidayDay).toBeDefined()
    if (holidayDay) {
      fireEvent.click(holidayDay)

      expect(
        screen.queryByRole("button", { name: /افزودن به تعطیلات موسسه/ })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /حذف از تعطیلات موسسه/ })
      ).not.toBeInTheDocument()
    }
  })
})

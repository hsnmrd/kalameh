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

  it("renders legend chips for all proposed terms and the date shift hint", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    expect(screen.getByText("مهر و آبان ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText("آبان و آذر ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText(/1405\/07\/01 تا 1405\/08\/15/)).toBeInTheDocument()
    expect(screen.getByText(/1405\/08\/17 تا 1405\/09\/30/)).toBeInTheDocument()
    expect(screen.getAllByText(/۴۵ روز/)).toHaveLength(2)
    expect(
      screen.getByText(/برای تغییر تاریخ شروع «مهر و آبان ۱۴۰۵»/)
    ).toBeInTheDocument()
  })

  it("switches the active term when clicking on a different term chip in legend", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    const secondTermChip = screen.getByText("آبان و آذر ۱۴۰۵")
    fireEvent.click(secondTermChip)

    expect(
      screen.getByText(/برای تغییر تاریخ شروع «آبان و آذر ۱۴۰۵»/)
    ).toBeInTheDocument()
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

    const dayButtons = screen.getAllByRole("button")
    // Official holiday in Aban 1405: 1405/08/24 (Day 24)
    const holidayDay = dayButtons.find(
      (btn) => btn.textContent === "۲۴" || btn.textContent === "24"
    )
    if (holidayDay) {
      fireEvent.click(holidayDay)
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      expect(setStartBtn).toBeDisabled()

      // Popover provides option to dismiss holiday
      const toggleHolidayBtn = screen.getByRole("button", {
        name: /لغو تعطیلی/,
      })
      expect(toggleHolidayBtn).toBeInTheDocument()
      fireEvent.click(toggleHolidayBtn)
      expect(onToggleHoliday).toHaveBeenCalledWith("2026-11-15")
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

  it("renders the calendar off-days legend with scheduled days, Fridays, and official holidays", () => {
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={vi.fn()}
      />
    )

    expect(screen.getByText("روزهای برگزاری")).toBeInTheDocument()
    expect(screen.getByText("جمعه‌ها (پایان هفته)")).toBeInTheDocument()
    expect(screen.getByText("تعطیلات رسمی (کسرشده)")).toBeInTheDocument()
  })

  it("identifies off-days and official holidays with override logic in buildTermCalendarModifiers", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiers, modifiersClassNames } =
      buildTermCalendarModifiers(mockProposals)

    expect(modifiers.term_offDay).toBeDefined()
    expect(modifiers.term_officialHoliday).toBeDefined()

    // 1. Regular Friday (not a holiday) inside term 1: 2026-09-25 (1405/07/03)
    const fridayDate = new Date("2026-09-25T12:00:00.000Z")
    expect(modifiers.term_offDay(fridayDate)).toBe(true)
    expect(modifiers.term_officialHoliday(fridayDate)).toBe(false)

    // 2. Regular Thursday inside term 1: 2026-09-24 (1405/07/02)
    const studyDate = new Date("2026-09-24T12:00:00.000Z")
    expect(modifiers.term_offDay(studyDate)).toBe(false)
    expect(modifiers.term_officialHoliday(studyDate)).toBe(false)

    // 3. Official midweek holiday inside term 2 (Sunday 1405/08/24: 2026-11-15)
    const holidayDate = new Date("2026-11-15T12:00:00.000Z")
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

    // Verify Friday style: red text, bold, NO border
    expect(modifiersClassNames.term_offDay).toContain("!text-destructive")
    expect(modifiersClassNames.term_offDay).toContain("!font-bold")
    expect(modifiersClassNames.term_offDay).not.toContain("border-dashed")
    expect(modifiersClassNames.term_offDay).not.toContain("[&>button]:border")

    // Verify Holiday style: red text and small dot below day number (NO border)
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
})

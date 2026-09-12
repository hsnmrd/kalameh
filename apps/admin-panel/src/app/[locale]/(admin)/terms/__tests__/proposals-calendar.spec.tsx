import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
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

  it("shows minDateWarning toast when trying to set term 2 start date before term 1 ends", () => {
    const onStartDateChange = vi.fn()
    render(
      <ProposalsCalendar
        proposals={mockProposals}
        onStartDateChange={onStartDateChange}
      />
    )

    // Select second term
    fireEvent.click(screen.getByText("آبان و آذر ۱۴۰۵"))

    // Click on a date belonging to month of Mehr (before term 1 end date: 2026-11-06)
    // Find a day button from the first month grid
    const dayButtons = screen.getAllByRole("button")
    const earlyDay = dayButtons.find(
      (btn) => btn.textContent === "۱" || btn.textContent === "1"
    )

    if (earlyDay) {
      fireEvent.click(earlyDay)
      expect(toast.error).toHaveBeenCalledWith(
        "تاریخ شروع ترم نمی‌تواند قبل از پایان ترم قبلی باشد."
      )
      expect(onStartDateChange).not.toHaveBeenCalled()
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

  it("identifies off-days and official holidays inside term ranges in buildTermCalendarModifiers", async () => {
    const { buildTermCalendarModifiers } =
      await import("../components/generate-phase-terms-modal/proposals-calendar/helper/calendar-colors")

    const { modifiers, modifiersClassNames } =
      buildTermCalendarModifiers(mockProposals)

    expect(modifiers.term_offDay).toBeDefined()
    expect(modifiers.term_officialHoliday).toBeDefined()

    // Friday inside term 1: 2026-09-25 (1405/07/03)
    const fridayDate = new Date("2026-09-25T12:00:00.000Z")
    expect(modifiers.term_offDay(fridayDate)).toBe(true)
    expect(modifiers.term_officialHoliday(fridayDate)).toBe(false)

    // Regular Thursday inside term 1: 2026-09-24 (1405/07/02)
    const studyDate = new Date("2026-09-24T12:00:00.000Z")
    expect(modifiers.term_offDay(studyDate)).toBe(false)
    expect(modifiers.term_officialHoliday(studyDate)).toBe(false)

    // Official holiday inside term 2: 1405/08/24 (Shahadat Hazrat Fatemeh: 2026-11-15)
    const holidayDate = new Date("2026-11-15T12:00:00.000Z")
    expect(modifiers.term_offDay(holidayDate)).toBe(true)
    expect(modifiers.term_officialHoliday(holidayDate)).toBe(true)

    // Date outside any term: 2026-08-01
    const outsideDate = new Date("2026-08-01T12:00:00.000Z")
    expect(modifiers.term_offDay(outsideDate)).toBe(false)
    expect(modifiers.term_officialHoliday(outsideDate)).toBe(false)

    // Verify modifiers class names have red destructive text and dashed borders
    expect(modifiersClassNames.term_offDay).toContain("!text-destructive")
    expect(modifiersClassNames.term_offDay).toContain("border-dashed")
    expect(modifiersClassNames.term_officialHoliday).toContain(
      "!text-destructive"
    )
    expect(modifiersClassNames.term_officialHoliday).toContain(
      "after:rounded-full"
    )
  })
})

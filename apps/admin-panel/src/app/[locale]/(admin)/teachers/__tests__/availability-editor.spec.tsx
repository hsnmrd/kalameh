import { describe, expect, it, vi, beforeEach } from "vitest"
import type { TeacherAvailabilityInput, TermDto } from "@workspace/types"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import { termsResource } from "@/lib/api"
import { AvailabilityEditor } from "../components/availability-editor"

describe("AvailabilityEditor Component", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "ترم پاییز ۱۴۰۳",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    isActive: true,
    operatingPhaseId: "phase-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    operatingPhase: {
      id: "phase-1",
      title: "فاز پاییز و زمستان",
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      startTime: "16:00",
      endTime: "19:00",
      slotDurationMinutes: 90,
      daysOfWeek: [
        "SATURDAY",
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
      ],
      hasBreak: false,
      breakStartTime: null,
      breakEndTime: null,
    },
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "inst-1"],
      queryFn: async () => [mockTerm],
    } as never)
  })

  it("renders Even and Odd day tracks with Thursday included in Odd track", async () => {
    render(
      <AvailabilityEditor value={[]} onChange={vi.fn()} instituteId="inst-1" />
    )

    expect(await screen.findByText("روزهای زوج")).toBeInTheDocument()

    // Even and Odd tracks headers
    expect(screen.getByText("روزهای زوج")).toBeInTheDocument()
    expect(screen.getByText(/شنبه، دوشنبه، چهارشنبه/)).toBeInTheDocument()

    expect(screen.getByText("روزهای فرد")).toBeInTheDocument()
    expect(screen.getByText(/یکشنبه، سه‌شنبه، پنج‌شنبه/)).toBeInTheDocument()

    // Exactly 2 tracks (Even & Odd), so 2 "Slot 1" buttons
    const slot1Buttons = screen.getAllByText(/پارت (1|۱)/)
    expect(slot1Buttons.length).toBe(2)
  })

  it("toggles slot on Even days track and calls onChange with all even days", async () => {
    const onChange = vi.fn()
    render(
      <AvailabilityEditor value={[]} onChange={onChange} instituteId="inst-1" />
    )

    await screen.findByText("روزهای زوج")

    // Click on Slot 1 of Even Days
    const slot1Buttons = screen.getAllByText(/پارت (1|۱)/)
    fireEvent.click(slot1Buttons[0]!)

    expect(onChange).toHaveBeenCalledWith([
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "MONDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "WEDNESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ])
  })

  it("toggles slot on Odd days track and calls onChange with all odd days including Thursday", async () => {
    const onChange = vi.fn()
    render(
      <AvailabilityEditor value={[]} onChange={onChange} instituteId="inst-1" />
    )

    await screen.findByText("روزهای زوج")

    // Click on Slot 1 of Odd Days (second Slot 1 button)
    const slot1Buttons = screen.getAllByText(/پارت (1|۱)/)
    fireEvent.click(slot1Buttons[1]!)

    expect(onChange).toHaveBeenCalledWith([
      {
        termId: "term-1",
        dayOfWeek: "SUNDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "TUESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "THURSDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ])
  })

  it("toggles slot off on Even days track when already selected", async () => {
    const onChange = vi.fn()
    const initialValue: TeacherAvailabilityInput[] = [
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "MONDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "WEDNESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ]

    render(
      <AvailabilityEditor
        value={initialValue}
        onChange={onChange}
        instituteId="inst-1"
      />
    )

    await screen.findByText("روزهای زوج")

    // Slot 1 of Even Days is selected; clicking it should remove it from all even days
    const slot1Buttons = screen.getAllByText(/پارت (1|۱)/)
    fireEvent.click(slot1Buttons[0]!)

    expect(onChange).toHaveBeenCalledWith([])
  })

  it("recognizes range coverage (e.g. 15:00 - 20:00 covers 16:00 - 17:30 and 17:30 - 19:00)", async () => {
    const onChange = vi.fn()
    // Continuous range covering both slot 1 (16:00-17:30) and slot 2 (17:30-19:00)
    const rangeValue: TeacherAvailabilityInput[] = [
      {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "20:00",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "15:00",
        endTime: "20:00",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "15:00",
        endTime: "20:00",
      },
    ]

    render(
      <AvailabilityEditor
        value={rangeValue}
        onChange={onChange}
        instituteId="inst-1"
      />
    )

    await screen.findByText("روزهای زوج")

    // The carousel card should display 2 classes covered for this term
    expect(screen.getByText("2 کلاس آزاد")).toBeInTheDocument()

    // Clicking slot 1 to toggle it off should subtract 16:00-17:30 from 15:00-20:00,
    // leaving 15:00-16:00 and 17:30-20:00
    const slot1Buttons = screen.getAllByText(/پارت (1|۱)/)
    fireEvent.click(slot1Buttons[0]!)

    expect(onChange).toHaveBeenCalledWith([
      {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "16:00",
      },
      {
        dayOfWeek: "SATURDAY",
        startTime: "17:30",
        endTime: "20:00",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "15:00",
        endTime: "16:00",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "17:30",
        endTime: "20:00",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "15:00",
        endTime: "16:00",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "17:30",
        endTime: "20:00",
      },
    ])
  })

  it("selects all slots for Even track when clicking select all", async () => {
    const onChange = vi.fn()
    render(
      <AvailabilityEditor value={[]} onChange={onChange} instituteId="inst-1" />
    )

    await screen.findByText("روزهای زوج")

    const selectAllButtons = screen.getAllByRole("button", {
      name: "انتخاب همه",
    })
    fireEvent.click(selectAllButtons[0]!) // Even track select all

    expect(onChange).toHaveBeenCalledWith([
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "17:30",
        endTime: "19:00",
      },
      {
        termId: "term-1",
        dayOfWeek: "MONDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "MONDAY",
        startTime: "17:30",
        endTime: "19:00",
      },
      {
        termId: "term-1",
        dayOfWeek: "WEDNESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "WEDNESDAY",
        startTime: "17:30",
        endTime: "19:00",
      },
    ])
  })

  it("clears all slots for Even track when clicking clear", async () => {
    const onChange = vi.fn()
    const initialValue: TeacherAvailabilityInput[] = [
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        termId: "term-1",
        dayOfWeek: "SUNDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ]

    render(
      <AvailabilityEditor
        value={initialValue}
        onChange={onChange}
        instituteId="inst-1"
      />
    )

    await screen.findByText("روزهای زوج")

    const clearButtons = screen.getAllByRole("button", { name: "پاک کردن" })
    fireEvent.click(clearButtons[0]!) // Clear even track

    // Saturday cleared, Sunday (odd) remains
    expect(onChange).toHaveBeenCalledWith([
      {
        termId: "term-1",
        dayOfWeek: "SUNDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ])
  })

  it("renders lunch/break section with break hours when phase has a break window", async () => {
    const breakTerm: TermDto = {
      ...mockTerm,
      operatingPhase: {
        ...mockTerm.operatingPhase!,
        startTime: "10:00",
        endTime: "16:00",
        hasBreak: true,
        breakStartTime: "13:00",
        breakEndTime: "14:00",
      },
    }

    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "inst-1"],
      queryFn: async () => [breakTerm],
    } as never)

    render(
      <AvailabilityEditor value={[]} onChange={vi.fn()} instituteId="inst-1" />
    )

    await screen.findByText("روزهای زوج")

    // The break banner should be visible for both tracks
    const breakBanners = screen.getAllByText(
      /استراحت و ناهار \(13:00 تا 14:00\)/
    )
    expect(breakBanners.length).toBe(2) // Even & Odd tracks
  })

  it("renders terms in a carousel with availability counts and allows switching", async () => {
    const term2: TermDto = {
      ...mockTerm,
      id: "term-2",
      title: "ترم بهار و تابستان",
      operatingPhase: {
        id: "phase-2",
        title: "فاز بهار و تابستان",
        months: [],
        startTime: "08:00",
        endTime: "11:00",
        slotDurationMinutes: 90,
        daysOfWeek: [
          "SATURDAY",
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
        ],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
    }

    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "inst-1"],
      queryFn: async () => [mockTerm, term2],
    } as never)

    const value: TeacherAvailabilityInput[] = [
      {
        termId: "term-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ]

    render(
      <AvailabilityEditor
        value={value}
        onChange={vi.fn()}
        instituteId="inst-1"
      />
    )

    await screen.findByText("روزهای زوج")

    // Both term titles should be displayed in carousel cards
    expect(screen.getByText("ترم پاییز ۱۴۰۳")).toBeInTheDocument()
    expect(screen.getByText("ترم بهار و تابستان")).toBeInTheDocument()

    // Term 1 has 1 matching slot, Term 2 has 0
    expect(screen.getByText("1 کلاس آزاد")).toBeInTheDocument()
    expect(screen.getByText("بدون کلاس آزاد")).toBeInTheDocument()

    // Clicking Term 2 card switches the active term
    fireEvent.click(screen.getByText("ترم بهار و تابستان"))

    // Under Term 2, slot chips should now show Term 2 hours (08:00 - 09:30)
    expect(screen.getAllByText(/08:00 - 09:30/).length).toBeGreaterThan(0)
  })

  it("collapses and expands track and shows class count when collapsed", async () => {
    const value: TeacherAvailabilityInput[] = [
      {
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ]

    render(
      <AvailabilityEditor
        value={value}
        onChange={vi.fn()}
        instituteId="inst-1"
      />
    )

    await screen.findByText("روزهای زوج")

    // Find collapse buttons
    const collapseButtons = screen.getAllByRole("button", { name: "بستن بخش" })
    expect(collapseButtons.length).toBeGreaterThan(0)

    // Collapse the Even Days track
    fireEvent.click(collapseButtons[0]!)

    // Now it should show the collapsed count badge for Even track (alongside TermCard)
    expect(screen.getAllByText("1 کلاس آزاد").length).toBe(2)

    // And expand button should be visible (باز کردن بخش)
    const expandButton = screen.getByRole("button", { name: "باز کردن بخش" })
    expect(expandButton).toBeInTheDocument()

    // Clicking expand opens the track back up
    fireEvent.click(expandButton)
    expect(screen.getAllByRole("button", { name: "بستن بخش" }).length).toBe(2)

    // Clicking anywhere on the header (e.g. track title) also collapses the track
    fireEvent.click(screen.getByText("روزهای زوج"))
    expect(screen.getAllByText("1 کلاس آزاد").length).toBe(2)

    // Clicking it again expands it back
    fireEvent.click(screen.getByText("روزهای زوج"))
    expect(screen.getAllByRole("button", { name: "بستن بخش" }).length).toBe(2)
  })
})

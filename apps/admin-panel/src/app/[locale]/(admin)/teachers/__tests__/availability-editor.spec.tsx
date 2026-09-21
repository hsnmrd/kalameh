import { describe, expect, it, vi, beforeEach } from "vitest"
import type {
  OperatingPhaseWithSlots,
  TeacherAvailabilityInput,
} from "@workspace/types"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import { operatingPhasesResource } from "@/lib/api"
import { AvailabilityEditor } from "../components/availability-editor"

describe("AvailabilityEditor Component", () => {
  const mockPhase: OperatingPhaseWithSlots = {
    id: "phase-1",
    instituteId: "inst-1",
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
    isActive: true,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calculation: {
      totalSpanMinutes: 180,
      instructionalMinutes: 180,
      fullSlotsCount: 2,
      remainderMinutes: 0,
      hasWarning: false,
      slots: [
        {
          slotNumber: 1,
          startTime: "16:00",
          endTime: "17:30",
          durationMinutes: 90,
        },
        {
          slotNumber: 2,
          startTime: "17:30",
          endTime: "19:00",
          durationMinutes: 90,
        },
      ],
    },
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(operatingPhasesResource.list, "toQuery").mockReturnValue({
      queryKey: ["operating-phases", "inst-1"],
      queryFn: async () => [mockPhase],
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
        dayOfWeek: "SUNDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        dayOfWeek: "TUESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
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
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        dayOfWeek: "SATURDAY",
        startTime: "17:30",
        endTime: "19:00",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "17:30",
        endTime: "19:00",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
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
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
      {
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
        dayOfWeek: "SUNDAY",
        startTime: "16:00",
        endTime: "17:30",
      },
    ])
  })

  it("renders lunch/break section with break hours when phase has a break window", async () => {
    const breakPhase: OperatingPhaseWithSlots = {
      ...mockPhase,
      id: "phase-break",
      startTime: "10:00",
      endTime: "16:00",
      slotDurationMinutes: 90,
      hasBreak: true,
      breakStartTime: "13:00",
      breakEndTime: "14:00",
    }

    vi.spyOn(operatingPhasesResource.list, "toQuery").mockReturnValue({
      queryKey: ["operating-phases", "inst-1"],
      queryFn: async () => [breakPhase],
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

  it("renders operating phases in a carousel with availability counts and allows switching", async () => {
    const phase2: OperatingPhaseWithSlots = {
      ...mockPhase,
      id: "phase-2",
      title: "فاز بهار و تابستان",
      months: [],
      startTime: "08:00",
      endTime: "11:00",
      calculation: {
        ...mockPhase.calculation,
        slots: [
          {
            slotNumber: 1,
            startTime: "08:00",
            endTime: "09:30",
            durationMinutes: 90,
          },
          {
            slotNumber: 2,
            startTime: "09:30",
            endTime: "11:00",
            durationMinutes: 90,
          },
        ],
      },
    }

    vi.spyOn(operatingPhasesResource.list, "toQuery").mockReturnValue({
      queryKey: ["operating-phases", "inst-1"],
      queryFn: async () => [mockPhase, phase2],
    } as never)

    const value: TeacherAvailabilityInput[] = [
      {
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

    // Both phase titles should be displayed in carousel cards
    expect(screen.getByText("فاز پاییز و زمستان")).toBeInTheDocument()
    expect(screen.getByText("فاز بهار و تابستان")).toBeInTheDocument()

    // Phase 1 has 1 matching slot, Phase 2 has 0
    expect(screen.getByText("1 کلاس آزاد")).toBeInTheDocument()
    expect(screen.getByText("بدون کلاس آزاد")).toBeInTheDocument()

    // Clicking Phase 2 card switches the active phase
    fireEvent.click(screen.getByText("فاز بهار و تابستان"))

    // Under Phase 2, slot chips should now show Phase 2 hours (08:00 - 09:30)
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

    // Find collapse buttons (ChevronUp)
    const collapseButtons = screen.getAllByRole("button", { name: "بستن بخش" })
    expect(collapseButtons.length).toBeGreaterThan(0)

    // Collapse the Even Days track
    fireEvent.click(collapseButtons[0]!)

    // Now it should show the collapsed count badge for Even track
    expect(screen.getByText("1 کلاس آزاد")).toBeInTheDocument()

    // And expand button should be visible (باز کردن بخش)
    const expandButton = screen.getByRole("button", { name: "باز کردن بخش" })
    expect(expandButton).toBeInTheDocument()

    // Clicking expand opens the track back up
    fireEvent.click(expandButton)
    expect(screen.getAllByRole("button", { name: "بستن بخش" }).length).toBe(2)

    // Clicking anywhere on the header (e.g. track title) also collapses the track
    fireEvent.click(screen.getByText("روزهای زوج"))
    expect(screen.getByText("1 کلاس آزاد")).toBeInTheDocument()

    // Clicking it again expands it back
    fireEvent.click(screen.getByText("روزهای زوج"))
    expect(screen.getAllByRole("button", { name: "بستن بخش" }).length).toBe(2)
  })
})

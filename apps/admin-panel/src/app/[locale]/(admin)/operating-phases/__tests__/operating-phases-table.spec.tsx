import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { OperatingPhasesTable } from "../components/operating-phases-table"
import type { OperatingPhaseWithSlots } from "@workspace/types"

describe("OperatingPhasesTable Component", () => {
  const mockPhases: OperatingPhaseWithSlots[] = [
    {
      id: "phase-1",
      instituteId: "inst-1",
      title: "فاز سال تحصیلی (مهر تا خرداد)",
      months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
      startTime: "15:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      hasBreak: false,
      breakStartTime: null,
      breakEndTime: null,
      isActive: true,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculation: {
        totalSpanMinutes: 360,
        instructionalMinutes: 360,
        fullSlotsCount: 4,
        remainderMinutes: 0,
        hasWarning: false,
        slots: [
          {
            slotNumber: 1,
            startTime: "15:00",
            endTime: "16:30",
            durationMinutes: 90,
          },
          {
            slotNumber: 2,
            startTime: "16:30",
            endTime: "18:00",
            durationMinutes: 90,
          },
          {
            slotNumber: 3,
            startTime: "18:00",
            endTime: "19:30",
            durationMinutes: 90,
          },
          {
            slotNumber: 4,
            startTime: "19:30",
            endTime: "21:00",
            durationMinutes: 90,
          },
        ],
      },
    },
    {
      id: "phase-2",
      instituteId: "inst-1",
      title: "فاز تابستان با زمان مازاد",
      months: [4, 5, 6],
      startTime: "15:00",
      endTime: "21:15",
      slotDurationMinutes: 90,
      daysOfWeek: ["SUNDAY", "TUESDAY"],
      hasBreak: false,
      breakStartTime: null,
      breakEndTime: null,
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculation: {
        totalSpanMinutes: 375,
        instructionalMinutes: 375,
        fullSlotsCount: 4,
        remainderMinutes: 15,
        hasWarning: true,
        warningMessageFa: "۱۵ دقیقه زمان مازاد در پایان فاز باقی می‌ماند.",
        slots: [
          {
            slotNumber: 1,
            startTime: "15:00",
            endTime: "16:30",
            durationMinutes: 90,
          },
          {
            slotNumber: 2,
            startTime: "16:30",
            endTime: "18:00",
            durationMinutes: 90,
          },
          {
            slotNumber: 3,
            startTime: "18:00",
            endTime: "19:30",
            durationMinutes: 90,
          },
          {
            slotNumber: 4,
            startTime: "19:30",
            endTime: "21:00",
            durationMinutes: 90,
          },
        ],
      },
    },
  ]

  it("renders loading state when isLoading is true", () => {
    const { container } = render(
      <OperatingPhasesTable
        phases={undefined}
        isLoading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("renders empty state message when phases list is empty", () => {
    render(
      <OperatingPhasesTable
        phases={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText(/تعریف نشده/i)).toBeInTheDocument()
  })

  it("renders phase rows with titles, slots count, and remainder warning badge", () => {
    render(
      <OperatingPhasesTable
        phases={mockPhases}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(
      screen.getByText("فاز سال تحصیلی (مهر تا خرداد)")
    ).toBeInTheDocument()
    expect(screen.getByText("فاز تابستان با زمان مازاد")).toBeInTheDocument()

    // 4 slots count
    const slotBadges = screen.getAllByText(/۴ زنگ|4 زنگ/i)
    expect(slotBadges.length).toBeGreaterThan(0)

    // Remainder warning badge for phase 2
    expect(screen.getByText(/\+15د مازاد|\+15m مازاد/i)).toBeInTheDocument()
  })

  it("calls onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <OperatingPhasesTable
        phases={mockPhases}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={vi.fn()}
      />
    )

    const editButtons = screen.getAllByTitle(/ویرایش فاز زمانی|editPhase/i)
    fireEvent.click(editButtons[0])
    expect(handleEdit).toHaveBeenCalledWith(mockPhases[0])
  })

  it("displays running status column showing which phase is currently in effect", () => {
    render(
      <OperatingPhasesTable
        phases={mockPhases}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // Table header for running status
    expect(screen.getByText("وضعیت اجرا")).toBeInTheDocument()

    // Summer phase (phase-2 with months [4,5,6]) includes current Shahrivar (6) -> runningNow
    expect(screen.getByText("در حال اجرا")).toBeInTheDocument()

    // School year phase (phase-1 with months [7..3]) does not include Shahrivar -> notRunning
    expect(screen.getByText("خارج از بازه")).toBeInTheDocument()
  })
})

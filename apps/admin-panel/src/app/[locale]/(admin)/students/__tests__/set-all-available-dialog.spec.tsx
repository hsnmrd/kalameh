import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { SetAllAvailableDialog } from "../components/set-all-available-dialog"
import type { OperatingPhase } from "@workspace/types"

import { studentsResource } from "@/lib/api"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockMutationFn = vi.fn().mockResolvedValue({
  success: true,
  studentCount: 15,
  slotsPerStudent: 8,
})

const mockPhases: OperatingPhaseDto[] = [
  {
    id: "phase-1",
    instituteId: "inst-1",
    title: "دوره تابستان",
    months: [4, 5, 6],
    startTime: "08:00",
    endTime: "18:00",
    slotDurationMinutes: 90,
    daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    hasBreak: false,
    breakStartTime: null,
    breakEndTime: null,
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe("SetAllAvailableDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(studentsResource.setAllAvailable, "toMutation").mockReturnValue({
      mutationFn: mockMutationFn,
    } as any)
  })

  it("should render confirmation alert dialog with title and phase name when open", () => {
    render(
      <SetAllAvailableDialog
        open={true}
        onClose={vi.fn()}
        operatingPhases={mockPhases}
        instituteId="inst-1"
      />
    )

    expect(
      screen.getByRole("heading", {
        name: /تنظیم دسترسی همگانی فراگیران|set all students available/i,
      })
    ).toBeInTheDocument()

    expect(screen.getAllByText(/دوره تابستان/).length).toBeGreaterThan(0)

    expect(
      screen.getByRole("button", { name: /تأیید|confirm/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /انصراف|cancel/i })
    ).toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <SetAllAvailableDialog
        open={true}
        onClose={handleClose}
        operatingPhases={mockPhases}
        instituteId="inst-1"
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف|cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it("should execute mutation when confirm is clicked", async () => {
    const handleClose = vi.fn()
    render(
      <SetAllAvailableDialog
        open={true}
        onClose={handleClose}
        operatingPhases={mockPhases}
        instituteId="inst-1"
      />
    )

    const confirmText = screen.getByText("تأیید")
    fireEvent.click(confirmText)

    await waitFor(() => {
      expect(mockMutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          operatingPhaseId: "phase-1",
          instituteId: "inst-1",
        }),
        expect.anything()
      )
    })
  })
})

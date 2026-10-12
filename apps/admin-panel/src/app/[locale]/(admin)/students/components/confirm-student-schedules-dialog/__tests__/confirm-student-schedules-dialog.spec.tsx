import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import { ConfirmStudentSchedulesDialog } from "../index"
import { termsResource } from "@/lib/api"
import type { TermDto } from "@workspace/types"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockMutationFn = vi.fn().mockResolvedValue({
  id: "term-1",
  studentSchedulesConfirmedAt: new Date().toISOString(),
})

const mockTerms: TermDto[] = [
  {
    id: "term-1",
    instituteId: "inst-1",
    title: "ترم تابستان ۱۴۰۴",
    operatingPhaseId: "phase-1",
    startDate: "2025-06-22T00:00:00.000Z",
    endDate: "2025-09-20T00:00:00.000Z",
    classPatterns: "EVEN_DAYS",
    daysPerTerm: 36,
    sessionsPerTerm: 18,
    isActive: true,
    studentSchedulesConfirmedAt: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
]

describe("ConfirmStudentSchedulesDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(
      termsResource.confirmStudentSchedules,
      "toMutation"
    ).mockReturnValue({
      mutationFn: mockMutationFn,
    } as any)
  })

  it("renders confirmation alert dialog with title, description, and action buttons", () => {
    render(
      <ConfirmStudentSchedulesDialog
        open={true}
        onClose={vi.fn()}
        terms={mockTerms}
        defaultTermId="term-1"
      />
    )

    expect(
      screen.getByRole("heading", {
        name: /تأیید برنامه زمانی فراگیران/i,
      })
    ).toBeInTheDocument()

    expect(screen.getAllByText(/ترم تابستان ۱۴۰۴/).length).toBeGreaterThan(0)

    expect(screen.getByRole("button", { name: /تأیید/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /انصراف/i })).toBeInTheDocument()
  })

  it("calls onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <ConfirmStudentSchedulesDialog
        open={true}
        onClose={handleClose}
        terms={mockTerms}
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it("executes confirmStudentSchedules mutation on confirm", async () => {
    const handleClose = vi.fn()
    render(
      <ConfirmStudentSchedulesDialog
        open={true}
        onClose={handleClose}
        terms={mockTerms}
        defaultTermId="term-1"
      />
    )

    const confirmBtn = screen.getByRole("button", { name: /تأیید/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockMutationFn).toHaveBeenCalledWith("term-1", expect.anything())
    })
  })
})

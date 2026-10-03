import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { DeleteTermModal } from "../components/delete-term-modal"
import type { TermDto } from "@workspace/types"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockTerm: TermDto = {
  id: "term-1",
  instituteId: "inst-1",
  title: "تابستان ۱۴۰۲",
  startDate: "2023-06-22",
  endDate: "2023-09-22",
  isActive: false,
  classesCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("DeleteTermModal Component", () => {
  it("should render warning alert dialog with term details when open", () => {
    render(<DeleteTermModal open={true} onClose={vi.fn()} term={mockTerm} />)

    expect(
      screen.getByRole("heading", {
        name: /حذف ترم تحصیلی|delete academic term/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/تابستان ۱۴۰۲/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^حذف$|^delete$/i })
    ).toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <DeleteTermModal open={true} onClose={handleClose} term={mockTerm} />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف|cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})

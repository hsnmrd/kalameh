import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { FinalizeScoresModal } from "../components/finalize-scores-modal"
import type { TermDto } from "@workspace/types"

const mockFinalizeScores = vi.fn()

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      list: {
        baseKey: () => ["terms", "list"],
      },
      detail: {
        baseKey: () => ["terms", "detail"],
      },
      finalizeScores: {
        toMutation: () => ({
          mutationFn: mockFinalizeScores,
          mutate: mockFinalizeScores,
          isPending: false,
        }),
      },
    },
  }
})

describe("FinalizeScoresModal Component", () => {
  const mockTerm: TermDto = {
    id: "term-123",
    instituteId: "inst-1",
    title: "ترم تابستان ۱۴۰۵",
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: "2026-09-01T00:00:00.000Z",
    isActive: true,
    unscoredStudentsCount: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders modal with title, description and unscored students warning", () => {
    render(
      <FinalizeScoresModal open={true} onClose={vi.fn()} term={mockTerm} />
    )

    expect(
      screen.getByText(
        /ثبت نهایی نمرات و پایان ترم|finalizeScoresModal\.title/i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/دانشجو هنوز فاقد نمره نهایی|unscoredWarning/i)
    ).toBeInTheDocument()
  })

  it("submits finalization mutation on confirm click", async () => {
    const handleClose = vi.fn()
    render(
      <FinalizeScoresModal open={true} onClose={handleClose} term={mockTerm} />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /ثبت نهایی نمرات|confirm/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockFinalizeScores).toHaveBeenCalledWith(
        "term-123",
        expect.anything()
      )
    })
  })

  it("cancels modal when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <FinalizeScoresModal open={true} onClose={handleClose} term={mockTerm} />
    )

    const cancelBtn = screen.getByRole("button", {
      name: /انصراف|cancel/i,
    })
    fireEvent.click(cancelBtn)

    expect(handleClose).toHaveBeenCalled()
  })
})

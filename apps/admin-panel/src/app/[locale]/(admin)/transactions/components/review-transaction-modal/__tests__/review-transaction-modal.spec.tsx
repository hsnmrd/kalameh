import { describe, expect, it, vi } from "vitest"
import { screen, render } from "@/test/test-utils"
import { TRANSACTION_STATUSES, type TransactionDto } from "@workspace/types"
import { ReviewTransactionModal } from "../index"
import transactionsMessagesFa from "@/messages/fa/transactions.json"

const mockTransaction: TransactionDto = {
  id: "tx-123",
  amount: 1800000,
  paymentDate: "2026-10-17T12:00:00.000Z",
  trackingCode: "45345345",
  receiptImageUrl: "/uploads/receipts/receipt-1.jpg",
  status: TRANSACTION_STATUSES.PENDING,
  createdAt: "2026-10-17T12:00:00.000Z",
  updatedAt: "2026-10-17T12:00:00.000Z",
  isDuplicateTrackingCode: false,
  student: {
    id: "student-1",
    firstName: "حسن",
    lastName: "مرادنژاد",
    phone: "09034882088",
  },
  class: {
    id: "class-1",
    title: "American English File ۳ - ۵",
    term: {
      id: "term-1",
      title: "مهر و آبان ۱۴۰۵",
    },
  },
}

describe("ReviewTransactionModal", () => {
  const customMessages = {
    transactions: transactionsMessagesFa,
  }

  it("renders in a FormDialog with header title, close button, and without footer close button", () => {
    const onClose = vi.fn()
    render(
      <ReviewTransactionModal
        transaction={mockTransaction}
        onClose={onClose}
      />,
      {
        messages: customMessages,
      }
    )

    // Header title
    expect(
      screen.getByText(transactionsMessagesFa.reviewModal.title)
    ).toBeInTheDocument()

    // Student & class info
    expect(screen.getByText("حسن مرادنژاد")).toBeInTheDocument()
    expect(screen.getByText("09034882088")).toBeInTheDocument()
    expect(screen.getByText("45345345")).toBeInTheDocument()
    expect(screen.getByText("American English File ۳ - ۵")).toBeInTheDocument()

    // Action buttons in footer
    expect(
      screen.getByText(transactionsMessagesFa.reviewModal.approve)
    ).toBeInTheDocument()
    expect(
      screen.getByText(transactionsMessagesFa.reviewModal.reject)
    ).toBeInTheDocument()

    // Header close button exists (sr-only "Close" or icon)
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument()

    // Verify footer DOES NOT have a text close button ("بستن")
    const footerCloseButton = screen.queryByRole("button", {
      name: transactionsMessagesFa.reviewModal.close,
    })
    expect(footerCloseButton).not.toBeInTheDocument()
  })
})

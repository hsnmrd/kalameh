import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { ReceiptStatusCard } from "../index"
import enrollmentsMessagesFa from "@/messages/fa/enrollments.json"
import { ENROLLMENT_STATUSES, type EnrollmentDto } from "@workspace/types"

const mockEnrollment: EnrollmentDto = {
  id: "e1",
  studentId: "s1",
  classId: "c1",
  status: ENROLLMENT_STATUSES.PENDING_APPROVAL,
  createdAt: "2026-05-10T10:00:00.000Z",
  updatedAt: "2026-05-10T10:00:00.000Z",
  class: {
    id: "c1",
    title: "مقدماتی مکالمه انگلیسی",
    fee: 1500000,
    capacity: 20,
    term: {
      id: "t1",
      title: "پاییز ۱۴۰۳",
    },
  },
  transaction: {
    id: "tr1",
    amount: 1500000,
    trackingCode: "TRK-987654",
    receiptImageUrl: "/uploads/receipts/test.jpg",
    status: "PENDING",
    paymentDate: "2026-05-10T10:00:00.000Z",
  },
}

describe("ReceiptStatusCard", () => {
  it("renders class title, term, and status badge", () => {
    render(<ReceiptStatusCard enrollment={mockEnrollment} />, {
      messages: { enrollments: enrollmentsMessagesFa },
    })

    expect(screen.getByText("مقدماتی مکالمه انگلیسی")).toBeInTheDocument()
    expect(screen.getByText("پاییز ۱۴۰۳")).toBeInTheDocument()
    expect(screen.getByText("در انتظار تأیید")).toBeInTheDocument()
  })

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn()
    render(
      <ReceiptStatusCard enrollment={mockEnrollment} onClick={handleClick} />,
      {
        messages: { enrollments: enrollmentsMessagesFa },
      }
    )

    fireEvent.click(screen.getByRole("button"))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("does not render inline receipt image inside the compact transfer card", () => {
    render(<ReceiptStatusCard enrollment={mockEnrollment} />, {
      messages: { enrollments: enrollmentsMessagesFa },
    })

    expect(screen.queryByAltText("Payment receipt")).not.toBeInTheDocument()
  })
})

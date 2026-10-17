import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { PaymentDetailsModal } from "../index"
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
    teacherName: "علی رضایی",
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

describe("PaymentDetailsModal", () => {
  it("renders modal details including class, teacher, tracking code, and receipt image", () => {
    render(
      <PaymentDetailsModal
        open={true}
        enrollment={mockEnrollment}
        onClose={vi.fn()}
      />,
      {
        messages: { enrollments: enrollmentsMessagesFa },
      }
    )

    expect(screen.getByText("جزئیات واریز")).toBeInTheDocument()
    expect(screen.getByText("مقدماتی مکالمه انگلیسی")).toBeInTheDocument()
    expect(screen.getByText("علی رضایی")).toBeInTheDocument()
    expect(screen.getByText("TRK-987654")).toBeInTheDocument()
    expect(screen.getByAltText("Payment receipt")).toBeInTheDocument()
  })

  it("calls onClose when close icon button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <PaymentDetailsModal
        open={true}
        enrollment={mockEnrollment}
        onClose={handleClose}
      />,
      {
        messages: { enrollments: enrollmentsMessagesFa },
      }
    )

    const closeBtn = screen.getByRole("button", { name: /close/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it("returns null when enrollment is null", () => {
    const { container } = render(
      <PaymentDetailsModal open={true} enrollment={null} onClose={vi.fn()} />,
      {
        messages: { enrollments: enrollmentsMessagesFa },
      }
    )

    expect(container).toBeEmptyDOMElement()
  })
})

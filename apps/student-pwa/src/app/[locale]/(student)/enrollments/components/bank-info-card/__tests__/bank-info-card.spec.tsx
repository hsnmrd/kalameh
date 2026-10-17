import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { BankInfoCard } from "../index"
import enrollmentsMessagesFa from "@/messages/fa/enrollments.json"

describe("BankInfoCard Component", () => {
  const customMessages = {
    enrollments: enrollmentsMessagesFa,
  }

  const mockBankInfo = {
    bankCardNumber: "6037997123456789",
    bankAccountName: "مدرسه کلمه",
    bankShaba: "IR120120000000001234567890",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the deposit button and trigger scroll on click", () => {
    const onScrollToPayment = vi.fn()
    render(
      <BankInfoCard
        bankInfo={mockBankInfo}
        tuition={1500000}
        onScrollToPayment={onScrollToPayment}
      />,
      {
        messages: customMessages,
      }
    )

    const depositButton = screen.getByRole("button", {
      name: enrollmentsMessagesFa.payment.depositAction,
    })
    expect(depositButton).toBeInTheDocument()

    fireEvent.click(depositButton)
    expect(onScrollToPayment).toHaveBeenCalledTimes(1)
  })

  it("should fallback to document.getElementById when onScrollToPayment is omitted", () => {
    const scrollIntoViewMock = vi.fn()
    const targetElement = document.createElement("div")
    targetElement.id = "upload-receipt-section"
    targetElement.scrollIntoView = scrollIntoViewMock
    document.body.appendChild(targetElement)

    render(<BankInfoCard bankInfo={mockBankInfo} tuition={1500000} />, {
      messages: customMessages,
    })

    const depositButton = screen.getByRole("button", {
      name: enrollmentsMessagesFa.payment.depositAction,
    })
    fireEvent.click(depositButton)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    })

    document.body.removeChild(targetElement)
  })

  it("should render bank card details within a card and display tuition amount correctly", () => {
    const { container } = render(
      <BankInfoCard bankInfo={mockBankInfo} tuition={1500000} />,
      {
        messages: customMessages,
      }
    )

    // Check Card wrapper
    const cardElement = container.querySelector('[data-slot="card"]')
    expect(cardElement).toBeInTheDocument()

    expect(screen.getByText("مدرسه کلمه")).toBeInTheDocument()
    expect(screen.getByText("IR120120000000001234567890")).toBeInTheDocument()
    expect(screen.getByText("1,500,000")).toBeInTheDocument()
    expect(screen.getByText("6037 9971 2345 6789")).toBeInTheDocument()

    // Ensure payment rule is rendered without any emoji characters
    const ruleElement = screen.getByText(
      enrollmentsMessagesFa.payment.fullPaymentRule
    )
    expect(ruleElement).toBeInTheDocument()
    expect(container.textContent).not.toContain("ℹ️")
  })
})

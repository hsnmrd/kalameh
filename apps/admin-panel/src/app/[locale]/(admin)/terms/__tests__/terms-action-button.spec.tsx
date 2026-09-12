import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TermsActionButton } from "../components/terms-action-button"

describe("TermsActionButton Component", () => {
  it("should render the primary Add Term button and trigger onAddClick on click", () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsActionButton onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const addButton = screen.getByRole("button", {
      name: /افزودن ترم جدید|add new term/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
    expect(onBatchClick).not.toHaveBeenCalled()
  })

  it("should render dropdown trigger and reveal batch generator option", async () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsActionButton onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const trigger = screen.getByRole("button", {
      name: /عملیات ترم‌ها|term actions/i,
    })
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    const smartOption = await screen.findByText(
      /ساخت هوشمند ترم‌ها|smart phase terms/i
    )
    expect(smartOption).toBeInTheDocument()

    fireEvent.click(smartOption)
    expect(onBatchClick).toHaveBeenCalledTimes(1)
  })

  it("should return null if no handlers provided", () => {
    const { container } = render(<TermsActionButton />)
    expect(container).toBeEmptyDOMElement()
  })
})

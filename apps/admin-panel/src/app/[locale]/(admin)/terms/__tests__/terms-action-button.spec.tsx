import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TermsActionButton } from "../components/terms-action-button"

describe("TermsActionButton Component", () => {
  it("should render the primary Smart Term Creation button and trigger onBatchClick on click", () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsActionButton onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const batchButton = screen.getByRole("button", {
      name: /ساخت هوشمند ترم|smart term creation/i,
    })
    expect(batchButton).toBeInTheDocument()

    fireEvent.click(batchButton)
    expect(onBatchClick).toHaveBeenCalledTimes(1)
    expect(onAddClick).not.toHaveBeenCalled()
  })

  it("should render dropdown trigger and reveal manual add option", async () => {
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

    const manualOption = await screen.findByText(
      /افزودن دستی ترم|add term manually/i
    )
    expect(manualOption).toBeInTheDocument()

    fireEvent.click(manualOption)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })

  it("should fallback to Add Term as primary button if only onAddClick is provided", () => {
    const onAddClick = vi.fn()

    render(<TermsActionButton onAddClick={onAddClick} />)

    const addButton = screen.getByRole("button", {
      name: /افزودن ترم جدید|add new term/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })

  it("should return null if no handlers provided", () => {
    const { container } = render(<TermsActionButton />)
    expect(container).toBeEmptyDOMElement()
  })
})

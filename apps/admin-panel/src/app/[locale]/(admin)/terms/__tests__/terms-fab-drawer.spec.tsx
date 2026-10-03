import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TermsFabDrawer } from "../components/terms-fab-drawer"

describe("TermsFabDrawer Component", () => {
  it("should render mobile FAB trigger button", () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsFabDrawer onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات ترم‌ها|term actions/i,
    })
    expect(fab).toBeInTheDocument()
  })

  it("should open drawer and trigger callbacks when action buttons are clicked", () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsFabDrawer onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات ترم‌ها|term actions/i,
    })
    fireEvent.click(fab)

    // Drawer should open and show the action options
    const smartButton = screen.getByRole("button", {
      name: /ساخت هوشمند ترم‌ها|smart phase terms/i,
    })
    expect(smartButton).toBeInTheDocument()

    fireEvent.click(smartButton)
    expect(onBatchClick).toHaveBeenCalledTimes(1)
  })

  it("should trigger onAddClick when Add Term is clicked in drawer", () => {
    const onAddClick = vi.fn()
    const onBatchClick = vi.fn()

    render(
      <TermsFabDrawer onAddClick={onAddClick} onBatchClick={onBatchClick} />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات ترم‌ها|term actions/i,
    })
    fireEvent.click(fab)

    const addButton = screen.getByRole("button", {
      name: /افزودن ترم جدید|add new term/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })
})

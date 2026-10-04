import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { StudentsActionButton } from "../components/students-action-button"

describe("StudentsActionButton Component", () => {
  it("should render the primary Add Student button and trigger onAddClick on click", () => {
    const onAddClick = vi.fn()
    const onSetAllAvailableClick = vi.fn()

    render(
      <StudentsActionButton
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
      />
    )

    const addButton = screen.getByRole("button", {
      name: /ثبت فراگیر جدید|add student/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
    expect(onSetAllAvailableClick).not.toHaveBeenCalled()
  })

  it("should render dropdown trigger and reveal setAllAvailable option", async () => {
    const onAddClick = vi.fn()
    const onSetAllAvailableClick = vi.fn()

    render(
      <StudentsActionButton
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
      />
    )

    const trigger = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    const allAvailableOption = await screen.findByText(
      /دسترسی همگانی|set all available/i
    )
    expect(allAvailableOption).toBeInTheDocument()

    fireEvent.click(allAvailableOption)
    expect(onSetAllAvailableClick).toHaveBeenCalledTimes(1)
  })

  it("should return null if no handlers are provided", () => {
    const { container } = render(<StudentsActionButton />)
    expect(container).toBeEmptyDOMElement()
  })
})

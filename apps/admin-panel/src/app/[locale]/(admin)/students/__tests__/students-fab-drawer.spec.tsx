import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { StudentsFabDrawer } from "../components/students-fab-drawer"

describe("StudentsFabDrawer Component", () => {
  it("should render mobile FAB trigger button", () => {
    const onAddClick = vi.fn()
    const onSetAllAvailableClick = vi.fn()

    render(
      <StudentsFabDrawer
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
      />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    expect(fab).toBeInTheDocument()
  })

  it("should open drawer and trigger onAddClick when Add Student is clicked", () => {
    const onAddClick = vi.fn()
    const onSetAllAvailableClick = vi.fn()

    render(
      <StudentsFabDrawer
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
      />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    fireEvent.click(fab)

    const addButton = screen.getByRole("button", {
      name: /ثبت فراگیر جدید|add student/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })

  it("should open drawer and trigger onSetAllAvailableClick when Set All Available is clicked", () => {
    const onAddClick = vi.fn()
    const onSetAllAvailableClick = vi.fn()

    render(
      <StudentsFabDrawer
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
      />
    )

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    fireEvent.click(fab)

    const allAvailableButton = screen.getByRole("button", {
      name: /دسترسی همگانی|set all available/i,
    })
    expect(allAvailableButton).toBeInTheDocument()

    fireEvent.click(allAvailableButton)
    expect(onSetAllAvailableClick).toHaveBeenCalledTimes(1)
  })

  it("should return null when disabled", () => {
    const { container } = render(
      <StudentsFabDrawer
        onAddClick={vi.fn()}
        onSetAllAvailableClick={vi.fn()}
        disabled
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

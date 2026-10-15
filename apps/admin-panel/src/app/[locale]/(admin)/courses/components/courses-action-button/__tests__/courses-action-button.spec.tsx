import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../../../test/test-utils"
import { CoursesActionButton } from "../index"

describe("CoursesActionButton Component", () => {
  it("should render nothing when neither onAddClick nor onBatchClick is provided", () => {
    const { container } = render(<CoursesActionButton />)
    expect(container.firstChild).toBeNull()
  })

  it("should render primary group button and trigger onBatchClick when clicked", () => {
    const handleBatch = vi.fn()
    const handleAdd = vi.fn()

    render(
      <CoursesActionButton onBatchClick={handleBatch} onAddClick={handleAdd} />
    )

    const primaryBatchBtn = screen.getByRole("button", {
      name: /ایجاد گروهی دوره‌ها|generate group courses/i,
    })
    expect(primaryBatchBtn).toBeInTheDocument()

    fireEvent.click(primaryBatchBtn)
    expect(handleBatch).toHaveBeenCalledTimes(1)
  })

  it("should render only add button if only onAddClick is provided", () => {
    const handleAdd = vi.fn()

    render(<CoursesActionButton onAddClick={handleAdd} />)

    const addBtn = screen.getByRole("button", {
      name: /تعریف تکی دوره|create single course|addCourse/i,
    })
    expect(addBtn).toBeInTheDocument()

    fireEvent.click(addBtn)
    expect(handleAdd).toHaveBeenCalledTimes(1)
  })
})

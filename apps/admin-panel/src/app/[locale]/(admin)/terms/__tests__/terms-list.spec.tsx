import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TermsList } from "../components/terms-list"
import type { TermDto } from "@workspace/types"

describe("TermsList Component", () => {
  const mockTerms: TermDto[] = [
    {
      id: "term-1",
      instituteId: "inst-1",
      title: "پاییز ۱۴۰۵",
      startDate: new Date("2026-09-23").toISOString(),
      endDate: new Date("2026-12-21").toISOString(),
      isActive: true,
      classesCount: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <TermsList
        terms={undefined}
        isLoading={true}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render empty state message when terms array is empty", () => {
    render(
      <TermsList
        terms={[]}
        isLoading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText(/هیچ ترم/i)).toBeInTheDocument()
  })

  it("should render terms item with title and trigger onView on click", () => {
    const handleView = vi.fn()
    render(
      <TermsList
        terms={mockTerms}
        isLoading={false}
        onView={handleView}
        onEdit={vi.fn()}
      />
    )

    const titleElement = screen.getByText("پاییز ۱۴۰۵")
    expect(titleElement).toBeInTheDocument()

    fireEvent.click(titleElement)
    expect(handleView).toHaveBeenCalledWith(mockTerms[0])
  })

  it("should render delete action button on mobile list item for deletable terms and trigger onDelete", () => {
    const handleDelete = vi.fn()
    const handleView = vi.fn()

    const pastTerm: TermDto = {
      id: "term-past",
      instituteId: "inst-1",
      title: "تابستان ۱۴۰۱",
      startDate: "2022-06-22",
      endDate: "2022-09-22",
      isActive: true,
      classesCount: 0,
      createdAt: "",
      updatedAt: "",
    }
    const upcomingTerm: TermDto = {
      id: "term-upcoming",
      instituteId: "inst-1",
      title: "تابستان ۱۴۱۵",
      startDate: "2036-06-22",
      endDate: "2036-09-22",
      isActive: true,
      classesCount: 0,
      createdAt: "",
      updatedAt: "",
    }

    render(
      <TermsList
        terms={[pastTerm, upcomingTerm]}
        isLoading={false}
        onView={handleView}
        onEdit={vi.fn()}
        onDelete={handleDelete}
      />
    )

    // Only 1 delete button should be visible on the list items (for upcomingTerm, not pastTerm)
    const deleteBtns = screen.getAllByLabelText(/حذف ترم|delete term/i)
    expect(deleteBtns).toHaveLength(1)

    fireEvent.click(deleteBtns[0])
    expect(handleDelete).toHaveBeenCalledWith(upcomingTerm)
    // onView should not have been called due to e.stopPropagation()
    expect(handleView).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { formatNumber } from "@workspace/ui/lib/utils"
import { TermsTable } from "../components/terms-table"
import type { TermDto } from "@workspace/types"

describe("TermsTable Component", () => {
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
      <TermsTable
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
      <TermsTable
        terms={[]}
        isLoading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText(/هیچ ترم/i)).toBeInTheDocument()
  })

  it("should render term row with title and class count", () => {
    render(
      <TermsTable
        terms={mockTerms}
        isLoading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText("پاییز ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText(formatNumber(4, "fa"))).toBeInTheDocument()
  })

  it("should render view button and trigger onView when clicked", () => {
    const handleView = vi.fn()
    render(
      <TermsTable
        terms={mockTerms}
        isLoading={false}
        onView={handleView}
        onEdit={vi.fn()}
      />
    )
    const viewBtn = screen.getByLabelText(/مشاهده|view/i)
    fireEvent.click(viewBtn)
    expect(handleView).toHaveBeenCalledWith(mockTerms[0])
  })

  it("should trigger onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <TermsTable
        terms={mockTerms}
        isLoading={false}
        onView={vi.fn()}
        onEdit={handleEdit}
      />
    )
    const editBtn = screen.getByLabelText(/عملیات|actions/i)
    fireEvent.click(editBtn)
    expect(handleEdit).toHaveBeenCalledWith(mockTerms[0])
  })

  it("should render delete button only for deletable terms and trigger onDelete", () => {
    const handleDelete = vi.fn()
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
      <TermsTable
        terms={[pastTerm, upcomingTerm]}
        isLoading={false}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={handleDelete}
      />
    )

    // Only 1 delete button should exist (for upcomingTerm, not pastTerm)
    const deleteBtns = screen.getAllByLabelText(/حذف ترم|delete term/i)
    expect(deleteBtns).toHaveLength(1)

    fireEvent.click(deleteBtns[0])
    expect(handleDelete).toHaveBeenCalledWith(upcomingTerm)
  })
})

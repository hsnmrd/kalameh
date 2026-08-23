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
      <TermsTable terms={undefined} isLoading={true} onEdit={vi.fn()} />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render empty state message when terms array is empty", () => {
    render(<TermsTable terms={[]} isLoading={false} onEdit={vi.fn()} />)
    expect(screen.getByText(/هیچ ترم/i)).toBeInTheDocument()
  })

  it("should render term row with title and class count", () => {
    render(<TermsTable terms={mockTerms} isLoading={false} onEdit={vi.fn()} />)
    expect(screen.getByText("پاییز ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText(formatNumber(4, "fa"))).toBeInTheDocument()
  })

  it("should trigger onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <TermsTable terms={mockTerms} isLoading={false} onEdit={handleEdit} />
    )
    const editBtn = screen.getByLabelText(/عملیات|actions/i)
    fireEvent.click(editBtn)
    expect(handleEdit).toHaveBeenCalledWith(mockTerms[0])
  })
})

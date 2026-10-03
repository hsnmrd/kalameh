import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { TermDetailsPreview } from "../components/term-details-preview"
import type { TermDto } from "@workspace/types"

describe("TermDetailsPreview Component", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "تابستان ۱۴۰۵",
    startDate: new Date("2026-06-21T00:00:00.000Z").toISOString(),
    endDate: new Date("2026-09-21T00:00:00.000Z").toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("should render null when term is undefined or null", () => {
    const { container } = render(<TermDetailsPreview term={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("should render term dates label and active badge when term is active", () => {
    render(<TermDetailsPreview term={mockTerm} />)

    expect(screen.getByText(/بازه زمانی ترم:/i)).toBeInTheDocument()
    expect(screen.getByText(/ترم فعال/i)).toBeInTheDocument()
  })

  it("should not render active badge when term is not active", () => {
    render(<TermDetailsPreview term={{ ...mockTerm, isActive: false }} />)

    expect(screen.getByText(/بازه زمانی ترم:/i)).toBeInTheDocument()
    expect(screen.queryByText(/ترم فعال/i)).not.toBeInTheDocument()
  })
})

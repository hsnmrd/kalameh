import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { TermDetailsPreview } from "../components/term-details-preview"
import type { TermDto } from "@workspace/types"

describe("TermDetailsPreview Component", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "تابستان ۱۴۰۵",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    classesCount: 0,
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

  it("should render special badge when activation window passed but term has 0 classes and is before endDate", () => {
    const midTermWithNoClasses: TermDto = {
      ...mockTerm,
      // 20 days ago start, 60 days in future end
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      classesCount: 0,
    }

    render(<TermDetailsPreview term={midTermWithNoClasses} />)

    expect(screen.getByText(/ترم فاقد کلاس/i)).toBeInTheDocument()
    expect(screen.getByText(/بازه زمانی ترم:/i)).toBeInTheDocument()
  })

  it("should render destructive warning when activation window passed and term has classes", () => {
    const midTermWithClasses: TermDto = {
      ...mockTerm,
      // 20 days ago start, 60 days in future end
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      classesCount: 2,
    }

    render(<TermDetailsPreview term={midTermWithClasses} />)

    expect(
      screen.getByText(/بازه فعال‌سازی این ترم به پایان رسیده است/i)
    ).toBeInTheDocument()
  })
})

import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { TermStatusBadge } from "../components/term-status-badge"
import type { TermDto } from "@workspace/types"

describe("TermStatusBadge Component", () => {
  it("renders ACTIVE status correctly", () => {
    render(<TermStatusBadge status="ACTIVE" />)
    expect(screen.getByText(/در حال برگزاری|in session/i)).toBeInTheDocument()
  })

  it("renders REGISTERING status correctly", () => {
    render(<TermStatusBadge status="REGISTERING" />)
    expect(screen.getByText(/در حال ثبت‌نام|registering/i)).toBeInTheDocument()
  })

  it("renders UPCOMING status correctly", () => {
    render(<TermStatusBadge status="UPCOMING" />)
    expect(screen.getByText(/پیش‌رو|upcoming/i)).toBeInTheDocument()
  })

  it("renders COMPLETED status correctly", () => {
    render(<TermStatusBadge status="COMPLETED" />)
    expect(screen.getByText(/پایان‌یافته|completed/i)).toBeInTheDocument()
  })

  it("renders INACTIVE status correctly", () => {
    render(<TermStatusBadge status="INACTIVE" />)
    expect(screen.getByText(/بسته شده|closed/i)).toBeInTheDocument()
  })

  it("computes status from term when term is passed", () => {
    const term: TermDto = {
      id: "term-1",
      instituteId: "inst-1",
      title: "ترم منقضی",
      startDate: "2020-01-01",
      endDate: "2020-02-28",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    }
    render(<TermStatusBadge term={term} />)
    expect(screen.getByText(/پایان‌یافته|completed/i)).toBeInTheDocument()
  })

  it("falls back to boolean isActive prop for backward compatibility", () => {
    render(<TermStatusBadge isActive={false} />)
    expect(screen.getByText(/بسته شده|closed/i)).toBeInTheDocument()
  })
})

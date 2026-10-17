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
    expect(screen.getByText(/اتمام|پایان‌یافته|completed/i)).toBeInTheDocument()
  })

  it("renders INACTIVE status correctly", () => {
    render(<TermStatusBadge status="INACTIVE" />)
    expect(screen.getByText(/غیرفعال|بسته شده|closed/i)).toBeInTheDocument()
  })

  it("renders CLASSES_STARTED status correctly", () => {
    render(<TermStatusBadge status="CLASSES_STARTED" />)
    expect(screen.getByText(/شروع کلاس‌ها/i)).toBeInTheDocument()
  })

  it("renders FINAL_EXAMS status correctly", () => {
    render(<TermStatusBadge status="FINAL_EXAMS" />)
    expect(screen.getByText(/امتحانات پایان ترم/i)).toBeInTheDocument()
  })

  it("renders GRADING status correctly", () => {
    render(<TermStatusBadge status="GRADING" />)
    expect(screen.getByText(/در حال ثبت نمرات/i)).toBeInTheDocument()
  })

  it("renders multiple statuses when statuses array is passed", () => {
    render(
      <TermStatusBadge
        statuses={["ONGOING", "CLASSES_STARTED", "REGISTERING"]}
      />
    )
    expect(screen.getByText(/در حال برگزاری/i)).toBeInTheDocument()
    expect(screen.getByText(/شروع کلاس‌ها/i)).toBeInTheDocument()
    expect(screen.getByText(/در حال ثبت‌نام/i)).toBeInTheDocument()
  })

  it("computes status from term when term is passed", () => {
    const term: TermDto = {
      id: "term-1",
      instituteId: "inst-1",
      title: "ترم منقضی",
      startDate: "2020-01-01",
      endDate: "2020-02-28",
      isActive: true,
      operatingPhaseId: "phase-1",
      createdAt: "",
      updatedAt: "",
    }
    render(<TermStatusBadge term={term} />)
    expect(screen.getByText(/اتمام|پایان‌یافته|completed/i)).toBeInTheDocument()
  })

  it("falls back to boolean isActive prop for backward compatibility", () => {
    render(<TermStatusBadge isActive={false} />)
    expect(screen.getByText(/غیرفعال|بسته شده|closed/i)).toBeInTheDocument()
  })

  it("renders both ongoing and registering badges when term start date passed but classesCount is 0", () => {
    const term: TermDto = {
      id: "term-2",
      instituteId: "inst-1",
      title: "ترم بدون کلاس",
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      classesCount: 0,
      createdAt: "",
      updatedAt: "",
    }
    render(<TermStatusBadge term={term} />)
    expect(screen.getByText(/در حال برگزاری/i)).toBeInTheDocument()
    expect(screen.getByText(/در حال ثبت‌نام/i)).toBeInTheDocument()
  })
})

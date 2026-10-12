import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@/test/test-utils"
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"
import { SchedulingStudentScheduleConfirmation } from "../index"

const mockTerm: TermDto = {
  id: "00000000-0000-4000-8000-000000000001",
  instituteId: "00000000-0000-4000-8000-000000000002",
  title: "ترم پاییز",
  startDate: "2026-09-23",
  endDate: "2026-12-21",
  isActive: true,
  operatingPhaseId: "00000000-0000-4000-8000-000000000003",
  studentSchedulesConfirmedAt: null,
  studentSchedulesConfirmedByUserId: null,
  createdAt: "2026-08-01",
  updatedAt: "2026-08-01",
}

describe("SchedulingStudentScheduleConfirmation", () => {
  it("renders warning message without any confirm button when student schedules are unconfirmed", () => {
    render(<SchedulingStudentScheduleConfirmation term={mockTerm} />)

    expect(screen.getByText("تأیید برنامه زمانی فراگیران")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "تأیید برنامه زمانی فراگیران" })
    ).not.toBeInTheDocument()
  })

  it("returns null when student schedules are confirmed", () => {
    const confirmedTerm: TermDto = {
      ...mockTerm,
      studentSchedulesConfirmedAt: "2026-10-11T10:00:00.000Z",
    }

    const { container } = render(
      <SchedulingStudentScheduleConfirmation term={confirmedTerm} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})

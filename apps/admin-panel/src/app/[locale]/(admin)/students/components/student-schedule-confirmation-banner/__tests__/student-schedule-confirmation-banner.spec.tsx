import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { StudentScheduleConfirmationBanner } from "../index"
import type { TermDto } from "@workspace/types"

const mockUnconfirmedTerm: TermDto = {
  id: "term-1",
  instituteId: "inst-1",
  title: "ترم تابستان ۱۴۰۴",
  operatingPhaseId: "phase-1",
  startDate: "2025-06-22T00:00:00.000Z",
  endDate: "2025-09-20T00:00:00.000Z",
  classPatterns: "EVEN_DAYS",
  daysPerTerm: 36,
  sessionsPerTerm: 18,
  isActive: true,
  studentSchedulesConfirmedAt: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
}

const mockConfirmedTerm: TermDto = {
  ...mockUnconfirmedTerm,
  id: "term-2",
  studentSchedulesConfirmedAt: "2025-06-15T00:00:00.000Z",
}

describe("StudentScheduleConfirmationBanner", () => {
  it("renders warning banner when student schedules are unconfirmed", () => {
    const onConfirmClick = vi.fn()
    render(
      <StudentScheduleConfirmationBanner
        term={mockUnconfirmedTerm}
        onConfirmClick={onConfirmClick}
      />
    )

    expect(screen.getByText("تأیید برنامه زمانی فراگیران")).toBeInTheDocument()

    const confirmBtn = screen.getByRole("button", {
      name: /^تأیید$/i,
    })
    expect(confirmBtn).toBeInTheDocument()

    fireEvent.click(confirmBtn)
    expect(onConfirmClick).toHaveBeenCalledTimes(1)
  })

  it("expands collapsible description when clicking trigger", () => {
    render(
      <StudentScheduleConfirmationBanner
        term={mockUnconfirmedTerm}
        onConfirmClick={vi.fn()}
      />
    )

    const trigger = screen.getByRole("button", {
      name: /تأیید برنامه زمانی فراگیران/i,
    })
    fireEvent.click(trigger)

    expect(
      screen.getByText(/برنامه زمانی فراگیران برای ترم/i)
    ).toBeInTheDocument()
  })

  it("does not render when student schedules are already confirmed", () => {
    const { container } = render(
      <StudentScheduleConfirmationBanner
        term={mockConfirmedTerm}
        onConfirmClick={vi.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("renders warning banner without confirm button when user lacks APPROVE_STUDENTS_TIME (e.g. supervisor)", async () => {
    const hooks = await import("@/lib/hooks")
    const { ROLES } = await import("@workspace/types")
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "sup-1",
        instituteId: "inst-1",
        role: ROLES.SUPERVISOR,
        firstName: "Super",
        lastName: "Visor",
        phone: "09123456789",
        isActive: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.SUPERVISOR,
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    render(
      <StudentScheduleConfirmationBanner
        term={mockUnconfirmedTerm}
        onConfirmClick={vi.fn()}
      />
    )

    expect(screen.getByText("تأیید برنامه زمانی فراگیران")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^تأیید$/i })
    ).not.toBeInTheDocument()
  })

  it("does not render when hasStudents is false or studentsCount is 0", () => {
    const { container: c1 } = render(
      <StudentScheduleConfirmationBanner
        term={mockUnconfirmedTerm}
        hasStudents={false}
        onConfirmClick={vi.fn()}
      />
    )
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(
      <StudentScheduleConfirmationBanner
        term={mockUnconfirmedTerm}
        studentsCount={0}
        onConfirmClick={vi.fn()}
      />
    )
    expect(c2).toBeEmptyDOMElement()
  })

  it("does not render when term is inactive or completed", () => {
    const inactiveTerm: TermDto = {
      ...mockUnconfirmedTerm,
      isActive: false,
    }
    const { container: c1 } = render(
      <StudentScheduleConfirmationBanner
        term={inactiveTerm}
        onConfirmClick={vi.fn()}
      />
    )
    expect(c1).toBeEmptyDOMElement()

    const completedTerm: TermDto = {
      ...mockUnconfirmedTerm,
      lifecycleStatus: "COMPLETED",
    }
    const { container: c2 } = render(
      <StudentScheduleConfirmationBanner
        term={completedTerm}
        onConfirmClick={vi.fn()}
      />
    )
    expect(c2).toBeEmptyDOMElement()
  })
})

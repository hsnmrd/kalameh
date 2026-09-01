import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ClassScheduleWizard } from "../components/class-schedule-wizard"
import type { TermDto } from "@workspace/types"

describe("ClassScheduleWizard Component", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "پاییز ۱۴۰۵",
    startDate: "2026-09-23T00:00:00.000Z",
    endDate: "2026-12-21T00:00:00.000Z",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("should render wizard dialog with presets and weekdays when open", () => {
    render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        onConfirm={vi.fn()}
      />
    )

    expect(
      screen.getByRole("heading", { name: /تنظیم برنامه زمانی و روزهای کلاس/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/الگوهای سریع/i)).toBeInTheDocument()
    expect(screen.getByText(/روزهای زوج/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^شنبه$/i })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^چهارشنبه$/i })
    ).toBeInTheDocument()
  })

  it("should select even days when clicking presetEven and calculate session count", () => {
    render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        onConfirm={vi.fn()}
      />
    )

    const evenPresetBtn = screen.getByRole("button", {
      name: /روزهای زوج/i,
    })
    fireEvent.click(evenPresetBtn)

    // Verify session badge displays calculated sessions
    expect(screen.getByText(/جلسه در طول ترم/i)).toBeInTheDocument()
  })

  it("should call onConfirm with formatted schedule when confirm button is clicked", () => {
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    render(
      <ClassScheduleWizard
        open={true}
        onClose={handleClose}
        term={mockTerm}
        initialDaysOfWeek={["SATURDAY", "MONDAY"]}
        initialStartTime="16:00"
        initialEndTime="17:30"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        daysOfWeek: ["SATURDAY", "MONDAY"],
        sessionDates: expect.any(Array),
        startTime: "16:00",
        endTime: "17:30",
        formattedSchedule: expect.stringContaining("16:00 - 17:30"),
      })
    )
    expect(handleClose).toHaveBeenCalled()
  })

  it("should focus calendar on the first session date month instead of current date", () => {
    render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        initialDaysOfWeek={["SATURDAY"]}
        onConfirm={vi.fn()}
      />
    )

    // Calendar should show Mehr (مهر) as the active month
    expect(screen.getByText(/مهر/i)).toBeInTheDocument()
  })

  it("should toggle a session day off and on when clicking on a date in the calendar", () => {
    render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        initialDaysOfWeek={["SATURDAY"]}
        onConfirm={vi.fn()}
      />
    )

    // Initial session count badge
    const badge = screen.getByText(/جلسه در طول ترم/i)
    const initialText = badge.textContent

    // Find day buttons in the calendar table
    const dayButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.classList.contains("rdp-day_button") ||
        /^[۰-۹0-9]+$/.test(btn.textContent?.trim() || "")
      )
    })
    expect(dayButtons.length).toBeGreaterThan(0)

    // Find an active session day button (react-day-picker applies modifier to td or button)
    const sessionDay =
      dayButtons.find((btn) => {
        const td = btn.closest("td")
        return (
          td?.className.includes("session") ||
          td?.className.includes("bg-primary") ||
          btn.className.includes("session") ||
          btn.className.includes("bg-primary")
        )
      }) ||
      dayButtons.find(
        (btn) =>
          !btn.hasAttribute("disabled") && !btn.className.includes("outside")
      )
    expect(sessionDay).toBeDefined()

    if (sessionDay) {
      const dayText = sessionDay.textContent?.trim()
      fireEvent.click(sessionDay)
      expect(badge.textContent).not.toEqual(initialText)

      // Re-query the re-rendered button
      const reRenderedDay = screen
        .getAllByRole("button")
        .find((b) => b.textContent?.trim() === dayText)
      if (reRenderedDay) {
        fireEvent.click(reRenderedDay)
        expect(badge.textContent).toEqual(initialText)
      }
    }
  })

  it("should save toggled session dates to onConfirm and preserve them when passed to initialSessionDates", () => {
    let capturedSessionDates: string[] = []
    const handleConfirm = vi.fn((data) => {
      capturedSessionDates = data.sessionDates
    })

    const { unmount } = render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        initialDaysOfWeek={["SATURDAY"]}
        onConfirm={handleConfirm}
      />
    )

    const badge = screen.getByText(/جلسه در طول ترم/i)
    const initialText = badge.textContent

    const dayButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.classList.contains("rdp-day_button") ||
        /^[۰-۹0-9]+$/.test(btn.textContent?.trim() || "")
      )
    })
    const sessionDay =
      dayButtons.find((btn) => {
        const td = btn.closest("td")
        return (
          td?.className.includes("session") ||
          td?.className.includes("bg-primary") ||
          btn.className.includes("session") ||
          btn.className.includes("bg-primary")
        )
      }) ||
      dayButtons.find(
        (btn) =>
          !btn.hasAttribute("disabled") && !btn.className.includes("outside")
      )
    expect(sessionDay).toBeDefined()

    if (sessionDay) {
      fireEvent.click(sessionDay)
    }
    expect(badge.textContent).not.toEqual(initialText)

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)
    expect(handleConfirm).toHaveBeenCalled()
    expect(capturedSessionDates.length).toBeGreaterThan(0)

    unmount()

    render(
      <ClassScheduleWizard
        open={true}
        onClose={vi.fn()}
        term={mockTerm}
        initialDaysOfWeek={["SATURDAY"]}
        initialSessionDates={capturedSessionDates}
        onConfirm={vi.fn()}
      />
    )

    const reOpenedBadge = screen.getByText(/جلسه در طول ترم/i)
    expect(reOpenedBadge.textContent).toContain(
      String(capturedSessionDates.length)
    )
  })
})

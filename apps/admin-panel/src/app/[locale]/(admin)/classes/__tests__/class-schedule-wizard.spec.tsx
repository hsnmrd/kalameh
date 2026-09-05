import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { ClassScheduleWizard } from "../components/class-schedule-wizard"
import { classesResource } from "@/lib/api"
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

  it("should call conflict service on confirm and show warning styling on conflicting days when conflict exists", async () => {
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    const mutateAsyncMock = vi.fn().mockResolvedValue({
      hasConflict: true,
      conflictingDates: ["2026-09-26"],
      conflicts: [
        {
          type: "CLASSROOM",
          conflictingClassTitle: "Old Class 101",
          message: "کلاس درس/اتاق انتخابی با کلاس Old Class 101 تداخل دارد",
          conflictingDates: ["2026-09-26"],
        },
      ],
    })

    vi.spyOn(classesResource.checkConflicts, "toMutation").mockReturnValue({
      mutationFn: mutateAsyncMock,
    } as any)

    render(
      <ClassScheduleWizard
        open={true}
        onClose={handleClose}
        term={mockTerm}
        classroomId="room-1"
        initialDaysOfWeek={["SATURDAY"]}
        initialStartTime="17:00"
        initialEndTime="18:30"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled()
      expect(mutateAsyncMock.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          termId: "term-1",
          classroomId: "room-1",
          startTime: "17:00",
          endTime: "18:30",
        })
      )
    })

    // onConfirm should NOT have been called due to conflict
    expect(handleConfirm).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    // Conflict banner, class title, type badge, and warning badge should appear
    await waitFor(() => {
      expect(screen.getByText("Old Class 101")).toBeInTheDocument()
      expect(screen.getByText(/تداخل فضای آموزشی/i)).toBeInTheDocument()
      expect(screen.getAllByText(/روز تداخل/i).length).toBeGreaterThan(0)
    })
  })

  it("should confirm and close when conflict service returns no conflicts", async () => {
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    const mutateAsyncMock = vi.fn().mockResolvedValue({
      hasConflict: false,
      conflictingDates: [],
      conflicts: [],
    })

    vi.spyOn(classesResource.checkConflicts, "toMutation").mockReturnValue({
      mutationFn: mutateAsyncMock,
    } as any)

    render(
      <ClassScheduleWizard
        open={true}
        onClose={handleClose}
        term={mockTerm}
        classroomId="room-1"
        initialDaysOfWeek={["SATURDAY"]}
        initialStartTime="17:00"
        initialEndTime="18:30"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled()
      expect(handleConfirm).toHaveBeenCalled()
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it("should display rich conflict details including teacher name, classroom name, and time range when conflict detected", async () => {
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    const mutateAsyncMock = vi.fn().mockResolvedValue({
      hasConflict: true,
      conflictingDates: ["2026-09-26", "2026-09-28"],
      conflicts: [
        {
          type: "TEACHER",
          conflictingClassTitle: "گروه خانوادگی",
          message: 'تداخل زمانی استاد با کلاس "گروه خانوادگی"',
          teacherName: "خانم مرادنژاد",
          classroomName: "کلاس ۱۰۱",
          startTime: "17:00",
          endTime: "18:30",
          conflictingDates: ["2026-09-26", "2026-09-28"],
        },
      ],
    })

    vi.spyOn(classesResource.checkConflicts, "toMutation").mockReturnValue({
      mutationFn: mutateAsyncMock,
    } as any)

    render(
      <ClassScheduleWizard
        open={true}
        onClose={handleClose}
        term={mockTerm}
        teacherName="خانم مرادنژاد"
        initialDaysOfWeek={["SATURDAY", "MONDAY"]}
        initialStartTime="17:00"
        initialEndTime="18:30"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText("گروه خانوادگی")).toBeInTheDocument()
      expect(screen.getByText(/تداخل برنامه استاد/i)).toBeInTheDocument()
      expect(screen.getByText(/خانم مرادنژاد/i)).toBeInTheDocument()
      expect(screen.getByText(/کلاس ۱۰۱/i)).toBeInTheDocument()
      expect(screen.getByText(/17:00 - 18:30/)).toBeInTheDocument()
    })
  })

  it("should only display classroom conflict if both classroom and teacher conflict exist for the same class", async () => {
    const handleConfirm = vi.fn()
    const handleClose = vi.fn()

    const mutateAsyncMock = vi.fn().mockResolvedValue({
      hasConflict: true,
      conflictingDates: ["2026-09-26"],
      conflicts: [
        {
          type: "CLASSROOM",
          conflictingClassTitle: "گروه خانوادگی",
          message: 'تداخل زمانی در کلاس درس با کلاس "گروه خانوادگی"',
          teacherName: "خانم مرادنژاد",
          classroomName: "کلاس ۱۰۱",
          startTime: "17:00",
          endTime: "18:30",
          conflictingDates: ["2026-09-26"],
        },
        {
          type: "TEACHER",
          conflictingClassTitle: "گروه خانوادگی",
          message: 'تداخل زمانی استاد با کلاس "گروه خانوادگی"',
          teacherName: "خانم مرادنژاد",
          classroomName: "کلاس ۱۰۱",
          startTime: "17:00",
          endTime: "18:30",
          conflictingDates: ["2026-09-26"],
        },
      ],
    })

    vi.spyOn(classesResource.checkConflicts, "toMutation").mockReturnValue({
      mutationFn: mutateAsyncMock,
    } as any)

    render(
      <ClassScheduleWizard
        open={true}
        onClose={handleClose}
        term={mockTerm}
        classroomId="room-1"
        teacherName="خانم مرادنژاد"
        initialDaysOfWeek={["SATURDAY"]}
        initialStartTime="17:00"
        initialEndTime="18:30"
        onConfirm={handleConfirm}
      />
    )

    const confirmBtn = screen.getByRole("button", {
      name: /تأیید و اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText("گروه خانوادگی")).toBeInTheDocument()
      expect(screen.getByText(/تداخل فضای آموزشی/i)).toBeInTheDocument()
      expect(screen.queryByText(/تداخل برنامه استاد/i)).not.toBeInTheDocument()
    })
  })
})

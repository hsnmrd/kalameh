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

describe("ClassScheduleWizard conflicts", () => {
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
      name: /اعمال برنامه/i,
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
      name: /اعمال برنامه/i,
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
      name: /اعمال برنامه/i,
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
      name: /اعمال برنامه/i,
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText("گروه خانوادگی")).toBeInTheDocument()
      expect(screen.getByText(/تداخل فضای آموزشی/i)).toBeInTheDocument()
      expect(screen.queryByText(/تداخل برنامه استاد/i)).not.toBeInTheDocument()
    })
  })
})

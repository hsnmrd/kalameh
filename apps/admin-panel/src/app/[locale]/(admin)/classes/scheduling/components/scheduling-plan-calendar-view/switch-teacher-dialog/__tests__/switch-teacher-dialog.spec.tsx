import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@/test/test-utils"
import type {
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
} from "@workspace/types"
import { SwitchTeacherDialog } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const mockProposal: Proposal = {
  id: "prop-main",
  planId: "plan-1",
  instituteId: "inst-1",
  title: "AME 2-3",
  course: { id: "c-ame-2-3", title: "American English File 2-3" },
  teacher: { id: "t-current", firstName: "سارا", lastName: "احمدی" },
  branch: { id: "b1", name: "شعبه مرکزی" },
  classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 16 },
  capacity: 12,
  daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  startTime: "14:00",
  endTime: "15:30",
  deliveryMode: "IN_PERSON",
  isLocked: false,
  isManuallyEdited: false,
  warnings: [],
  scoreBreakdown: [],
}

const mockOccupyingProposal: Proposal = {
  id: "prop-other",
  planId: "plan-1",
  instituteId: "inst-1",
  title: "Touchstone 1",
  course: { id: "c-ts-1", title: "Touchstone 1" },
  teacher: { id: "t-swappable", firstName: "رضا", lastName: "محمدی" },
  branch: { id: "b1", name: "شعبه مرکزی" },
  classroom: { id: "cr2", name: "کلاس ۱۰۲", capacity: 16 },
  capacity: 10,
  daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  startTime: "14:00",
  endTime: "15:30",
  deliveryMode: "IN_PERSON",
  isLocked: false,
  isManuallyEdited: false,
  warnings: [],
  scoreBreakdown: [],
}

const mockTeacherCalendars: SchedulingTeacherCalendar[] = [
  {
    teacher: { id: "t-current", firstName: "سارا", lastName: "احمدی" },
    teachableCourses: [
      { id: "c-ame-2-3", title: "American English File 2-3" },
      { id: "c-ts-1", title: "Touchstone 1" },
    ],
    slots: [
      {
        dayOfWeek: "SATURDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "AME 2-3",
        source: "PLAN",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "AME 2-3",
        source: "PLAN",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "AME 2-3",
        source: "PLAN",
      },
    ],
  },
  {
    teacher: { id: "t-swappable", firstName: "رضا", lastName: "محمدی" },
    teachableCourses: [{ id: "c-ame-2-3", title: "American English File 2-3" }],
    slots: [
      {
        dayOfWeek: "SATURDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "Touchstone 1",
        source: "PLAN",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "Touchstone 1",
        source: "PLAN",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "BUSY",
        title: "Touchstone 1",
        source: "PLAN",
      },
    ],
  },
  {
    teacher: { id: "t-free", firstName: "علی", lastName: "حسینی" },
    teachableCourses: [{ id: "c-ame-2-3", title: "American English File 2-3" }],
    slots: [
      {
        dayOfWeek: "SATURDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "FREE",
        title: null,
        source: "AVAILABILITY",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "FREE",
        title: null,
        source: "AVAILABILITY",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "14:00",
        endTime: "15:30",
        status: "FREE",
        title: null,
        source: "AVAILABILITY",
      },
    ],
  },
  {
    // Teacher who is NOT available in this period and NOT teaching in this period
    teacher: { id: "t-absent", firstName: "مریم", lastName: "نادری" },
    teachableCourses: [{ id: "c-ame-2-3", title: "American English File 2-3" }],
    slots: [
      {
        dayOfWeek: "SUNDAY",
        startTime: "10:00",
        endTime: "12:00",
        status: "FREE",
        title: null,
        source: "AVAILABILITY",
      },
    ],
  },
]

describe("SwitchTeacherDialog Component", () => {
  it("does not render when open is false", () => {
    render(
      <SwitchTeacherDialog
        open={false}
        onOpenChange={vi.fn()}
        proposal={mockProposal}
        teacherCalendars={mockTeacherCalendars}
        proposals={[mockProposal, mockOccupyingProposal]}
        onSwitchTeacher={vi.fn()}
      />
    )

    expect(
      screen.queryByTestId("switch-teacher-dialog")
    ).not.toBeInTheDocument()
  })

  it("renders only teachers present in this specific period (Current, Swappable, and Free; excluding Absent)", () => {
    render(
      <SwitchTeacherDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={mockProposal}
        teacherCalendars={mockTeacherCalendars}
        proposals={[mockProposal, mockOccupyingProposal]}
        onSwitchTeacher={vi.fn()}
      />
    )

    expect(screen.getByTestId("switch-teacher-dialog")).toBeInTheDocument()

    // Current teacher is rendered
    expect(screen.getByTestId("teacher-item-t-current")).toBeInTheDocument()
    expect(screen.getAllByText("استاد فعلی").length).toBeGreaterThanOrEqual(1)

    // Swappable teacher (teaching Touchstone 1 in this period) is rendered
    expect(screen.getByTestId("teacher-item-t-swappable")).toBeInTheDocument()
    expect(screen.getByText("قابل جابه‌جایی")).toBeInTheDocument()
    expect(screen.getByText(/در حال تدریس Touchstone 1/)).toBeInTheDocument()

    // Free teacher (has free slot in this period) is rendered
    expect(screen.getByTestId("teacher-item-t-free")).toBeInTheDocument()
    expect(screen.getByText("استاد آزاد")).toBeInTheDocument()

    // Absent teacher (NOT present in this period) is EXCLUDED completely
    expect(
      screen.queryByTestId("teacher-item-t-absent")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("مریم نادری")).not.toBeInTheDocument()
  })

  it("calls onSwitchTeacher when selecting a free teacher", async () => {
    const onSwitchTeacherMock = vi.fn().mockResolvedValue(undefined)
    const onOpenChangeMock = vi.fn()

    render(
      <SwitchTeacherDialog
        open={true}
        onOpenChange={onOpenChangeMock}
        proposal={mockProposal}
        teacherCalendars={mockTeacherCalendars}
        proposals={[mockProposal, mockOccupyingProposal]}
        onSwitchTeacher={onSwitchTeacherMock}
      />
    )

    const freeBtn = screen.getByTestId("switch-teacher-btn-t-free")
    fireEvent.click(freeBtn)

    await waitFor(() => {
      expect(onSwitchTeacherMock).toHaveBeenCalledWith(
        mockProposal,
        "t-free",
        undefined
      )
      expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    })
  })

  it("calls onSwitchTeacher with occupyingProposal when swapping with another teacher in this period", async () => {
    const onSwitchTeacherMock = vi.fn().mockResolvedValue(undefined)
    const onOpenChangeMock = vi.fn()

    render(
      <SwitchTeacherDialog
        open={true}
        onOpenChange={onOpenChangeMock}
        proposal={mockProposal}
        teacherCalendars={mockTeacherCalendars}
        proposals={[mockProposal, mockOccupyingProposal]}
        onSwitchTeacher={onSwitchTeacherMock}
      />
    )

    const swapBtn = screen.getByTestId("switch-teacher-btn-t-swappable")
    fireEvent.click(swapBtn)

    await waitFor(() => {
      expect(onSwitchTeacherMock).toHaveBeenCalledWith(
        mockProposal,
        "t-swappable",
        mockOccupyingProposal
      )
      expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    })
  })

  it("renders empty state notice when no teachers are present in this period", () => {
    const proposalWithoutAnyTeachers: Proposal = {
      ...mockProposal,
      id: "prop-unassigned",
      teacherId: null,
      teacher: null,
      daysOfWeek: ["FRIDAY"],
      startTime: "06:00",
      endTime: "07:30",
    }

    render(
      <SwitchTeacherDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={proposalWithoutAnyTeachers}
        teacherCalendars={mockTeacherCalendars}
        proposals={[proposalWithoutAnyTeachers]}
        onSwitchTeacher={vi.fn()}
      />
    )

    expect(
      screen.getByText("هیچ استادی در این بازه زمانی در دسترس نیست.")
    ).toBeInTheDocument()
  })

  it("disables swapping and displays reason when current teacher cannot teach the other proposal's course (e.g. AME 2-2 vs AME 4-2)", () => {
    const ame2Proposal: Proposal = {
      ...mockProposal,
      id: "prop-ame-2-2",
      title: "AME 2-2",
      course: { id: "c-ame-2-2", title: "AME 2-2" },
      teacher: { id: "t-bahareh", firstName: "بهاره", lastName: "خانی" },
    }

    const ame4Proposal: Proposal = {
      ...mockOccupyingProposal,
      id: "prop-ame-4-2",
      title: "AME 4-2",
      course: { id: "c-ame-4-2", title: "AME 4-2" },
      teacher: { id: "t-yasaman", firstName: "یاسمن", lastName: "زمانی" },
    }

    const calendars: SchedulingTeacherCalendar[] = [
      {
        teacher: { id: "t-bahareh", firstName: "بهاره", lastName: "خانی" },
        // Bahareh only teaches AME 2-2 (cannot teach AME 4-2)
        teachableCourses: [{ id: "c-ame-2-2", title: "AME 2-2" }],
        slots: [
          {
            dayOfWeek: "SATURDAY",
            startTime: "14:00",
            endTime: "15:30",
            status: "BUSY",
            title: "AME 2-2",
            source: "PLAN",
          },
        ],
      },
      {
        teacher: { id: "t-yasaman", firstName: "یاسمن", lastName: "زمانی" },
        // Yasaman teaches AME 4-2 (can teach AME 2-2 as higher level)
        teachableCourses: [{ id: "c-ame-4-2", title: "AME 4-2" }],
        slots: [
          {
            dayOfWeek: "SATURDAY",
            startTime: "14:00",
            endTime: "15:30",
            status: "BUSY",
            title: "AME 4-2",
            source: "PLAN",
          },
        ],
      },
    ]

    const onSwitchTeacherMock = vi.fn()

    render(
      <SwitchTeacherDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={ame2Proposal}
        teacherCalendars={calendars}
        proposals={[ame2Proposal, ame4Proposal]}
        onSwitchTeacher={onSwitchTeacherMock}
      />
    )

    // Yasaman is shown as teaching AME 4-2
    const yasamanItem = screen.getByTestId("teacher-item-t-yasaman")
    expect(yasamanItem).toBeInTheDocument()

    // Does NOT show "قابل جابه‌جایی" badge
    expect(screen.queryByText("قابل جابه‌جایی")).not.toBeInTheDocument()

    // Shows "در حال تدریس" badge
    expect(screen.getByText("در حال تدریس")).toBeInTheDocument()

    // Shows explanatory reason why Bahareh cannot take AME 4-2
    expect(
      screen.getByText(
        /استاد فعلی \(بهاره خانی\) صلاحیت تدریس دوره «AME 4-2» را ندارد/
      )
    ).toBeInTheDocument()

    // Swap button is disabled
    const swapBtn = screen.getByTestId("switch-teacher-btn-t-yasaman")
    expect(swapBtn).toBeDisabled()

    // Clicking does not call onSwitchTeacher
    fireEvent.click(swapBtn)
    expect(onSwitchTeacherMock).not.toHaveBeenCalled()
  })
})

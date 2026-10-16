import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  CourseLevelNode,
  SchedulingBranchScheduleStatus,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import { OtherBranchesMastersSection } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return Object.entries(values).reduce(
        (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
        key
      )
    }
    return key
  },
  useLocale: () => "fa",
}))

describe("OtherBranchesMastersSection Component", () => {
  const targetCourse: CourseLevelNode = {
    id: "c-ame-1-1",
    title: "AME 1-1",
  }
  const daysOfWeek: WeekDay[] = ["SATURDAY", "MONDAY", "WEDNESDAY"]
  const startTime = "15:00"
  const endTime = "16:30"

  const mockProposal: Proposal = {
    id: "prop-1",
    planId: "plan-1",
    instituteId: "inst-1",
    title: "AME 1-1",
    course: targetCourse,
    teacher: null,
    teacherId: null,
    branch: { id: "branch-central", name: "شعبه مرکزی" },
    classroom: { id: "cr-1", name: "Room 101", capacity: 20 },
    capacity: 15,
    daysOfWeek,
    startTime,
    endTime,
    deliveryMode: "IN_PERSON",
    isLocked: false,
    isManuallyEdited: false,
    warnings: [],
    scoreBreakdown: [],
  }

  const otherBranchCalendars: SchedulingTeacherCalendar[] = [
    {
      teacher: {
        id: "t-elham",
        firstName: "الهام",
        lastName: "جلالی",
        avatarUrl: null,
        branchId: "branch-west",
        branch: { id: "branch-west", name: "شعبه غرب (سعادت‌آباد)" },
      },
      teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
      slots: [
        {
          id: "s1",
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-west",
          branchName: "شعبه غرب (سعادت‌آباد)",
        },
        {
          id: "s2",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-west",
          branchName: "شعبه غرب (سعادت‌آباد)",
        },
        {
          id: "s3",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-west",
          branchName: "شعبه غرب (سعادت‌آباد)",
        },
      ],
    },
    {
      teacher: {
        id: "t-local",
        firstName: "علی",
        lastName: "کریمی",
        avatarUrl: null,
        branchId: "branch-central",
        branch: { id: "branch-central", name: "شعبه مرکزی" },
      },
      teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
      slots: [
        {
          id: "s4",
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-central",
          branchName: "شعبه مرکزی",
        },
        {
          id: "s5",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-central",
          branchName: "شعبه مرکزی",
        },
        {
          id: "s6",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
          branchId: "branch-central",
          branchName: "شعبه مرکزی",
        },
      ],
    },
  ]

  it("returns null when no other branch masters are free", () => {
    const { container } = render(
      <OtherBranchesMastersSection
        proposal={mockProposal}
        targetCourse={targetCourse}
        daysOfWeek={daysOfWeek}
        startTime={startTime}
        endTime={endTime}
        teacherCalendars={[]}
        allProposals={[]}
        targetBranchId="branch-central"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders other branch masters grouped by branch with scheduled status badge and allows assignment", async () => {
    const onAssignTeacher = vi.fn().mockResolvedValue(undefined)
    const branchScheduleStatuses: SchedulingBranchScheduleStatus[] = [
      {
        branchId: "branch-west",
        branchName: "شعبه غرب (سعادت‌آباد)",
        hasDefinedSchedule: true,
        status: "SCHEDULED",
      },
    ]

    render(
      <OtherBranchesMastersSection
        proposal={mockProposal}
        targetCourse={targetCourse}
        daysOfWeek={daysOfWeek}
        startTime={startTime}
        endTime={endTime}
        teacherCalendars={otherBranchCalendars}
        allProposals={[]}
        targetBranchId="branch-central"
        branchScheduleStatuses={branchScheduleStatuses}
        onAssignTeacher={onAssignTeacher}
      />
    )

    // Section header is rendered
    expect(
      screen.getByTestId("other-branches-masters-section")
    ).toBeInTheDocument()

    // Branch group for West branch is rendered
    expect(
      screen.getByTestId("other-branch-group-branch-west")
    ).toBeInTheDocument()
    expect(screen.getByText("شعبه غرب (سعادت‌آباد)")).toBeInTheDocument()

    // Status badge: Schedule Defined
    expect(
      screen.getByText("staffingFallback.otherBranchScheduledBadge")
    ).toBeInTheDocument()
    // Safe notice: branch schedule is defined so teacher is surplus
    expect(
      screen.getByText("staffingFallback.otherBranchSafeNotice")
    ).toBeInTheDocument()

    // Teacher card for Elham Jalali from west branch is displayed
    expect(screen.getByTestId("free-master-item-t-elham")).toBeInTheDocument()
    // Local teacher Ali Karimi is NOT shown in this other-branches section
    expect(
      screen.queryByTestId("free-master-item-t-local")
    ).not.toBeInTheDocument()

    // Assign button is clickable and triggers onAssignTeacher
    const assignBtn = screen.getByTestId("assign-free-master-btn-t-elham")
    expect(assignBtn).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(assignBtn)
    })

    expect(onAssignTeacher).toHaveBeenCalledWith(mockProposal, "t-elham")
  })

  it("shows not-scheduled warning badge when other branch has not defined its schedule", () => {
    const branchScheduleStatuses: SchedulingBranchScheduleStatus[] = [
      {
        branchId: "branch-west",
        branchName: "شعبه غرب (سعادت‌آباد)",
        hasDefinedSchedule: false,
        status: "NOT_SCHEDULED",
      },
    ]

    render(
      <OtherBranchesMastersSection
        proposal={mockProposal}
        targetCourse={targetCourse}
        daysOfWeek={daysOfWeek}
        startTime={startTime}
        endTime={endTime}
        teacherCalendars={otherBranchCalendars}
        allProposals={[]}
        targetBranchId="branch-central"
        branchScheduleStatuses={branchScheduleStatuses}
      />
    )

    // Status badge: Schedule Not Defined
    expect(
      screen.getByText("staffingFallback.otherBranchNotScheduledBadge")
    ).toBeInTheDocument()
    // Unsafe notice: branch has not scheduled yet and may need teacher
    expect(
      screen.getByText("staffingFallback.otherBranchUnsafeNotice")
    ).toBeInTheDocument()
  })
})

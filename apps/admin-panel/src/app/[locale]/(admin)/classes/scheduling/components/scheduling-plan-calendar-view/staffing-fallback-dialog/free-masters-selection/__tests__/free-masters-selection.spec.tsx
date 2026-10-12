import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type {
  CourseLevelNode,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import { FreeMastersSelection } from "../index"

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

describe("FreeMastersSelection Component", () => {
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
    branch: { id: "b1", name: "Main" },
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

  const teacherCalendars: SchedulingTeacherCalendar[] = [
    {
      teacher: {
        id: "t-melika",
        firstName: "ملیکا",
        lastName: "سعیدی",
        avatarUrl: null,
      },
      teachableCourses: [
        { id: "c-ame-1-2", title: "AME 1-2" },
        { id: "c-ame-2-3", title: "AME 2-3" },
      ],
      slots: [
        {
          id: "s1",
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s2",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s3",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
      ],
    },
    {
      teacher: {
        id: "t-direct",
        firstName: "سارا",
        lastName: "محمدی",
        avatarUrl: null,
      },
      teachableCourses: [{ id: "c-ame-1-1", title: "AME 1-1" }],
      slots: [
        {
          id: "s4",
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s5",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s6",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
      ],
    },
    {
      teacher: {
        id: "t-unrelated",
        firstName: "رضا",
        lastName: "حسینی",
        avatarUrl: null,
      },
      teachableCourses: [{ id: "c-french", title: "French 1" }],
      slots: [
        {
          id: "s7",
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s8",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
        {
          id: "s9",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:00",
          endTime: "18:00",
          status: "FREE",
        },
      ],
    },
  ]

  it("renders free masters with level comparison badge and allows assigning qualified masters", async () => {
    const onAssignTeacher = vi.fn().mockResolvedValue(undefined)

    render(
      <FreeMastersSelection
        proposal={mockProposal}
        targetCourse={targetCourse}
        daysOfWeek={daysOfWeek}
        startTime={startTime}
        endTime={endTime}
        teacherCalendars={teacherCalendars}
        allProposals={[mockProposal]}
        onAssignTeacher={onAssignTeacher}
      />
    )

    // 1. Shows free masters section
    expect(screen.getByTestId("free-masters-selection")).toBeInTheDocument()

    // 2. Direct match teacher (Sara Mohammadi) is present, qualified, and direct match
    const saraItem = screen.getByTestId("free-master-item-t-direct")
    expect(saraItem).toHaveAttribute("data-qualified", "true")
    expect(saraItem).toHaveAttribute("data-level-status", "DIRECT_MATCH")

    // 3. Higher level teacher (Melika Saeedi) is present, qualified, and HIGHER_LEVEL
    const melikaItem = screen.getByTestId("free-master-item-t-melika")
    expect(melikaItem).toHaveAttribute("data-qualified", "true")
    expect(melikaItem).toHaveAttribute("data-level-status", "HIGHER_LEVEL")

    // 4. Unrelated teacher (Reza Hosseini) is present but marked as UNRELATED
    const rezaItem = screen.getByTestId("free-master-item-t-unrelated")
    expect(rezaItem).toHaveAttribute("data-qualified", "false")
    expect(rezaItem).toHaveAttribute("data-level-status", "UNRELATED")

    // 5. Unrelated teacher's assign button is disabled
    const rezaBtn = screen.getByTestId("assign-free-master-btn-t-unrelated")
    expect(rezaBtn).toBeDisabled()

    // 6. Melika Saeedi's assign button is enabled; clicking it triggers onAssignTeacher
    const melikaBtn = screen.getByTestId("assign-free-master-btn-t-melika")
    expect(melikaBtn).not.toBeDisabled()
    await act(async () => {
      fireEvent.click(melikaBtn)
    })

    expect(onAssignTeacher).toHaveBeenCalledWith(mockProposal, "t-melika")
  })

  it("shows empty state when no teachers are free in the slot", () => {
    render(
      <FreeMastersSelection
        proposal={mockProposal}
        targetCourse={targetCourse}
        daysOfWeek={daysOfWeek}
        startTime={startTime}
        endTime={endTime}
        teacherCalendars={[]}
        allProposals={[mockProposal]}
      />
    )

    expect(
      screen.getByText("staffingFallback.noFreeMastersDescription")
    ).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { SchedulingPlanCalendarClassCard } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

describe("SchedulingPlanCalendarClassCard Component", () => {
  const baseProposal: Proposal = {
    id: "prop-1",
    planId: "plan-1",
    instituteId: "inst-1",
    title: "کلاس سطح A1",
    course: { id: "c1", title: "American English File 1" },
    teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
    teacherId: "t1",
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "cr1", name: "کلاس ۱۰۱", capacity: 20 },
    classroomId: "cr1",
    capacity: 15,
    daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    startTime: "09:00",
    endTime: "10:30",
    deliveryMode: "IN_PERSON",
    isLocked: false,
    isManuallyEdited: false,
    warnings: [],
    scoreBreakdown: [],
  }

  it("renders with standard solid border and teacher name when teacher is assigned", () => {
    render(
      <SchedulingPlanCalendarClassCard proposal={baseProposal} canEdit={true} />
    )

    const card = screen.getByTestId("calendar-class-card-prop-1")
    expect(card).toBeInTheDocument()
    expect(card).not.toHaveAttribute("data-has-no-teacher")
    expect(card).toHaveClass("border-s-4")
    expect(card).toHaveTextContent("علی محمدی")
    const roomBadge = screen.getByTestId("calendar-class-room-badge-prop-1")
    expect(roomBadge).not.toHaveTextContent("کلاس ۱۰۱")
    expect(roomBadge).toHaveAttribute("title", "کلاس ۱۰۱")
  })

  it("renders with orange theme and dashed border when session has no master", () => {
    const unassignedProposal: Proposal = {
      ...baseProposal,
      teacher: null,
      teacherId: null,
    }

    render(
      <SchedulingPlanCalendarClassCard
        proposal={unassignedProposal}
        canEdit={true}
      />
    )

    const card = screen.getByTestId("calendar-class-card-prop-1")
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute("data-has-no-teacher", "true")
    expect(card).toHaveClass("border-2")
    expect(card).toHaveClass("border-dashed")
    expect(card).toHaveClass("border-warning/70")
    expect(card).toHaveClass("bg-warning/10")
    expect(card).toHaveTextContent("استاد جدید")

    const roomBadge = screen.getByTestId("calendar-class-room-badge-prop-1")
    expect(roomBadge).toHaveClass("bg-warning/20")
    expect(roomBadge).toHaveClass("text-warning-foreground")
  })

  it("applies active warning styling when session without master is active", () => {
    const unassignedProposal: Proposal = {
      ...baseProposal,
      teacher: null,
      teacherId: null,
    }

    render(
      <SchedulingPlanCalendarClassCard
        proposal={unassignedProposal}
        canEdit={true}
        isActive={true}
      />
    )

    const card = screen.getByTestId("calendar-class-card-prop-1")
    expect(card).toHaveClass("border-warning")
    expect(card).toHaveClass("bg-warning/25")
    expect(card).toHaveClass("ring-warning")
  })

  it("allows clicking swap button and room badge on sessions without master", () => {
    const handleSwapClick = vi.fn()
    const handleRoomClick = vi.fn()
    const unassignedProposal: Proposal = {
      ...baseProposal,
      teacher: null,
      teacherId: null,
    }

    render(
      <SchedulingPlanCalendarClassCard
        proposal={unassignedProposal}
        canEdit={true}
        canSwap={true}
        onSwapClick={handleSwapClick}
        onRoomClick={handleRoomClick}
      />
    )

    const swapBtn = screen.getByTestId("swap-teacher-btn-prop-1")
    fireEvent.click(swapBtn)
    expect(handleSwapClick).toHaveBeenCalledWith("prop-1")

    const roomBadge = screen.getByTestId("calendar-class-room-badge-prop-1")
    fireEvent.click(roomBadge)
    expect(handleRoomClick).toHaveBeenCalledWith(unassignedProposal)
  })

  it("allows clicking teacher info to trigger onTeacherClick", () => {
    const handleTeacherClick = vi.fn()

    render(
      <SchedulingPlanCalendarClassCard
        proposal={baseProposal}
        canEdit={true}
        onTeacherClick={handleTeacherClick}
      />
    )

    const teacherInfo = screen.getByTestId("calendar-class-teacher-info-prop-1")
    fireEvent.click(teacherInfo)
    expect(handleTeacherClick).toHaveBeenCalledWith(baseProposal)
  })
})

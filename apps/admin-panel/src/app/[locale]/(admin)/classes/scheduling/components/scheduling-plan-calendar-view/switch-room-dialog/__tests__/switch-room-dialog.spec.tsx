import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { SwitchRoomDialog, type ClassroomOption } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

describe("SwitchRoomDialog", () => {
  const mockClassrooms: ClassroomOption[] = [
    { id: "room-1", name: "کلاس ۱۰۱", capacity: 15 },
    { id: "room-2", name: "کلاس ۱۰۲", capacity: 20 },
    { id: "room-3", name: "کلاس ۱۰۳", capacity: 10 },
  ]

  const baseProposal: Proposal = {
    id: "prop-main",
    planId: "plan-1",
    instituteId: "inst-1",
    title: "کلاس صبح A1",
    course: { id: "c1", title: "American English File 1" },
    teacher: { id: "t1", firstName: "علی", lastName: "محمدی" },
    branch: { id: "b1", name: "شعبه مرکزی" },
    classroom: { id: "room-1", name: "کلاس ۱۰۱", capacity: 15 },
    classroomId: "room-1",
    capacity: 12, // 12 enrolled students
    daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    startTime: "09:00",
    endTime: "10:30",
    deliveryMode: "IN_PERSON",
    isLocked: false,
    isManuallyEdited: false,
    warnings: [],
  }

  it("renders classrooms and shows free status for unoccupied rooms", () => {
    const onSwitchRoom = vi.fn()
    render(
      <SwitchRoomDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={baseProposal}
        classrooms={mockClassrooms}
        proposals={[baseProposal]}
        onSwitchRoom={onSwitchRoom}
      />
    )

    // Current room badge
    expect(screen.getAllByText("کلاس ۱۰۱").length).toBeGreaterThan(0)
    expect(screen.getByText("کلاس فعلی")).toBeInTheDocument()

    // Free room 102
    expect(screen.getByText("کلاس ۱۰۲")).toBeInTheDocument()
    expect(screen.getAllByText("آزاد (خالی)").length).toBeGreaterThan(0)

    // Click free room calls onSwitchRoom without swapProposal
    const room102Btn = screen.getByTestId("switch-room-btn-room-2")
    fireEvent.click(room102Btn)
    expect(onSwitchRoom).toHaveBeenCalledWith(baseProposal, "room-2", undefined)
  })

  it("allows swapping with occupied room when capacities match both directions", () => {
    const occupiedProposal: Proposal = {
      ...baseProposal,
      id: "prop-occupying",
      title: "کلاس موازی B1",
      classroom: { id: "room-2", name: "کلاس ۱۰۲", capacity: 20 },
      classroomId: "room-2",
      capacity: 14, // 14 students fits in room-1 (cap 15), and main (12) fits in room-2 (cap 20)
    }

    const onSwitchRoom = vi.fn()
    render(
      <SwitchRoomDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={baseProposal}
        classrooms={mockClassrooms}
        proposals={[baseProposal, occupiedProposal]}
        onSwitchRoom={onSwitchRoom}
      />
    )

    const room102Btn = screen.getByTestId("switch-room-btn-room-2")
    expect(room102Btn).not.toBeDisabled()
    expect(screen.getByText("قابل جابه‌جایی")).toBeInTheDocument()

    fireEvent.click(room102Btn)
    expect(onSwitchRoom).toHaveBeenCalledWith(
      baseProposal,
      "room-2",
      occupiedProposal
    )
  })

  it("disables occupied room when occupying class students exceed current room capacity", () => {
    const bigClassProposal: Proposal = {
      ...baseProposal,
      id: "prop-big",
      title: "کلاس پرجمعیت C1",
      classroom: { id: "room-2", name: "کلاس ۱۰۲", capacity: 20 },
      classroomId: "room-2",
      capacity: 18, // 18 students cannot fit in room-1 (cap 15)
    }

    render(
      <SwitchRoomDialog
        open={true}
        onOpenChange={vi.fn()}
        proposal={baseProposal}
        classrooms={mockClassrooms}
        proposals={[baseProposal, bigClassProposal]}
        onSwitchRoom={vi.fn()}
      />
    )

    const room102Btn = screen.getByTestId("switch-room-btn-room-2")
    expect(room102Btn).toBeDisabled()
    expect(
      screen.getByText("ظرفیت کلاس فعلی برای زبان‌آموزان این جلسه کافی نیست")
    ).toBeInTheDocument()
  })
})

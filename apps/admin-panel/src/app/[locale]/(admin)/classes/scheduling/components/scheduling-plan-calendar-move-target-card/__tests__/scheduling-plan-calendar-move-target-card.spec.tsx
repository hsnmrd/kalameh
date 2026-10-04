import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import {
  SchedulingPlanCalendarMoveTargetCard,
  type TargetRoomInfo,
} from "../index"

describe("SchedulingPlanCalendarMoveTargetCard Component", () => {
  const defaultRoom: TargetRoomInfo = {
    id: "room-b",
    name: "کلاس ۱۰۲",
    capacity: 25,
    branchId: "branch-1",
  }

  it("renders move action label, room name and formatted capacity when targetRoom is provided", () => {
    const handleClick = vi.fn()
    render(
      <SchedulingPlanCalendarMoveTargetCard
        track="EVEN"
        slotKey="09:00-10:30"
        startTime="09:00"
        endTime="10:30"
        targetDays={["SATURDAY", "MONDAY", "WEDNESDAY"]}
        targetRoom={defaultRoom}
        onClick={handleClick}
      />
    )

    expect(screen.getByText("انتقال به این زمان")).toBeInTheDocument()
    expect(screen.getByText("کلاس ۱۰۲")).toBeInTheDocument()
    expect(screen.getByText(/ظرفیت اتاق: ۲۵ نفر/)).toBeInTheDocument()
  })

  it("renders without room badge and capacity when targetRoom is null", () => {
    render(
      <SchedulingPlanCalendarMoveTargetCard
        track="ODD"
        slotKey="14:00-15:30"
        startTime="14:00"
        endTime="15:30"
        targetDays={["SUNDAY", "TUESDAY", "THURSDAY"]}
        targetRoom={null}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText("انتقال به این زمان")).toBeInTheDocument()
    expect(screen.queryByText("کلاس ۱۰۲")).not.toBeInTheDocument()
    expect(screen.queryByText(/ظرفیت اتاق/)).not.toBeInTheDocument()
  })

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn()
    render(
      <SchedulingPlanCalendarMoveTargetCard
        track="EVEN"
        slotKey="09:00-10:30"
        startTime="09:00"
        endTime="10:30"
        targetDays={["SATURDAY", "MONDAY", "WEDNESDAY"]}
        targetRoom={defaultRoom}
        onClick={handleClick}
      />
    )

    const card = screen.getByTestId("move-target-card-EVEN-09:00-10:30")
    fireEvent.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("calls onClick on Enter and Space key presses", () => {
    const handleClick = vi.fn()
    render(
      <SchedulingPlanCalendarMoveTargetCard
        track="EVEN"
        slotKey="09:00-10:30"
        startTime="09:00"
        endTime="10:30"
        targetDays={["SATURDAY", "MONDAY", "WEDNESDAY"]}
        targetRoom={defaultRoom}
        onClick={handleClick}
      />
    )

    const card = screen.getByTestId("move-target-card-EVEN-09:00-10:30")
    fireEvent.keyDown(card, { key: "Enter" })
    expect(handleClick).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(card, { key: " " })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it("disables click interactions and displays spinner when isPending is true", () => {
    const handleClick = vi.fn()
    render(
      <SchedulingPlanCalendarMoveTargetCard
        track="EVEN"
        slotKey="09:00-10:30"
        startTime="09:00"
        endTime="10:30"
        targetDays={["SATURDAY", "MONDAY", "WEDNESDAY"]}
        targetRoom={defaultRoom}
        isPending={true}
        onClick={handleClick}
      />
    )

    const card = screen.getByTestId("move-target-card-EVEN-09:00-10:30")
    fireEvent.click(card)
    expect(handleClick).not.toHaveBeenCalled()

    fireEvent.keyDown(card, { key: "Enter" })
    expect(handleClick).not.toHaveBeenCalled()
  })
})

import { afterEach, describe, expect, it, vi } from "vitest"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { fireEvent, render, screen } from "@/test/test-utils"
import * as stores from "@/lib/stores"
import { SchedulingProposalActions } from "../index"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const proposalId = "33333333-3333-4333-8333-333333333333"

const baseProposal = {
  id: proposalId,
  instituteId,
  planId,
  courseId: "55555555-5555-4555-8555-555555555555",
  teacherId: "44444444-4444-4444-8444-444444444444",
  branchId: "66666666-6666-4666-8666-666666666666",
  classroomId: "77777777-7777-4777-8777-777777777777",
  title: "English Level 1",
  capacity: 15,
  deliveryMode: "IN_PERSON",
  daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  startTime: "08:00",
  endTime: "09:30",
  course: {
    id: "55555555-5555-4555-8555-555555555555",
    title: "English 1",
  },
  teacher: {
    id: "44444444-4444-4444-8444-444444444444",
    firstName: "علی",
    lastName: "محمدی",
  },
  branch: {
    id: "66666666-6666-4666-8666-666666666666",
    name: "شعبه مرکزی",
  },
  classroom: {
    id: "77777777-7777-4777-8777-777777777777",
    name: "کلاس ۱۰۱",
    capacity: 20,
  },
  classRequirement: null,
  lockedBy: null,
  sessions: [],
  warnings: [],
  selectionReasons: [],
  isLocked: false,
  isManuallyEdited: false,
  publishedClassId: null,
} as Proposal

describe("SchedulingProposalActions", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders trigger and displays edit, lock, toggle delivery mode, and delete teacher items", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)

    const handleEdit = vi.fn()
    const handleRemoveTeacher = vi.fn()
    const handleToggleDeliveryMode = vi.fn()

    render(
      <SchedulingProposalActions
        proposal={baseProposal}
        onEdit={handleEdit}
        onRemoveTeacher={handleRemoveTeacher}
        onToggleDeliveryMode={handleToggleDeliveryMode}
      />
    )

    const trigger = screen.getByTestId(`proposal-actions-trigger-${proposalId}`)
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    // Edit item
    const editItem = screen.getByText("ویرایش کلاس پیشنهادی")
    expect(editItem).toBeInTheDocument()

    // Delivery mode toggle: proposal is IN_PERSON so item says change to online/remote
    const deliveryItem = screen.getByTestId(
      `toggle-delivery-mode-btn-${proposalId}`
    )
    expect(deliveryItem).toHaveTextContent("تغییر به آنلاین (ریموت)")

    // Delete teacher item
    const deleteTeacherItem = screen.getByTestId(
      `delete-teacher-btn-${proposalId}`
    )
    expect(deleteTeacherItem).toHaveTextContent("حذف استاد")

    // Click edit
    fireEvent.click(editItem)
    expect(handleEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onToggleDeliveryMode when delivery mode item is clicked", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)

    const handleToggleDeliveryMode = vi.fn()

    render(
      <SchedulingProposalActions
        proposal={baseProposal}
        onEdit={vi.fn()}
        onToggleDeliveryMode={handleToggleDeliveryMode}
      />
    )

    const trigger = screen.getByTestId(`proposal-actions-trigger-${proposalId}`)
    fireEvent.click(trigger)

    const deliveryItem = screen.getByTestId(
      `toggle-delivery-mode-btn-${proposalId}`
    )
    fireEvent.click(deliveryItem)
    expect(handleToggleDeliveryMode).toHaveBeenCalledTimes(1)
  })

  it("calls onRemoveTeacher when delete teacher item is clicked", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)

    const handleRemoveTeacher = vi.fn()

    render(
      <SchedulingProposalActions
        proposal={baseProposal}
        onEdit={vi.fn()}
        onRemoveTeacher={handleRemoveTeacher}
      />
    )

    const trigger = screen.getByTestId(`proposal-actions-trigger-${proposalId}`)
    fireEvent.click(trigger)

    const deleteTeacherItem = screen.getByTestId(
      `delete-teacher-btn-${proposalId}`
    )
    fireEvent.click(deleteTeacherItem)
    expect(handleRemoveTeacher).toHaveBeenCalledTimes(1)
  })

  it("displays change to in-person / hybrid when proposal is online", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)

    const onlineProposal: Proposal = {
      ...baseProposal,
      deliveryMode: "ONLINE",
      classroomId: null,
      classroom: null,
    }

    render(
      <SchedulingProposalActions proposal={onlineProposal} onEdit={vi.fn()} />
    )

    const trigger = screen.getByTestId(`proposal-actions-trigger-${proposalId}`)
    fireEvent.click(trigger)

    const deliveryItem = screen.getByTestId(
      `toggle-delivery-mode-btn-${proposalId}`
    )
    expect(deliveryItem).toHaveTextContent("تغییر به حضوری (هیبریدی)")
  })

  it("does not render delete teacher item when proposal has no teacher", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)

    const noTeacherProposal: Proposal = {
      ...baseProposal,
      teacher: null,
      teacherId: null,
    }

    render(
      <SchedulingProposalActions
        proposal={noTeacherProposal}
        onEdit={vi.fn()}
        onRemoveTeacher={vi.fn()}
      />
    )

    const trigger = screen.getByTestId(`proposal-actions-trigger-${proposalId}`)
    fireEvent.click(trigger)

    expect(
      screen.queryByTestId(`delete-teacher-btn-${proposalId}`)
    ).not.toBeInTheDocument()
  })
})

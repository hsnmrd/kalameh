import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingProposalDetailsItem } from "../components/scheduling-proposal-details-item"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const proposalId = "33333333-3333-4333-8333-333333333333"
const proposal = {
  id: proposalId,
  instituteId,
  planId,
  courseId: "55555555-5555-4555-8555-555555555555",
  teacherId: "44444444-4444-4444-8444-444444444444",
  branchId: null,
  classroomId: null,
  title: "کلاس سطح A2",
  capacity: 12,
  deliveryMode: "ONLINE",
  daysOfWeek: ["SATURDAY"],
  startTime: "09:00",
  endTime: "10:30",
  course: {
    id: "55555555-5555-4555-8555-555555555555",
    title: "A2",
  },
  teacher: {
    id: "44444444-4444-4444-8444-444444444444",
    firstName: "سارا",
    lastName: "احمدی",
  },
  branch: null,
  classroom: null,
  classRequirement: null,
  lockedBy: null,
  sessions: [],
  warnings: [],
  selectionReasons: [],
  isLocked: false,
  isManuallyEdited: false,
  publishedClassId: null,
} as Proposal

describe("MVP-040 scheduling proposal locking", () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([
    { initial: false, label: "قفل برای تولید مجدد", requested: true },
    { initial: true, label: "بازکردن قفل", requested: false },
  ])("sets lock state to $requested", async ({ initial, label, requested }) => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const updateLock = vi.fn(async () => ({
      ...proposal,
      isLocked: requested,
    }))
    vi.spyOn(schedulingResource.setProposalLock, "toMutation").mockReturnValue({
      mutationFn: updateLock,
    } as never)
    const invalidate = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue()

    render(
      <SchedulingProposalDetailsItem
        proposal={{ ...proposal, isLocked: initial }}
        canEdit
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "اقدامات کلاس پیشنهادی" })
    )
    fireEvent.click(await screen.findByRole("menuitem", { name: label }))

    await waitFor(() => expect(updateLock).toHaveBeenCalledTimes(1))
    expect(updateLock).toHaveBeenCalledWith(
      {
        planId,
        proposalId,
        instituteId,
        body: { isLocked: requested },
      },
      expect.any(Object)
    )
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      })
    )
  })
})

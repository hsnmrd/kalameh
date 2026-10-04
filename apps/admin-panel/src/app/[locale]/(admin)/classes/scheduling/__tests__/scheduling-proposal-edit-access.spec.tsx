import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import * as hooks from "@/lib/hooks"
import { SchedulingProposalDetailsItem } from "../components/scheduling-proposal-details-item"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const proposal = {
  id: "33333333-3333-4333-8333-333333333333",
  instituteId: "11111111-1111-4111-8111-111111111111",
  planId: "22222222-2222-4222-8222-222222222222",
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
  sessions: [],
  warnings: [],
  selectionReasons: [],
  isLocked: false,
  isManuallyEdited: false,
  publishedClassId: null,
} as Proposal

describe("MVP-039 scheduling proposal edit access", () => {
  afterEach(() => vi.restoreAllMocks())

  it("hides editing when the plan is not selected", () => {
    render(
      <SchedulingProposalDetailsItem proposal={proposal} canEdit={false} />
    )

    expect(
      screen.queryByRole("button", { name: "اقدامات کلاس پیشنهادی" })
    ).not.toBeInTheDocument()
  })

  it("hides editing after the proposal is published", () => {
    render(
      <SchedulingProposalDetailsItem
        proposal={{
          ...proposal,
          publishedClassId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        }}
        canEdit
      />
    )

    expect(
      screen.queryByRole("button", { name: "اقدامات کلاس پیشنهادی" })
    ).not.toBeInTheDocument()
  })

  it("hides editing without class-management permission", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    render(<SchedulingProposalDetailsItem proposal={proposal} canEdit />)

    expect(
      screen.queryByRole("button", { name: "اقدامات کلاس پیشنهادی" })
    ).not.toBeInTheDocument()
  })
})

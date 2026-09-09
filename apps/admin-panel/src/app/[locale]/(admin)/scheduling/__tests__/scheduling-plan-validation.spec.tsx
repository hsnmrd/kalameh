import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
} from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { SchedulingPlanDetailsDialog } from "../components/scheduling-plan-details-dialog"

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const proposalId = "33333333-3333-4333-8333-333333333333"
const timestamp = "2026-09-09T10:00:00.000Z"

const selectedPlan = {
  id: planId,
  instituteId,
  runId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status: "SELECTED",
  rank: 1,
  isRecommended: true,
  qualityIndex: 90,
  earnedWeightedPoints: 68,
  applicableWeightedPoints: 75,
  coveragePercent: 95,
  minimumCourseCoveragePercent: 90,
  scoreBreakdown: { criteria: [] },
  generatedAt: timestamp,
  updatedAt: timestamp,
  warnings: [],
  unresolvedRequirements: [],
  proposals: [
    {
      id: proposalId,
      instituteId,
      planId,
      courseId: "44444444-4444-4444-8444-444444444444",
      teacherId: "55555555-5555-4555-8555-555555555555",
      branchId: null,
      classroomId: null,
      title: "کلاس سطح A2",
      capacity: 12,
      deliveryMode: "ONLINE",
      daysOfWeek: ["SATURDAY"],
      startTime: "09:00",
      endTime: "10:30",
      course: {
        id: "44444444-4444-4444-8444-444444444444",
        title: "A2",
      },
      teacher: {
        id: "55555555-5555-4555-8555-555555555555",
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
    },
  ],
  run: { term: { title: "پاییز" }, branch: null },
} as SchedulingPlanDetailsDto

const renderDialog = () =>
  render(
    <SchedulingPlanDetailsDialog
      plan={selectedPlan}
      isRecommended
      isSelected
      isSelectionPending={false}
      isSelecting={false}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  )

describe("MVP-041 scheduling plan validation", () => {
  afterEach(() => vi.restoreAllMocks())

  it("shows structured violations for an invalid selected plan", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const result = {
      planId,
      isValid: false,
      validatedAt: timestamp,
      violations: [
        {
          code: "TEACHER_TIME_CONFLICT",
          scope: "PROPOSAL",
          proposalId,
          conflictingEntityIds: ["66666666-6666-4666-8666-666666666666"],
          context: {},
        },
        {
          code: "INVALID_OR_INACTIVE_REFERENCE",
          scope: "PLAN",
          proposalId: null,
          conflictingEntityIds: [],
          context: {},
        },
      ],
      summary: {
        proposalCount: 1,
        violationCount: 2,
        invalidProposalCount: 1,
      },
    } as SchedulingPlanValidation
    const validate = vi.fn(async () => result)
    vi.spyOn(schedulingResource.validatePlan, "toMutation").mockReturnValue({
      mutationFn: validate,
    })

    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "اعتبارسنجی برنامه" }))

    await waitFor(() => expect(validate).toHaveBeenCalledTimes(1))
    expect(validate).toHaveBeenCalledWith(
      { planId, instituteId },
      expect.any(Object)
    )
    expect(
      await screen.findByRole("heading", { name: "برنامه نیاز به اصلاح دارد" })
    ).toBeInTheDocument()
    expect(screen.getByText("نامعتبر")).toBeInTheDocument()
    expect(screen.getByText("برنامه استاد تداخل دارد")).toBeInTheDocument()
    expect(screen.getByText("کل برنامه")).toBeInTheDocument()
    expect(
      screen.getByText("۱ مورد تداخل مرتبط شناسایی شد.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "اعتبارسنجی دوباره" })
    ).toBeEnabled()
  })

  it("shows the publish-ready state after validation passes", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.validatePlan, "toMutation").mockReturnValue({
      mutationFn: async () =>
        ({
          planId,
          isValid: true,
          validatedAt: timestamp,
          violations: [],
          summary: {
            proposalCount: 1,
            violationCount: 0,
            invalidProposalCount: 0,
          },
        }) as SchedulingPlanValidation,
    })

    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "اعتبارسنجی برنامه" }))

    expect(
      await screen.findByRole("heading", { name: "برنامه آماده انتشار است" })
    ).toBeInTheDocument()
    expect(screen.getByText("معتبر")).toBeInTheDocument()
  })

  it("hides validation without class-management permission", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    renderDialog()

    expect(
      screen.queryByRole("button", { name: "اعتبارسنجی برنامه" })
    ).not.toBeInTheDocument()
  })
})

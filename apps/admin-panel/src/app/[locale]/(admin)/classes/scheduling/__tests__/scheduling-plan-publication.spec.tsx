import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { MicroApiError } from "micro-rq"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanPublicationResult,
  SchedulingPlanValidation,
} from "@workspace/types"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingPlanDetailsDialog } from "../components/scheduling-plan-details-dialog"

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const runId = "33333333-3333-4333-8333-333333333333"
const proposalId = "44444444-4444-4444-8444-444444444444"
const classId = "55555555-5555-4555-8555-555555555555"
const timestamp = "2026-09-09T17:00:00.000Z"

const plan = (status: "SELECTED" | "PUBLISHED" = "SELECTED") =>
  ({
    id: planId,
    instituteId,
    runId,
    status,
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
    publishedAt: status === "PUBLISHED" ? timestamp : null,
    warnings: [],
    unresolvedRequirements: [],
    proposals: [
      {
        id: proposalId,
        instituteId,
        planId,
        courseId: "66666666-6666-4666-8666-666666666666",
        teacherId: "77777777-7777-4777-8777-777777777777",
        branchId: null,
        classroomId: null,
        title: "کلاس سطح A2",
        capacity: 12,
        deliveryMode: "ONLINE",
        daysOfWeek: ["SATURDAY"],
        startTime: "09:00",
        endTime: "10:30",
        course: {
          id: "66666666-6666-4666-8666-666666666666",
          title: "A2",
        },
        teacher: {
          id: "77777777-7777-4777-8777-777777777777",
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
        publishedClassId: status === "PUBLISHED" ? classId : null,
      },
    ],
    run: { term: { title: "پاییز" }, branch: null },
  }) as SchedulingPlanDetailsDto

const validValidation = {
  planId,
  isValid: true,
  validatedAt: timestamp,
  violations: [],
  summary: { proposalCount: 1, violationCount: 0, invalidProposalCount: 0 },
} as SchedulingPlanValidation

const renderDialog = (details = plan()) =>
  render(
    <SchedulingPlanDetailsDialog
      plan={details}
      isRecommended
      isSelected={details.status === "SELECTED"}
      isSelectionPending={false}
      isSelecting={false}
      onSelect={vi.fn()}
      onClose={vi.fn()}
    />
  )

describe("MVP-042 scheduling plan publication", () => {
  afterEach(() => vi.restoreAllMocks())

  it("confirms and atomically publishes a validated selected plan", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    let resolveRevalidation!: (value: SchedulingPlanValidation) => void
    const revalidation = new Promise<SchedulingPlanValidation>((resolve) => {
      resolveRevalidation = resolve
    })
    const validate = vi
      .fn()
      .mockResolvedValueOnce(validValidation)
      .mockReturnValueOnce(revalidation)
    vi.spyOn(schedulingResource.validatePlan, "toMutation").mockReturnValue({
      mutationFn: validate,
    })
    const publishResult = {
      planId,
      runId,
      status: "PUBLISHED",
      classIds: [classId],
      proposalCount: 1,
      publishedAt: timestamp,
    } as SchedulingPlanPublicationResult
    const publish = vi.fn(async () => publishResult)
    vi.spyOn(schedulingResource.publishPlan, "toMutation").mockReturnValue({
      mutationFn: publish,
    })
    const updateCache = vi.spyOn(QueryClient.prototype, "setQueriesData")
    const invalidate = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue()

    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "اعتبارسنجی برنامه" }))
    await screen.findByRole("button", {
      name: "انتشار برنامه",
    })
    fireEvent.click(screen.getByRole("button", { name: "اعتبارسنجی دوباره" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "انتشار برنامه" })
      ).not.toBeInTheDocument()
    )
    expect(validate).toHaveBeenCalledTimes(2)
    resolveRevalidation(validValidation)
    fireEvent.click(
      await screen.findByRole("button", { name: "انتشار برنامه" })
    )

    expect(
      screen.getByRole("alertdialog", { name: "انتشار برنامه نهایی" })
    ).toHaveTextContent("انتشار و ساخت ۱ کلاس")
    fireEvent.click(
      screen.getByRole("button", { name: "انتشار و ساخت ۱ کلاس" })
    )

    await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
    expect(publish).toHaveBeenCalledWith(
      { planId, instituteId },
      expect.any(Object)
    )
    expect(updateCache).toHaveBeenCalledWith(
      { queryKey: schedulingResource.planDetail.baseKey() },
      expect.any(Function)
    )
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: schedulingResource.planDetail.baseKey(),
    })
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "انتشار برنامه نهایی" })
      ).not.toBeInTheDocument()
    )
  })

  it("shows fresh validation violations when publication is blocked", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.validatePlan, "toMutation").mockReturnValue({
      mutationFn: async () => validValidation,
    })
    const blockedValidation = {
      ...validValidation,
      isValid: false,
      violations: [
        {
          code: "TEACHER_TIME_CONFLICT",
          scope: "PROPOSAL",
          proposalId,
          conflictingEntityIds: [],
          context: {},
        },
      ],
      summary: { proposalCount: 1, violationCount: 1, invalidProposalCount: 1 },
    } as SchedulingPlanValidation
    vi.spyOn(schedulingResource.publishPlan, "toMutation").mockReturnValue({
      mutationFn: async () => {
        throw new MicroApiError(
          new Response(null, { status: 409, statusText: "Conflict" }),
          {
            code: "HARD_CONSTRAINT_PUBLISH_BLOCKED",
            validation: blockedValidation,
          }
        )
      },
    })

    renderDialog()
    fireEvent.click(screen.getByRole("button", { name: "اعتبارسنجی برنامه" }))
    fireEvent.click(
      await screen.findByRole("button", { name: "انتشار برنامه" })
    )
    fireEvent.click(
      screen.getByRole("button", { name: "انتشار و ساخت ۱ کلاس" })
    )

    expect(
      await screen.findByRole("heading", { name: "برنامه نیاز به اصلاح دارد" })
    ).toBeInTheDocument()
    expect(screen.getByText("برنامه استاد تداخل دارد")).toBeInTheDocument()
    expect(
      screen.queryByRole("alertdialog", { name: "انتشار برنامه نهایی" })
    ).not.toBeInTheDocument()
  })

  it("shows a persistent published state without mutable actions", () => {
    renderDialog(plan("PUBLISHED"))

    expect(
      screen.getByRole("heading", { name: "برنامه با موفقیت منتشر شد" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("منتشرشده").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("button", { name: /انتخاب|اعتبارسنجی|انتشار/ })
    ).not.toBeInTheDocument()
  })
})

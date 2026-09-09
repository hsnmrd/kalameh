import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingPlanComparison } from "../components/scheduling-plan-comparison"

const instituteId = "11111111-1111-4111-8111-111111111111"
const firstPlanId = "22222222-2222-4222-8222-222222222222"
const secondPlanId = "33333333-3333-4333-8333-333333333333"
const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const timestamp = "2026-09-09T10:00:00.000Z"

const plan = (
  id: string,
  rank: number,
  overrides: Partial<SchedulingPlanDetailsDto> = {}
) =>
  ({
    id,
    instituteId,
    runId,
    status: "DRAFT",
    rank,
    isRecommended: false,
    qualityIndex: 84,
    earnedWeightedPoints: 63,
    applicableWeightedPoints: 75,
    coveragePercent: 91,
    minimumCourseCoveragePercent: 82,
    scoreBreakdown: {
      criteria: [
        {
          code: "SC_TIME_PATTERN_DIVERSITY",
          status: "APPLICABLE",
          rawValue: 0.8,
          normalizedScore: 0.8,
          weight: 25,
          weightedPoints: 20,
          details: {},
        },
      ],
    },
    generatedAt: timestamp,
    warnings: [
      {
        code: "MISSING_SCHEDULED_CLASSES",
        severity: "WARNING",
        scope: "REQUIREMENT",
        context: { requiredClassCount: 2, scheduledClassCount: 1 },
      },
    ],
    proposals: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        title: "کلاس سطح A2",
        course: { id: "55555555-5555-4555-8555-555555555555", title: "A2" },
        teacher: {
          id: "66666666-6666-4666-8666-666666666666",
          firstName: "سارا",
          lastName: "احمدی",
        },
        branch: { id: "77777777-7777-4777-8777-777777777777", name: "مرکزی" },
        classroom: {
          id: "88888888-8888-4888-8888-888888888888",
          name: "کلاس ۳",
          capacity: 15,
        },
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY"],
        startTime: "09:00",
        endTime: "10:30",
        capacity: 12,
        sessions: [{ id: "99999999-9999-4999-8999-999999999999" }],
        warnings: [
          {
            code: "MANUAL_EDIT_REQUIRES_VALIDATION",
            severity: "WARNING",
            scope: "PROPOSAL",
            context: { changedFields: ["teacherId"] },
          },
        ],
        isLocked: false,
        isManuallyEdited: false,
        selectionReasons: [
          { code: "MATCHES_TEACHER_AVAILABILITY", evidence: {} },
        ],
      },
    ],
    unresolvedRequirements: [],
    run: {
      term: { title: "پاییز" },
      branch: null,
    },
    ...overrides,
  }) as SchedulingPlanDetailsDto

describe("MVP-036 scheduling plan comparison", () => {
  afterEach(() => vi.restoreAllMocks())

  it("loads every plan, sorts by rank, and marks the engine recommendation", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const detailSpy = vi
      .spyOn(schedulingResource.planDetail, "toQuery")
      .mockImplementation(({ planId }) => ({
        queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
        queryFn: async () =>
          planId === firstPlanId
            ? plan(firstPlanId, 2, { qualityIndex: 78 })
            : plan(secondPlanId, 1, {
                qualityIndex: 92,
                unresolvedRequirements: [
                  { missingClassCount: 2 },
                ] as SchedulingPlanDetailsDto["unresolvedRequirements"],
              }),
      }))

    render(
      <SchedulingPlanComparison
        planIds={[firstPlanId, secondPlanId]}
        recommendedPlanId={secondPlanId}
      />
    )

    expect(
      await screen.findByRole("heading", {
        name: "مقایسه برنامه‌های پیشنهادی",
      })
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((item) => item.textContent)
    ).toEqual(["برنامه ۱", "برنامه ۲"])
    expect(screen.getByText("پیشنهاد موتور")).toBeInTheDocument()
    expect(screen.getByText("۲ کلاس تأمین‌نشده")).toBeInTheDocument()
    expect(detailSpy).toHaveBeenCalledWith({
      planId: firstPlanId,
      instituteId,
    })
    expect(detailSpy).toHaveBeenCalledWith({
      planId: secondPlanId,
      instituteId,
    })
  })

  it("offers a recoverable state when plan details cannot be loaded", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({
        planId: firstPlanId,
        instituteId,
      }),
      queryFn: async () => Promise.reject(new Error("offline")),
    } as never)

    render(
      <SchedulingPlanComparison
        planIds={[firstPlanId]}
        recommendedPlanId={null}
      />
    )

    expect(
      await screen.findByText("مقایسه برنامه‌ها بارگذاری نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "تلاش دوباره" })
    ).toBeInTheDocument()
  })

  it("opens a read-only inspector with proposal details", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({
        planId: firstPlanId,
        instituteId,
      }),
      queryFn: async () => plan(firstPlanId, 1),
    } as never)

    render(
      <SchedulingPlanComparison
        planIds={[firstPlanId]}
        recommendedPlanId={firstPlanId}
      />
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "مشاهده جزئیات" })
    )

    expect(
      screen.getByRole("heading", { name: "جزئیات برنامه ۱" })
    ).toBeInTheDocument()
    expect(screen.getByText("کلاس سطح A2")).toBeInTheDocument()
    expect(screen.getByText(/سارا احمدی/)).toBeInTheDocument()
    expect(screen.getByText("شنبه، دوشنبه")).toBeInTheDocument()
    expect(screen.getByText("تطابق با زمان استاد")).toBeInTheDocument()
    expect(
      screen.getByText("بخشی از کلاس‌های موردنیاز ساخته نشده‌اند.")
    ).toBeInTheDocument()
    expect(screen.getByText("فیلدهای تغییرکرده: استاد")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "انتخاب این برنامه" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", {
        name: /ویرایش|قفل|اعتبارسنجی|انتشار/,
      })
    ).not.toBeInTheDocument()
  })

  it("selects one plan at a time and replaces the previous selection", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockImplementation(
      ({ planId }) => ({
        queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
        queryFn: async () =>
          planId === firstPlanId ? plan(firstPlanId, 2) : plan(secondPlanId, 1),
      })
    )
    const select = vi.fn(async ({ planId }: { planId: string }) => ({
      planId,
      runId,
      status: "SELECTED" as const,
      selectedAt: timestamp,
    }))
    vi.spyOn(schedulingResource.selectPlan, "toMutation").mockReturnValue({
      mutationFn: select,
    })

    render(
      <SchedulingPlanComparison
        planIds={[firstPlanId, secondPlanId]}
        recommendedPlanId={secondPlanId}
      />
    )

    const initialButtons = await screen.findAllByRole("button", {
      name: "انتخاب این برنامه",
    })
    fireEvent.click(initialButtons[0]!)

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "برنامه انتخاب‌شده" })
      ).toBeDisabled()
    )
    expect(
      screen
        .getByRole("button", { name: "برنامه انتخاب‌شده" })
        .closest("article")
    ).toHaveTextContent("برنامه ۱")

    fireEvent.click(screen.getByRole("button", { name: "انتخاب این برنامه" }))

    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "برنامه انتخاب‌شده" })
          .closest("article")
      ).toHaveTextContent("برنامه ۲")
    )
    expect(select).toHaveBeenNthCalledWith(
      1,
      {
        planId: secondPlanId,
        instituteId,
      },
      expect.any(Object)
    )
    expect(select).toHaveBeenNthCalledWith(
      2,
      {
        planId: firstPlanId,
        instituteId,
      },
      expect.any(Object)
    )
  })
})

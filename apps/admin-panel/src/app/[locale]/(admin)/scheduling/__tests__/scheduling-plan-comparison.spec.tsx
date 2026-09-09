import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingPlanComparison } from "../components/scheduling-plan-comparison"

const instituteId = "11111111-1111-4111-8111-111111111111"
const firstPlanId = "22222222-2222-4222-8222-222222222222"
const secondPlanId = "33333333-3333-4333-8333-333333333333"

const plan = (
  id: string,
  rank: number,
  overrides: Partial<SchedulingPlanDetailsDto> = {}
) =>
  ({
    id,
    instituteId,
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
    warnings: [],
    proposals: [{ warnings: [] }, { warnings: [] }],
    unresolvedRequirements: [],
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
        queryKey: ["scheduling", "plan", planId],
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
      queryKey: ["scheduling", "plan", "failed"],
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
})

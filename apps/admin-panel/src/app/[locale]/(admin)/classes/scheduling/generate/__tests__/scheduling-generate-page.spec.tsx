import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../../test/test-utils"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import {
  branchesResource,
  classRequirementsResource,
  schedulingResource,
  termsResource,
} from "@/lib/api"
import { APP_MODULES, ROLES } from "@workspace/types"
import SchedulingGeneratePage from "../page"

const { mockPush, mockBack } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
  usePathname: () => "/scheduling/generate",
  useSearchParams: () => new URLSearchParams("termId=term-fall"),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
  usePathname: () => "/scheduling/generate",
  useIsRtl: () => true,
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("SchedulingGeneratePage", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders breadcrumb and generation form when authorized", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => true,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)

    render(<SchedulingGeneratePage />)

    // Breadcrumb and page headers are present
    expect(
      screen.getAllByText("زمان‌بندی هوشمند کلاس‌ها").length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText("ساخت پیشنهادهای زمان‌بندی").length
    ).toBeGreaterThanOrEqual(1)
  })

  it("changes route to /scheduling and updates activeRun in store when generation succeeds", async () => {
    const termId = "22222222-2222-4222-8222-222222222222"
    const instituteId = "11111111-1111-4111-8111-111111111111"
    const requirementId = "33333333-3333-4333-8333-333333333333"

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: {
        id: instituteId,
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => true,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)

    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          endDate: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
          isActive: true,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)

    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [],
    } as never)

    vi.spyOn(classRequirementsResource.list, "toQuery").mockReturnValue({
      queryKey: ["class-requirements", termId],
      queryFn: async () => [
        {
          id: requirementId,
          instituteId,
          termId,
          courseId: "44444444-4444-4444-8444-444444444444",
          requiredClassCount: 2,
          capacity: 14,
          sessionDurationMinutes: 90,
          sessionsPerWeek: 2,
          deliveryMode: "IN_PERSON",
          isActive: true,
          course: {
            id: "44444444-4444-4444-8444-444444444444",
            title: "دوره زبان",
          },
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)

    const createdRun: any = {
      id: "55555555-5555-4555-8555-555555555555",
      instituteId,
      termId,
      requestedByUserId: "user-1",
      status: "QUEUED",
      inputSnapshot: {},
      settingsSnapshot: {},
      plans: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vi.spyOn(schedulingResource.generate, "toMutation").mockReturnValue({
      mutationFn: vi.fn().mockResolvedValue(createdRun),
    } as never)

    render(<SchedulingGeneratePage />)

    // Wait for the term to be selected
    expect(await screen.findByText("ترم پاییز")).toBeInTheDocument()

    // Newly active requirements are preselected after demand review.
    expect(await screen.findByLabelText("دوره زبان")).toBeChecked()

    // Click submit button "ساخت پیشنهادها"
    const submitButton = screen.getByRole("button", {
      name: "ساخت پیشنهادها",
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/scheduling/runs/${createdRun.id}`)
    })

    expect(stores.useSchedulingRunStore.getState().activeRun).toEqual(
      createdRun
    )
  })
})

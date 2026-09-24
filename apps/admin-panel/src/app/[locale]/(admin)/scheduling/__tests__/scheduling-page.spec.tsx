import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { INSTITUTE_NAV_ITEMS } from "@/data"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { schedulingResource } from "@/lib/api"
import {
  APP_MODULES,
  ROLES,
  type SchedulingTermSummaryDto,
} from "@workspace/types"
import SchedulingPage from "../page"

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scheduling",
  useSearchParams: () => new URLSearchParams(),
}))

describe("Unified scheduling workspace", () => {
  afterEach(() => vi.restoreAllMocks())

  it("exposes scheduling in institute navigation", () => {
    expect(INSTITUTE_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "scheduling",
          href: "/scheduling",
        }),
      ])
    )
  })

  it("renders empty state without search or tabs when no terms exist in Persian", () => {
    render(<SchedulingPage />)

    expect(screen.getByText("ترمی یافت نشد")).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText("جست‌وجوی دوره...")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("تقاضا و نیازهای کلاسی")).not.toBeInTheDocument()
  })

  it("renders empty state without search or tabs when no terms exist in English", () => {
    render(<SchedulingPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(screen.getByText("No terms found")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument()
    expect(screen.queryByText("Demand & Requirements")).not.toBeInTheDocument()
  })

  it("auto-selects upcoming term starting within 10 days and renders tab-less demand overview", async () => {
    const mockTerms: SchedulingTermSummaryDto[] = [
      {
        id: "term-summer",
        title: "تابستان ۱۴۰۵",
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 5,
        requirementsCount: 2,
        totalRequiredClasses: 4,
        schedulingStatus: "PUBLISHED",
      },
      {
        id: "term-fall",
        title: "پاییز ۱۴۰۵",
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // starts in 4 days
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 0,
        requirementsCount: 3,
        totalRequiredClasses: 6,
        schedulingStatus: "READY_TO_SCHEDULE",
      },
    ]

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(schedulingResource.terms, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "terms", "inst-1"],
      queryFn: async () => mockTerms,
    } as any)

    render(<SchedulingPage />)

    expect(
      (await screen.findAllByText("پاییز ۱۴۰۵")).length
    ).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("آماده تولید برنامه")).toBeInTheDocument()
    // Verify no search input exists
    expect(
      screen.queryByPlaceholderText("جست‌وجوی دوره...")
    ).not.toBeInTheDocument()
    // Verify no tabs exist
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
  })

  it("shows the forbidden state without VIEW_CLASSES", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => false,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: { enabledModules: [APP_MODULES.CLASSES_COURSES] },
    } as ReturnType<typeof stores.useActiveInstitute>)

    render(<SchedulingPage />)

    expect(screen.getByText("دسترسی غیرمجاز")).toBeInTheDocument()
    expect(screen.queryByText("تقاضای دوره‌ها")).not.toBeInTheDocument()
  })

  it("shows the module upgrade state when classes and courses are disabled", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => true,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: { enabledModules: [] },
    } as ReturnType<typeof stores.useActiveInstitute>)

    render(<SchedulingPage />)

    expect(screen.getByText("دوره‌ها و کلاس‌ها")).toBeInTheDocument()
    expect(screen.queryByText("تقاضای دوره‌ها")).not.toBeInTheDocument()
  })
})

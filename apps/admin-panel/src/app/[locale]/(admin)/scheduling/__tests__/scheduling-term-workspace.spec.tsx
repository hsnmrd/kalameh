import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { APP_MODULES, ROLES } from "@workspace/types"
import SingleTermSchedulingPage from "../[termId]/page"

vi.mock("next/navigation", () => ({
  useParams: () => ({ termId: "term-123" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scheduling/term-123",
}))

describe("Single term scheduling workspace", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders the breadcrumb, workspace filter and demand tab in Persian", () => {
    render(<SingleTermSchedulingPage />)

    expect(screen.getByText("بازگشت به فهرست ترم‌ها")).toBeInTheDocument()
    expect(screen.getByText("تقاضا و نیازهای کلاسی")).toBeInTheDocument()
    expect(screen.getByText("تولید و برنامه‌های هفتگی")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /محاسبه تقاضا/ })[0]
    ).toBeInTheDocument()
  })

  it("renders the breadcrumb, workspace filter and demand tab in English", () => {
    render(<SingleTermSchedulingPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(screen.getByText("Back to Terms")).toBeInTheDocument()
    expect(screen.getByText("Demand & Requirements")).toBeInTheDocument()
    expect(screen.getByText("Schedule Generation")).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: /Calculate Demand/ })[0]
    ).toBeInTheDocument()
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

    render(<SingleTermSchedulingPage />)

    expect(screen.getByText("دسترسی غیرمجاز")).toBeInTheDocument()
    expect(screen.queryByText("تقاضا و نیازهای کلاسی")).not.toBeInTheDocument()
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

    render(<SingleTermSchedulingPage />)

    expect(screen.getByText("دوره‌ها و کلاس‌ها")).toBeInTheDocument()
    expect(screen.queryByText("تقاضا و نیازهای کلاسی")).not.toBeInTheDocument()
  })
})

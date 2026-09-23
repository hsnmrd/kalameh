import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { APP_MODULES, ROLES } from "@workspace/types"
import TermRequirementsPage from "../[termId]/requirements/page"

vi.mock("next/navigation", () => ({
  useParams: () => ({ termId: "term-123" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/scheduling/term-123/requirements",
}))

describe("Term Requirements Page", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders the breadcrumb, filter bar, and action buttons in Persian", () => {
    render(<TermRequirementsPage />)

    expect(screen.getByText("بازگشت به زمان‌بندی ترم")).toBeInTheDocument()
    expect(screen.getByText("ثبت نیاز جدید")).toBeInTheDocument()
    expect(screen.getByText("دریافت از تحلیل تقاضا")).toBeInTheDocument()
  })

  it("renders in English with localized text", () => {
    render(<TermRequirementsPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(screen.getByText("Back to Term Scheduling")).toBeInTheDocument()
    expect(screen.getByText("Add Requirement")).toBeInTheDocument()
    expect(screen.getByText("Load from Demand Analysis")).toBeInTheDocument()
  })

  it("opens create requirement modal when clicking Add Requirement", () => {
    render(<TermRequirementsPage />)

    const addButton = screen.getAllByRole("button", {
      name: "ثبت نیاز جدید",
    })[0]
    fireEvent.click(addButton)

    expect(screen.getAllByText("ثبت نیاز جدید").length).toBeGreaterThan(1)
  })

  it("opens sync demand modal when clicking Sync Demand", () => {
    render(<TermRequirementsPage />)

    const syncButton = screen.getByRole("button", {
      name: "دریافت از تحلیل تقاضا",
    })
    fireEvent.click(syncButton)

    expect(screen.getByText("تأیید و جایگزینی")).toBeInTheDocument()
  })

  it("shows forbidden state when user lacks VIEW_CLASSES permission", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => false,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: { enabledModules: [APP_MODULES.CLASSES_COURSES] },
    } as ReturnType<typeof stores.useActiveInstitute>)

    render(<TermRequirementsPage />)

    expect(screen.getByText("دسترسی غیرمجاز")).toBeInTheDocument()
    expect(screen.queryByText("ثبت نیاز جدید")).not.toBeInTheDocument()
  })
})

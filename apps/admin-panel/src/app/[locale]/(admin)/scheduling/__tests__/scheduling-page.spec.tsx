import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { INSTITUTE_NAV_ITEMS } from "@/data"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { APP_MODULES, ROLES } from "@workspace/types"
import SchedulingPage from "../page"

describe("MVP-033 scheduling workspace", () => {
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

  it("renders the localized workflow and working prerequisite links", () => {
    render(<SchedulingPage />)

    expect(
      screen.getByRole("heading", { name: "زمان‌بندی هوشمند کلاس‌ها" })
    ).toBeInTheDocument()
    expect(screen.getByText("تولید پیشنهاد")).toBeInTheDocument()
    expect(screen.getByText("بررسی سوپروایزر")).toBeInTheDocument()
    expect(screen.getByText("انتشار کلاس‌ها")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /بررسی ترم‌ها/ })).toHaveAttribute(
      "href",
      "/terms"
    )
    expect(screen.getByRole("link", { name: /بررسی استادان/ })).toHaveAttribute(
      "href",
      "/teachers"
    )
    expect(
      screen.getByRole("link", { name: /بررسی فراگیران/ })
    ).toHaveAttribute("href", "/students")
  })

  it("renders the same workspace in English", () => {
    render(<SchedulingPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(
      screen.getByRole("heading", { name: "Smart Class Scheduling" })
    ).toBeInTheDocument()
    expect(screen.getByText("Supervisor review")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Review teachers/ })
    ).toHaveAttribute("href", "/teachers")
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
    expect(
      screen.queryByRole("heading", { name: "زمان‌بندی هوشمند کلاس‌ها" })
    ).not.toBeInTheDocument()
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
    expect(
      screen.queryByRole("heading", { name: "زمان‌بندی هوشمند کلاس‌ها" })
    ).not.toBeInTheDocument()
  })
})

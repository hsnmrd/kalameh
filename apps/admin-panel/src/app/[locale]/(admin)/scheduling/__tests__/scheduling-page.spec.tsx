import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { INSTITUTE_NAV_ITEMS } from "@/data"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { APP_MODULES, ROLES } from "@workspace/types"
import SchedulingPage from "../page"

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

  it("renders the terms filter bar and table in Persian", () => {
    render(<SchedulingPage />)

    expect(
      screen.getByPlaceholderText("جست‌وجوی عنوان ترم...")
    ).toBeInTheDocument()
    expect(screen.getAllByText("ترمی یافت نشد").length).toBeGreaterThan(0)
  })

  it("renders the terms filter bar and table in English", () => {
    render(<SchedulingPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(
      screen.getByPlaceholderText("Search term title...")
    ).toBeInTheDocument()
    expect(screen.getAllByText("No terms found").length).toBeGreaterThan(0)
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

import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../../test/test-utils"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
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
})

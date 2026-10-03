import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../../../test/test-utils"
import type { SchedulingRunStatusDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import SchedulingRunResultPage from "../page"

const instituteId = "11111111-1111-4111-8111-111111111111"
const runId = "22222222-2222-4222-8222-222222222222"
const timestamp = "2026-09-09T10:00:00.000Z"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ runId }),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => `/scheduling/runs/${runId}`,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => `/scheduling/runs/${runId}`,
  useIsRtl: () => true,
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const activeStatus: SchedulingRunStatusDto = {
  runId,
  status: "GENERATING",
  isTerminal: false,
  result: null,
  preflightReport: null,
  failureCode: null,
  failureMessage: null,
  startedAt: timestamp,
  completedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
}

describe("SchedulingRunResultPage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
  })

  it("fetches run directly from API on page refresh and does NOT redirect to /scheduling", async () => {
    vi.spyOn(stores, "useSchedulingRunStore").mockReturnValue({
      activeRun: null, // Empty on page refresh!
      setActiveRun: vi.fn(),
      clearActiveRun: vi.fn(),
    })
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.runStatus, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "run-status", runId],
      queryFn: async () => activeStatus,
    } as never)

    render(<SchedulingRunResultPage />)

    // Should render the page and status panel
    expect(
      await screen.findByRole("heading", {
        name: "در حال ساخت پیشنهادهای زمان‌بندی",
      })
    ).toBeInTheDocument()

    // It should NEVER have redirected to /scheduling!
    expect(mockPush).not.toHaveBeenCalledWith("/scheduling")
  })

  it("shows not-found state with retry and back buttons when query fails", async () => {
    vi.spyOn(stores, "useSchedulingRunStore").mockReturnValue({
      activeRun: null,
      setActiveRun: vi.fn(),
      clearActiveRun: vi.fn(),
    })
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.runStatus, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "run-status", runId, "not-found"],
      queryFn: async () => Promise.reject(new Error("Run not found")),
    } as never)

    render(<SchedulingRunResultPage />)

    expect(
      await screen.findByText("اجرای زمان‌بندی یافت نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "تلاش مجدد" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "بازگشت به زمان‌بندی" })
    ).toBeInTheDocument()
  })
})

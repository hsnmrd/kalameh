import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@/test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import { usePhaseTermsGenerateStore } from "@/lib/stores"
import GeneratePhaseTermsPreviewPage from "../page"

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/terms/generate/preview",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/terms/generate/preview",
  useIsRtl: () => true,
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/lib/stores", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stores")>()
  return {
    ...actual,
    useActiveInstitute: () => ({
      activeInstituteId: "inst-1",
      activeInstitute: { id: "inst-1", name: "آموزشگاه" },
    }),
  }
})

const mockBatchCreate = vi.fn().mockResolvedValue({})
const defaultMockProposals = [
  {
    title: "مهر و آبان ۱۴۰۳",
    startDate: "2024-09-22",
    startDateJalali: "1403/07/01",
    endDate: "2024-11-05",
    endDateJalali: "1403/08/15",
    daysCount: 45,
    sessionsCount: 18,
    holidaysCount: 2,
    monthNamesFa: "مهر، آبان",
  },
]

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    operatingPhasesResource: {
      ...actual.operatingPhasesResource,
      list: {
        toQuery: () => ({
          queryKey: ["operating-phases"],
          queryFn: () =>
            Promise.resolve([
              {
                id: "phase-1",
                title: "فاز سال تحصیلی",
                months: [7, 8, 9, 10, 11, 12],
                startTime: "08:00",
                endTime: "20:00",
                slotDurationMinutes: 90,
                daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
              },
            ]),
        }),
      },
    },
    termsResource: {
      ...actual.termsResource,
      previewPhase: {
        toQuery: () => ({
          queryKey: ["terms", "preview-phase"],
          queryFn: () => Promise.resolve(defaultMockProposals),
        }),
      },
      batchCreatePhase: {
        toMutation: () => ({
          mutationFn: mockBatchCreate,
        }),
      },
      list: {
        baseKey: () => ["terms"],
        toQuery: () => ({
          queryKey: ["terms", "list"],
          queryFn: () => Promise.resolve([]),
        }),
      },
    },
  }
})

describe("GeneratePhaseTermsPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePhaseTermsGenerateStore.getState().reset()
    usePhaseTermsGenerateStore.setState({
      selectedPhaseId: "phase-1",
      jalaliYear: 1403,
      sessionsPerTerm: 18,
      gapDays: 2,
      proposals: defaultMockProposals,
    })
  })

  it("redirects to /terms/generate if store has no proposals", () => {
    usePhaseTermsGenerateStore.setState({ proposals: [] })
    render(<GeneratePhaseTermsPreviewPage />)

    expect(mockReplace).toHaveBeenCalledWith("/terms/generate")
  })

  it("renders Step 2 preview with breadcrumbs, calendar view and view switchers", async () => {
    render(<GeneratePhaseTermsPreviewPage />)

    expect(
      (await screen.findAllByText("بررسی و تنظیم تاریخ ترم‌ها"))[0]
    ).toBeInTheDocument()
    expect(screen.getByText("مهر و آبان ۱۴۰۳")).toBeInTheDocument()
    expect(screen.getByText("نمای تقویم")).toBeInTheDocument()
    expect(screen.getByText("نمای جدول")).toBeInTheDocument()
    expect(screen.queryByText("بازگشت")).not.toBeInTheDocument()
    expect(screen.getByText("تأیید")).toBeInTheDocument()

    // Switch to table view
    const tableViewBtn = screen.getByText("نمای جدول")
    await act(async () => {
      tableViewBtn.click()
    })

    expect(
      screen.getAllByDisplayValue("مهر و آبان ۱۴۰۳")[0]
    ).toBeInTheDocument()
    expect(screen.getAllByText("1403/08/15")[0]).toBeInTheDocument()
  })

  it("renders breadcrumb link to navigate back to /terms/generate without in-page back button", async () => {
    render(<GeneratePhaseTermsPreviewPage />)

    expect(screen.queryByText("بازگشت")).not.toBeInTheDocument()
    const parentLink = screen.getByRole("link", { name: "ساخت خودکار ترم‌ها" })
    expect(parentLink).toHaveAttribute("href", "/terms/generate")
  })

  it("submits batch create when clicking confirm button and redirects to /terms", async () => {
    mockBatchCreate.mockClear()
    render(<GeneratePhaseTermsPreviewPage />)

    const submitBtn = await screen.findByText("تأیید")
    await act(async () => {
      submitBtn.click()
    })

    expect(mockBatchCreate.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        operatingPhaseId: "phase-1",
        terms: expect.arrayContaining([
          expect.objectContaining({
            title: "مهر و آبان ۱۴۰۳",
            startDate: "2024-09-22",
            endDate: "2024-11-05",
            isActive: true,
          }),
        ]),
      })
    )
    expect(toast.success).toHaveBeenCalledWith(
      "تمام ترم‌های فاز با موفقیت ایجاد شدند."
    )
    expect(mockPush).toHaveBeenCalledWith("/terms")
  })

  it("disables submit button when terms have session imbalance", async () => {
    usePhaseTermsGenerateStore.setState({
      proposals: [
        {
          ...defaultMockProposals[0],
          hasSessionImbalance: true,
          patternDetails: [
            { track: "EVEN", completedSessions: 18 },
            { track: "ODD", completedSessions: 17 },
          ],
        },
      ],
    })

    render(<GeneratePhaseTermsPreviewPage />)

    expect(
      await screen.findByText(/هشدار ناهماهنگی جلسات/i)
    ).toBeInTheDocument()

    const submitBtn = screen.getByText("تأیید")
    expect(submitBtn.closest("button")).toBeDisabled()
  })
})

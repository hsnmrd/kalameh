import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act, waitFor } from "@/test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import GeneratePhaseTermsPage from "../page"

const { mockPush, mockBack } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
  usePathname: () => "/terms/generate",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
  usePathname: () => "/terms/generate",
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

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: () => ({
    activeInstituteId: "inst-1",
    activeInstitute: { id: "inst-1", name: "آموزشگاه" },
  }),
}))

const mockBatchCreate = vi.fn().mockResolvedValue({})
let mockExistingTerms: unknown[] = []
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
let mockPreviewProposals: unknown[] = defaultMockProposals

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
          queryFn: () => Promise.resolve(mockPreviewProposals),
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
          queryFn: () => Promise.resolve(mockExistingTerms),
        }),
      },
    },
  }
})

describe("GeneratePhaseTermsPage", () => {
  beforeEach(() => {
    mockExistingTerms = []
    mockPreviewProposals = defaultMockProposals
    vi.clearAllMocks()
  })

  it("renders Step 1 with header, breadcrumbs, and continue button", () => {
    render(<GeneratePhaseTermsPage />)

    expect(
      screen.getAllByText("ساخت هوشمند زنجیره ترم‌های فاز")[0]
    ).toBeInTheDocument()
    expect(screen.getByText("ترم‌ها و دوره‌ها")).toBeInTheDocument()
    expect(screen.getByText("ادامه")).toBeInTheDocument()
    expect(screen.getByText("انصراف")).toBeInTheDocument()
  })

  it("renders Counter controls for academic year, sessions per term, and gap days", () => {
    render(<GeneratePhaseTermsPage />)

    const jalaliYearInput = screen.getByRole("textbox", {
      name: "سال تحصیلی",
    })
    const sessionsInput = screen.getByRole("textbox", {
      name: "تعداد جلسات هر ترم",
    })
    const gapDaysInput = screen.getByRole("textbox", {
      name: "فاصله بین ترم‌ها",
    })

    expect(jalaliYearInput).toBeInTheDocument()
    expect(sessionsInput).toBeInTheDocument()
    expect(gapDaysInput).toBeInTheDocument()

    // Verify counter increment and decrement buttons are accessible
    const incrementButtons = screen.getAllByRole("button", { name: "افزایش" })
    const decrementButtons = screen.getAllByRole("button", { name: "کاهش" })

    expect(incrementButtons.length).toBe(3)
    expect(decrementButtons.length).toBe(3)
  })

  it("navigates to /terms when clicking cancel button in Step 1", async () => {
    render(<GeneratePhaseTermsPage />)

    const cancelBtn = screen.getByText("انصراف")
    await act(async () => {
      cancelBtn.click()
    })

    expect(mockPush).toHaveBeenCalledWith("/terms")
  })

  it("displays toast error and prevents advancing to Step 2 when terms already exist for selected phase and year", async () => {
    mockExistingTerms = [
      {
        id: "term-1",
        title: "ترم موجود",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        operatingPhaseId: "phase-1",
      },
    ]

    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    expect(toast.error).toHaveBeenCalledWith(
      "ترم‌های این فاز برای سال تحصیلی انتخاب‌شده قبلاً ایجاد شده‌اند."
    )
    expect(
      screen.queryByText("بررسی و تنظیم تاریخ ترم‌ها")
    ).not.toBeInTheDocument()
  })

  it("transitions to Step 2 after clicking continue and displays proposals with view switchers", async () => {
    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    // Step 2 header & breadcrumb
    expect(
      (await screen.findAllByText("بررسی و تنظیم تاریخ ترم‌ها"))[0]
    ).toBeInTheDocument()

    // Calendar view content by default
    expect(screen.getByText("مهر و آبان ۱۴۰۳")).toBeInTheDocument()
    expect(screen.getByText("نمای تقویم")).toBeInTheDocument()
    expect(screen.getByText("نمای جدول")).toBeInTheDocument()
    expect(screen.getAllByText("بازگشت")[0]).toBeInTheDocument()
    expect(screen.getAllByText("تأیید")[0]).toBeInTheDocument()

    // Switch to table view
    const tableViewBtn = screen.getByText("نمای جدول")
    await act(async () => {
      tableViewBtn.click()
    })

    // Table & Responsive Cards content
    expect(
      screen.getAllByDisplayValue("مهر و آبان ۱۴۰۳")[0]
    ).toBeInTheDocument()
    expect(screen.getAllByText("1403/08/15")[0]).toBeInTheDocument()
  })

  it("navigates back to Step 1 when clicking back button in Step 2", async () => {
    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    const backBtn = (await screen.findAllByText("بازگشت"))[0]!
    await act(async () => {
      backBtn.click()
    })

    expect(
      screen.getAllByText("ساخت هوشمند زنجیره ترم‌های فاز")[0]
    ).toBeInTheDocument()
    expect(
      screen.queryByText("بررسی و تنظیم تاریخ ترم‌ها")
    ).not.toBeInTheDocument()
  })

  it("submits batch create when clicking confirm button in Step 2 and redirects to /terms", async () => {
    mockBatchCreate.mockClear()
    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    const submitBtn = (await screen.findAllByText("تأیید"))[0]!
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

  it("disables submit button and displays error banner when terms have session imbalance", async () => {
    mockPreviewProposals = [
      {
        ...defaultMockProposals[0],
        hasSessionImbalance: true,
        patternDetails: [
          { track: "EVEN", completedSessions: 18 },
          { track: "ODD", completedSessions: 17 },
        ],
      },
    ]

    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    expect(
      await screen.findByText(/هشدار ناهماهنگی جلسات/i)
    ).toBeInTheDocument()

    const submitBtns = screen.getAllByText("تأیید")
    submitBtns.forEach((btn) => {
      expect(btn.closest("button")).toBeDisabled()
    })
  })
})

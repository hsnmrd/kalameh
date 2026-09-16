import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act, waitFor } from "../../../../../test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import { GeneratePhaseTermsModal } from "../components/generate-phase-terms-modal"

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

describe("GeneratePhaseTermsModal", () => {
  beforeEach(() => {
    mockExistingTerms = []
    mockPreviewProposals = defaultMockProposals
    vi.clearAllMocks()
  })

  it("renders Step 1 with header and continue button without step badge", () => {
    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    expect(
      screen.getByText("ساخت هوشمند زنجیره ترم‌های فاز")
    ).toBeInTheDocument()
    expect(screen.queryByText(/مرحله 1/i)).not.toBeInTheDocument()
    expect(screen.getByText("ادامه")).toBeInTheDocument()
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

    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

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
      screen.getByText("ساخت هوشمند زنجیره ترم‌های فاز")
    ).toBeInTheDocument()
    expect(
      screen.queryByText("بررسی و تنظیم تاریخ ترم‌ها")
    ).not.toBeInTheDocument()
  })

  it("transitions to Step 2 after clicking continue and displays proposals table with concise buttons", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    // Step 2 header (no step badge)
    expect(
      await screen.findByText("بررسی و تنظیم تاریخ ترم‌ها")
    ).toBeInTheDocument()
    expect(screen.queryByText(/مرحله 2/i)).not.toBeInTheDocument()

    // Calendar view content by default
    expect(screen.getByText("مهر و آبان ۱۴۰۳")).toBeInTheDocument()
    expect(screen.getByText("نمای تقویم")).toBeInTheDocument()
    expect(screen.getByText("نمای جدول")).toBeInTheDocument()
    expect(screen.getByText("بازگشت")).toBeInTheDocument()
    expect(screen.getByText("تأیید")).toBeInTheDocument()

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

  it("navigates back to Step 1 when clicking back button", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    const backBtn = await screen.findByText("بازگشت")
    await act(async () => {
      backBtn.click()
    })

    expect(
      screen.getByText("ساخت هوشمند زنجیره ترم‌های فاز")
    ).toBeInTheDocument()
    expect(screen.queryByText(/مرحله 1/i)).not.toBeInTheDocument()
  })

  it("submits batch create when clicking confirm button in Step 2", async () => {
    mockBatchCreate.mockClear()
    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

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
          }),
        ]),
      })
    )
  })

  it("disables submit button and displays error banner when terms have session imbalance", async () => {
    mockPreviewProposals = [
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
        hasSessionImbalance: true,
        patternDetails: [
          {
            track: "EVEN",
            days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            completedSessions: 20,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: true,
          },
          {
            track: "ODD",
            days: ["SUNDAY", "TUESDAY", "THURSDAY"],
            completedSessions: 18,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: false,
          },
        ],
      },
    ]

    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    // Shows session imbalance warning and details
    expect(await screen.findByText(/هشدار ناهماهنگی جلسات/)).toBeInTheDocument()
    expect(
      screen.getByText(/جلسات زوج .* و فرد .* برابر نیستند/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/امکان ایجاد ترم به دلیل ناهمخوانی جلسات/)
    ).not.toBeInTheDocument()

    // Submit button must be disabled
    const submitBtn = screen.getByText("تأیید").closest("button")
    expect(submitBtn).toBeDisabled()
  })

  it("only shows session imbalance warning for the active term and hides when selecting a balanced term", async () => {
    mockPreviewProposals = [
      {
        title: "ترم اول نامتعادل",
        startDate: "2024-09-22",
        startDateJalali: "1403/07/01",
        endDate: "2024-11-05",
        endDateJalali: "1403/08/15",
        daysCount: 45,
        sessionsCount: 18,
        holidaysCount: 2,
        monthNamesFa: "مهر، آبان",
        hasSessionImbalance: true,
        patternDetails: [
          {
            track: "EVEN",
            days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            completedSessions: 20,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: true,
          },
          {
            track: "ODD",
            days: ["SUNDAY", "TUESDAY", "THURSDAY"],
            completedSessions: 18,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: false,
          },
        ],
      },
      {
        title: "ترم دوم متعادل",
        startDate: "2024-11-07",
        startDateJalali: "1403/08/17",
        endDate: "2024-12-21",
        endDateJalali: "1403/09/30",
        daysCount: 45,
        sessionsCount: 18,
        holidaysCount: 0,
        monthNamesFa: "آبان، آذر",
        hasSessionImbalance: false,
        patternDetails: [
          {
            track: "EVEN",
            days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            completedSessions: 18,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: false,
          },
          {
            track: "ODD",
            days: ["SUNDAY", "TUESDAY", "THURSDAY"],
            completedSessions: 18,
            targetSessions: 18,
            compensatoryCount: 0,
            hasExcess: false,
          },
        ],
      },
    ]

    render(<GeneratePhaseTermsModal open={true} onClose={vi.fn()} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    // Active term is Term 1 (imbalanced): warning must be shown
    expect(
      await screen.findByText(/هشدار ناهماهنگی جلسات: ترم اول نامتعادل/)
    ).toBeInTheDocument()

    // Switch to Term 2 (balanced)
    const term2Chip = screen.getByText("ترم دوم متعادل")
    await act(async () => {
      term2Chip.click()
    })

    // Warning should no longer be visible
    expect(screen.queryByText(/هشدار ناهماهنگی جلسات/)).not.toBeInTheDocument()

    // Switch back to Term 1 (imbalanced)
    const term1Chip = screen.getByText("ترم اول نامتعادل")
    await act(async () => {
      term1Chip.click()
    })

    // Warning should reappear
    expect(
      screen.getByText(/هشدار ناهماهنگی جلسات: ترم اول نامتعادل/)
    ).toBeInTheDocument()
  })
})

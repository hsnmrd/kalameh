import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act, waitFor } from "@/test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import { usePhaseTermsGenerateStore } from "@/lib/stores"
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
    vi.clearAllMocks()
    usePhaseTermsGenerateStore.getState().reset()
    mockExistingTerms = []
    mockPreviewProposals = defaultMockProposals
  })

  it("renders Step 1 with header, breadcrumbs, and continue button", () => {
    render(<GeneratePhaseTermsPage />)

    expect(screen.getAllByText("ساخت خودکار ترم‌ها")[0]).toBeInTheDocument()
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
    expect(sessionsInput).toHaveValue("15")
    expect(gapDaysInput).toBeInTheDocument()

    // Verify counter increment and decrement buttons are accessible
    const incrementButtons = screen.getAllByRole("button", { name: "افزایش" })
    const decrementButtons = screen.getAllByRole("button", { name: "کاهش" })

    expect(incrementButtons.length).toBe(3)
    expect(decrementButtons.length).toBe(3)
  })

  it("normalizes legacy 18 sessionsPerTerm to default 15 on page load", () => {
    usePhaseTermsGenerateStore.setState({ sessionsPerTerm: 18 })
    render(<GeneratePhaseTermsPage />)

    const sessionsInput = screen.getByRole("textbox", {
      name: "تعداد جلسات هر ترم",
    })
    expect(sessionsInput).toHaveValue("15")
  })

  it("navigates to /terms when clicking cancel button in Step 1", async () => {
    render(<GeneratePhaseTermsPage />)

    const cancelBtn = screen.getByText("انصراف")
    await act(async () => {
      cancelBtn.click()
    })

    expect(mockPush).toHaveBeenCalledWith("/terms")
  })

  it("allows advancing to Step 2 without displaying conflict toast error when existing terms exist", async () => {
    mockExistingTerms = [
      {
        id: "term-1",
        title: "ترم موجود",
        startDate: "2024-10-01",
        endDate: "2024-10-15",
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

    expect(toast.error).not.toHaveBeenCalledWith(
      expect.stringContaining("تداخل")
    )
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/terms/generate/preview")
    })
  })

  it("fetches proposals and navigates to /terms/generate/preview after clicking continue", async () => {
    render(<GeneratePhaseTermsPage />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/terms/generate/preview")
    })
  })

  it("disables continue button and displays warning alert when selected phase is in the past", async () => {
    usePhaseTermsGenerateStore.setState({ jalaliYear: 1402 })

    render(<GeneratePhaseTermsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(
          "امکان ساخت ترم برای ماه‌های گذشته وجود ندارد. تمام ماه‌های این فاز در سال تحصیلی انتخابی در گذشته قرار دارند."
        )
      ).toBeInTheDocument()
      const continueBtn = screen.getByText("ادامه")
      expect(continueBtn.closest("button")).toBeDisabled()
    })
  })
})

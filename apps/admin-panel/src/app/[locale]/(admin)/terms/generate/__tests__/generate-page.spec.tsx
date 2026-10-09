import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@/test/test-utils"
import { usePhaseTermsGenerateStore } from "@/lib/stores"
import GeneratePhaseTermsPage from "../page"

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/terms/generate",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
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
const defaultMockProposals = [
  {
    title: "مهر و آبان ۱۴۰۶",
    startDate: "2027-09-23",
    startDateJalali: "1406/07/01",
    endDate: "2027-11-06",
    endDateJalali: "1406/08/15",
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

describe("GeneratePhaseTermsPage (/terms/generate)", () => {
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

  it("renders preview content at /terms/generate with breadcrumb, calendar view, and edit config button without table view", () => {
    render(<GeneratePhaseTermsPage />)

    expect(screen.getByText("مهر و آبان ۱۴۰۶")).toBeInTheDocument()
    expect(screen.getByText("ویرایش تنظیمات")).toBeInTheDocument()
    expect(screen.getByText("تأیید")).toBeInTheDocument()
    expect(screen.queryByText("نمای جدول")).not.toBeInTheDocument()
    expect(screen.queryByText("نمای تقویم")).not.toBeInTheDocument()
    expect(screen.queryByText("بازگشت")).not.toBeInTheDocument()
  })

  it("opens generatePhaseTerms modal when clicking edit config filter button", async () => {
    render(<GeneratePhaseTermsPage />)

    const editConfigBtn = screen.getByRole("button", {
      name: /ویرایش تنظیمات/i,
    })
    await act(async () => {
      editConfigBtn.click()
    })

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("modal=generatePhaseTerms"),
      expect.anything()
    )
  })

  it("redirects to /terms?modal=generatePhaseTerms if accessed without proposals", () => {
    usePhaseTermsGenerateStore.setState({ proposals: [] })
    render(<GeneratePhaseTermsPage />)

    expect(mockReplace).toHaveBeenCalledWith("/terms?modal=generatePhaseTerms")
  })

  it("renders breadcrumb link to navigate back to /terms without in-page back button", () => {
    render(<GeneratePhaseTermsPage />)

    expect(screen.queryByText("بازگشت")).not.toBeInTheDocument()
    const parentLinks = screen.getAllByRole("link", {
      name: "ترم‌ها و دوره‌ها",
    })
    expect(parentLinks.length).toBeGreaterThan(0)
    expect(parentLinks[0]).toHaveAttribute("href", "/terms")
  })

  it("submits batch create when clicking confirm button and redirects to /terms", async () => {
    mockBatchCreate.mockClear()
    render(<GeneratePhaseTermsPage />)

    const submitBtn = await screen.findByText("تأیید")
    await act(async () => {
      submitBtn.click()
    })

    expect(mockBatchCreate.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        operatingPhaseId: "phase-1",
        terms: expect.arrayContaining([
          expect.objectContaining({
            title: "مهر و آبان ۱۴۰۶",
            startDate: "2027-09-23",
            endDate: "2027-11-06",
            isActive: true,
          }),
        ]),
      })
    )
    expect(mockPush).toHaveBeenCalledWith("/terms")
  })

  it("disables submit button when terms have session imbalance", () => {
    usePhaseTermsGenerateStore.setState({
      proposals: [
        {
          ...defaultMockProposals[0]!,
          hasSessionImbalance: true,
          patternDetails: [
            { track: "EVEN", completedSessions: 8, targetSessions: 9 },
            { track: "ODD", completedSessions: 9, targetSessions: 9 },
          ],
        },
      ],
    })

    render(<GeneratePhaseTermsPage />)

    const submitBtn = screen.getByText("تأیید")
    expect(submitBtn.closest("button")).toBeDisabled()
  })

  it("disables submit button and shows warning alert when proposals are in the past", () => {
    usePhaseTermsGenerateStore.setState({
      proposals: [
        {
          ...defaultMockProposals[0]!,
          startDate: "2020-01-01",
          endDate: "2020-02-01",
        },
      ],
    })

    render(<GeneratePhaseTermsPage />)

    expect(
      screen.getByText(
        "امکان تعریف ترم برای ماه‌های گذشته وجود ندارد. حداقل یک روز از ترم باید در آینده باشد."
      )
    ).toBeInTheDocument()
    const submitBtn = screen.getByText("تأیید")
    expect(submitBtn.closest("button")).toBeDisabled()
  })
})

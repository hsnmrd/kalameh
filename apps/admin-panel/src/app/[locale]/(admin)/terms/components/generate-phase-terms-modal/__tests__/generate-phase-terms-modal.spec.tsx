import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act, waitFor } from "@/test/test-utils"
import { usePhaseTermsGenerateStore } from "@/lib/stores"
import { GeneratePhaseTermsModal } from "../index"

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/terms",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/terms",
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

describe("GeneratePhaseTermsModal", () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    usePhaseTermsGenerateStore.getState().reset()
  })

  it("renders modal header, phase select, counters, and footer buttons", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={mockOnClose} />)

    expect(
      screen.getByRole("heading", { name: "ساخت خودکار ترم‌ها" })
    ).toBeInTheDocument()
    expect(await screen.findByText("فاز سال تحصیلی")).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "سال تحصیلی" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "تعداد جلسات هر ترم" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "فاصله بین ترم‌ها" })
    ).toBeInTheDocument()
    expect(screen.getByText("انصراف")).toBeInTheDocument()
    expect(screen.getByText("ادامه")).toBeInTheDocument()
  })

  it("places gap days and sessions counters side-by-side in a 2-column grid", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={mockOnClose} />)

    const sessionsInput = screen.getByRole("textbox", {
      name: "تعداد جلسات هر ترم",
    })
    const gapDaysInput = screen.getByRole("textbox", {
      name: "فاصله بین ترم‌ها",
    })

    const sessionsGrid = sessionsInput.closest(".grid")
    const gapDaysGrid = gapDaysInput.closest(".grid")

    expect(sessionsGrid).not.toBeNull()
    expect(sessionsGrid).toBe(gapDaysGrid)
    expect(sessionsGrid?.className).toContain("grid-cols-2")
  })

  it("calls onClose when clicking cancel button", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={mockOnClose} />)

    const cancelBtn = screen.getByText("انصراف")
    await act(async () => {
      cancelBtn.click()
    })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("navigates to /terms/generate and closes modal when clicking continue button", async () => {
    render(<GeneratePhaseTermsModal open={true} onClose={mockOnClose} />)

    const continueBtn = screen.getByText("ادامه")
    await waitFor(() => {
      expect(continueBtn.closest("button")).not.toBeDisabled()
    })

    await act(async () => {
      continueBtn.click()
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/terms/generate")
    })
  })

  it("disables continue button and displays warning alert when selected phase is in the past", async () => {
    usePhaseTermsGenerateStore.setState({ jalaliYear: 1402 })

    render(<GeneratePhaseTermsModal open={true} onClose={mockOnClose} />)

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

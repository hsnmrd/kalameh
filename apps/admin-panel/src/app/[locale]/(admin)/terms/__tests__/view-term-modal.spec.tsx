import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ViewTermModal } from "../components/view-term-modal"
import type { TermDto } from "@workspace/types"

// Mock API resources for term details, phases, and custom off days
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      list: {
        ...actual.termsResource.list,
        baseKey: () => ["terms"],
        toQuery: (params?: unknown) => ({
          queryKey: ["terms", params],
          queryFn: vi.fn().mockResolvedValue([]),
        }),
      },
    },
    institutesResource: {
      ...actual.institutesResource,
      detail: {
        ...actual.institutesResource.detail,
        toQuery: () => ({
          queryKey: ["institutes", "detail"],
          queryFn: vi.fn().mockResolvedValue({ observeOfficialHolidays: true }),
        }),
      },
      customOffDays: {
        ...actual.institutesResource.customOffDays,
        toQuery: () => ({
          queryKey: ["institutes", "customOffDays"],
          queryFn: vi.fn().mockResolvedValue([]),
        }),
      },
    },
    operatingPhasesResource: {
      ...actual.operatingPhasesResource,
      list: {
        ...actual.operatingPhasesResource.list,
        toQuery: () => ({
          queryKey: ["operating-phases"],
          queryFn: vi.fn().mockResolvedValue([
            {
              id: "phase-1",
              title: "فاز ترم پاییز",
              months: [7, 8, 9],
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            },
          ]),
        }),
      },
    },
  }
})

describe("ViewTermModal Component", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "پاییز ۱۴۰۵",
    startDate: "2026-09-23T00:00:00.000Z",
    endDate: "2026-11-06T00:00:00.000Z",
    isActive: true,
    classesCount: 5,
    operatingPhaseId: "phase-1",
    operatingPhase: {
      id: "phase-1",
      title: "فاز ترم پاییز",
      months: [7, 8, 9],
      startTime: "08:00",
      endTime: "18:00",
      slotDurationMinutes: 90,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("renders read-only term information when open", () => {
    render(
      <ViewTermModal
        term={mockTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[mockTerm]}
      />
    )

    // Modal title
    expect(screen.getByText("مشاهده اطلاعات ترم")).toBeInTheDocument()

    // Term Title (appears in summary card and calendar legend chip)
    expect(screen.getAllByText("پاییز ۱۴۰۵").length).toBeGreaterThanOrEqual(1)

    // Phase Title
    expect(screen.getByText("فاز ترم پاییز")).toBeInTheDocument()

    // Classes count is visible
    expect(screen.getByText(/تعداد کلاس‌ها/)).toBeInTheDocument()

    // Start Date & End Date labels are visible
    expect(screen.getByText("تاریخ شروع")).toBeInTheDocument()
    expect(screen.getByText(/تاریخ پایان/)).toBeInTheDocument()

    // Calendar is rendered
    expect(
      screen.getByText(/تقویم و زنجیره ترم‌های فاز|پیش‌نمایش تقویم/)
    ).toBeInTheDocument()

    // Proposed terms carousel section is completely removed in view mode
    expect(screen.queryByText("ترم‌های پیشنهادی")).not.toBeInTheDocument()
  })

  it("does NOT render editable form inputs or submit button", () => {
    render(
      <ViewTermModal
        term={mockTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[mockTerm]}
      />
    )

    // No text input fields
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    // No submit button
    expect(
      screen.queryByRole("button", { name: /ذخیره|ثبت|تأیید/i })
    ).not.toBeInTheDocument()

    // Only Close button should be present
    expect(screen.getByRole("button", { name: "بستن" })).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <ViewTermModal
        term={mockTerm}
        open={true}
        onClose={handleClose}
        allTerms={[mockTerm]}
      />
    )

    const closeBtn = screen.getByRole("button", { name: "بستن" })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("renders standalone term without operating phase gracefully", () => {
    const standaloneTerm: TermDto = {
      ...mockTerm,
      id: "term-standalone",
      operatingPhaseId: null,
      operatingPhase: null,
    }

    render(
      <ViewTermModal
        term={standaloneTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[standaloneTerm]}
      />
    )

    expect(screen.getByText("بدون فاز تحصیلی (مستقل)")).toBeInTheDocument()
  })

  it("renders all carousel info cards with equal basis-[260px] width", () => {
    render(
      <ViewTermModal
        term={mockTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[mockTerm]}
      />
    )

    const carousel = screen.getByTestId("term-info-carousel")
    const slides = carousel.querySelectorAll('[data-slot="carousel-item"]')
    expect(slides.length).toBe(4)
    slides.forEach((slide) => {
      expect(slide.className).toContain("basis-[260px]")
      expect(slide.className).toContain("shrink-0")
    })
  })
})

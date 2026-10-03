import { describe, it, expect, vi } from "vitest"
import { render, screen, act, fireEvent } from "../../../../../test/test-utils"
import { EditTermModal } from "../components/edit-term-modal"
import type { TermDto } from "@workspace/types"

// Mock DatePicker to allow direct value change in tests
vi.mock("@workspace/ui/components/date-picker", () => ({
  DatePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string
    onChange?: (val: string) => void
    placeholder?: string
  }) => (
    <input
      data-testid={placeholder}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

const { mockUpdateMutate } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
}))

// Mock terms update mutation and query endpoints while keeping others intact
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      update: {
        ...actual.termsResource.update,
        toMutation: () => ({
          mutationFn: mockUpdateMutate,
        }),
      },
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
      createCustomOffDay: {
        toMutation: () => ({ mutationFn: vi.fn() }),
      },
      deleteCustomOffDay: {
        toMutation: () => ({ mutationFn: vi.fn() }),
      },
    },
    operatingPhasesResource: {
      ...actual.operatingPhasesResource,
      list: {
        ...actual.operatingPhasesResource.list,
        toQuery: () => ({
          queryKey: ["operatingPhases"],
          queryFn: vi.fn().mockResolvedValue([]),
        }),
      },
    },
  }
})

describe("EditTermModal Component - Form Fields & Date Change Warning", () => {
  const mockTermWithClasses: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "پاییز ۱۴۰۵",
    startDate: "2026-09-23",
    endDate: "2026-11-02",
    isActive: true,
    classesCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockTermWithoutClasses: TermDto = {
    id: "term-2",
    instituteId: "inst-1",
    title: "زمستان ۱۴۰۵",
    startDate: "2026-12-22",
    endDate: "2027-03-19",
    isActive: true,
    classesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("does NOT render Phase select, Start Date, or End Date input fields", () => {
    render(
      <EditTermModal term={mockTermWithClasses} open={true} onClose={vi.fn()} />
    )

    // Title and Status inputs are rendered
    expect(screen.getByText("عنوان ترم")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(mockTermWithClasses.title)
    ).toBeInTheDocument()
    expect(screen.getByText(/وضعیت فعال بودن ترم/i)).toBeInTheDocument()

    // No input or select for phase, start date, or end date
    expect(screen.queryByTestId("تاریخ شروع")).not.toBeInTheDocument()
    expect(screen.queryByTestId("تاریخ پایان")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: /فاز/i })
    ).not.toBeInTheDocument()
  })

  it("should NOT show warning initially when dates are unchanged", () => {
    render(
      <EditTermModal term={mockTermWithClasses} open={true} onClose={vi.fn()} />
    )

    expect(
      screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
    ).not.toBeInTheDocument()
  })

  it("should NOT show warning if term has 0 classes even when date changes via calendar", async () => {
    render(
      <EditTermModal
        term={mockTermWithoutClasses}
        open={true}
        onClose={vi.fn()}
      />
    )

    const dayButtons = screen.getAllByRole("button")
    const day5 = dayButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.includes("5-ام") ||
        btn.textContent?.trim() === "۵" ||
        btn.textContent?.trim() === "5"
    )
    if (day5) {
      await act(async () => {
        fireEvent.click(day5)
      })
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      await act(async () => {
        fireEvent.click(setStartBtn)
      })

      expect(
        screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
      ).not.toBeInTheDocument()
    }
  })

  it("should show warning when date is changed on a term with classes, and hide when reverted", async () => {
    render(
      <EditTermModal term={mockTermWithClasses} open={true} onClose={vi.fn()} />
    )

    const dayButtons = screen.getAllByRole("button")
    // Day 4 (1405/07/04)
    const day4 = dayButtons.find(
      (btn) =>
        btn.getAttribute("aria-label")?.includes("4-ام") ||
        btn.textContent?.trim() === "۴" ||
        btn.textContent?.trim() === "4"
    )
    expect(day4).toBeDefined()
    if (day4) {
      await act(async () => {
        fireEvent.click(day4)
      })
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      await act(async () => {
        fireEvent.click(setStartBtn)
      })

      expect(
        screen.getByText(/برای این ترم .* کلاس تعریف شده است/i)
      ).toBeInTheDocument()

      // Revert back to Day 1 (1405/07/01)
      const day1 = screen
        .getAllByRole("button")
        .find(
          (btn) =>
            btn.getAttribute("aria-label")?.includes("1-ام") ||
            btn.textContent?.trim() === "۱" ||
            btn.textContent?.trim() === "1"
        )
      if (day1) {
        await act(async () => {
          fireEvent.click(day1)
        })
        const revertBtn = screen.getByRole("button", { name: /شروع ترم/ })
        await act(async () => {
          fireEvent.click(revertBtn)
        })

        expect(
          screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
        ).not.toBeInTheDocument()
      }
    }
  })
})

describe("EditTermModal Component - ProposalsCalendar Integration", () => {
  const siblingTerm: TermDto = {
    id: "term-sibling",
    instituteId: "inst-1",
    title: "تابستان ۱۴۰۵",
    startDate: "2026-06-22",
    endDate: "2026-09-21",
    isActive: false,
    operatingPhaseId: "phase-school",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const activePhaseTerm: TermDto = {
    id: "term-active",
    instituteId: "inst-1",
    title: "پاییز ۱۴۰۵",
    startDate: "2026-09-23",
    endDate: "2026-12-21",
    isActive: true,
    operatingPhaseId: "phase-school",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("renders ProposalsCalendar for phase terms without the unclickable proposed terms section", () => {
    render(
      <EditTermModal
        term={activePhaseTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[siblingTerm, activePhaseTerm]}
      />
    )

    // Calendar section header appears
    expect(screen.getByText("تقویم و زنجیره ترم‌های فاز")).toBeInTheDocument()

    // Proposed terms carousel chips are not rendered in edit mode
    expect(screen.queryByText("ترم‌های پیشنهادی")).not.toBeInTheDocument()
    expect(screen.queryByText("فقط خواندنی")).not.toBeInTheDocument()
  })

  it("renders single-term ProposalsCalendar for standalone terms without operatingPhaseId", () => {
    const standaloneTerm: TermDto = {
      id: "term-standalone",
      instituteId: "inst-1",
      title: "دوره فشرده مکالمه",
      startDate: "2026-09-23",
      endDate: "2026-12-21",
      isActive: true,
      operatingPhaseId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    render(
      <EditTermModal term={standaloneTerm} open={true} onClose={vi.fn()} />
    )

    expect(screen.getByText("پیش‌نمایش تقویم جلسات ترم")).toBeInTheDocument()
    expect(screen.getByDisplayValue("دوره فشرده مکالمه")).toBeInTheDocument()
  })

  it("normalizes target sessions to phase standard when changing start date on a term with shortened dates", async () => {
    mockUpdateMutate.mockClear()

    const validPhaseId = "a0000000-0000-4000-8000-000000000001"

    // Sibling term has 18 sessions
    const siblingWith18: TermDto = {
      id: "b0000000-0000-4000-8000-000000000001",
      instituteId: "inst-1",
      title: "تابستان ۱۴۰۵",
      startDate: "2026-06-22",
      endDate: "2026-08-03",
      isActive: false,
      operatingPhaseId: validPhaseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Active term has an artificially shortened date range (e.g. 10 sessions)
    const activeShortenedTerm: TermDto = {
      id: "b0000000-0000-4000-8000-000000000002",
      instituteId: "inst-1",
      title: "پاییز ۱۴۰۵",
      startDate: "2026-09-23",
      endDate: "2026-10-14",
      isActive: true,
      operatingPhaseId: validPhaseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    render(
      <EditTermModal
        term={activeShortenedTerm}
        open={true}
        onClose={vi.fn()}
        allTerms={[siblingWith18, activeShortenedTerm]}
      />
    )

    // Sibling term is not rendered in legend since legend is hidden, active term title is in the input
    expect(screen.getByDisplayValue("پاییز ۱۴۰۵")).toBeInTheDocument()
    expect(screen.queryByText("تابستان ۱۴۰۵")).not.toBeInTheDocument()

    // When clicking a day on the calendar to set new start date, recalculation uses the sibling's standard (18 sessions)
    const day4 = screen
      .getAllByRole("button")
      .find(
        (btn) =>
          btn.getAttribute("aria-label")?.includes("4-ام") ||
          btn.textContent?.trim() === "۴" ||
          btn.textContent?.trim() === "4"
      )
    expect(day4).toBeDefined()
    if (day4) {
      await act(async () => {
        fireEvent.click(day4)
      })
      const setStartBtn = screen.getByRole("button", { name: /شروع ترم/ })
      await act(async () => {
        fireEvent.click(setStartBtn)
      })

      // Submit form to verify recalculated dates normalized to 18 sessions
      const submitBtn = screen.getByRole("button", { name: /ذخیره/ })
      await act(async () => {
        fireEvent.click(submitBtn)
      })

      expect(mockUpdateMutate.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          id: activeShortenedTerm.id,
          body: expect.objectContaining({
            startDate: "2026-09-26",
            endDate: "2026-11-04",
          }),
        })
      )
    }
  })
})

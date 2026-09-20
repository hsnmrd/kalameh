import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "../../../../../test/test-utils"
import { CreateTermModal } from "../components/create-term-modal"
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

// Mock API resources
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      create: {
        ...actual.termsResource.create,
        toMutation: () => ({
          mutationFn: vi.fn(),
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
          queryFn: vi.fn().mockResolvedValue([
            {
              id: "phase-school",
              title: "مدرسه",
              months: [7, 8, 9, 10, 11, 12],
              daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
            },
          ]),
        }),
      },
    },
  }
})

describe("CreateTermModal Component", () => {
  const existingPhaseTerm: TermDto = {
    id: "term-existing-1",
    instituteId: "inst-1",
    title: "تابستان ۱۴۰۵",
    startDate: "2026-06-22",
    endDate: "2026-09-21",
    isActive: false,
    operatingPhaseId: "phase-school",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("renders initial create modal fields", () => {
    render(<CreateTermModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText("تعریف ترم تحصیلی جدید")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("مثلاً پاییز ۱۴۰۵")).toBeInTheDocument()
  })

  it("renders ProposalsCalendar when dates are filled and locks to the new draft term", async () => {
    render(
      <CreateTermModal
        open={true}
        onClose={vi.fn()}
        allTerms={[existingPhaseTerm]}
      />
    )

    const startDateInput = screen.getByTestId("تاریخ شروع")
    const endDateInput = screen.getByTestId("تاریخ پایان")

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeSetter?.call(startDateInput, "2026-09-23")
      startDateInput.dispatchEvent(new Event("change", { bubbles: true }))
      nativeSetter?.call(endDateInput, "2026-12-21")
      endDateInput.dispatchEvent(new Event("change", { bubbles: true }))
    })

    // Calendar preview should now be rendered
    expect(screen.getByText("پیش‌نمایش تقویم جلسات ترم")).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "../../../../../test/test-utils"
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

// Mock terms update mutation while keeping authResource intact
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      update: {
        toMutation: () => ({
          mutationFn: vi.fn(),
        }),
      },
      list: {
        baseKey: () => ["terms"],
      },
    },
  }
})

describe("EditTermModal Component - Date Change Warning", () => {
  const mockTermWithClasses: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "پاییز ۱۴۰۵",
    startDate: "2026-09-23",
    endDate: "2026-12-21",
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

  it("should NOT show warning initially when dates are unchanged", () => {
    render(
      <EditTermModal term={mockTermWithClasses} open={true} onClose={vi.fn()} />
    )

    expect(
      screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
    ).not.toBeInTheDocument()
  })

  it("should NOT show warning if term has 0 classes even when date changes", async () => {
    render(
      <EditTermModal
        term={mockTermWithoutClasses}
        open={true}
        onClose={vi.fn()}
      />
    )

    const startDateInput = screen.getByTestId("تاریخ شروع")
    await act(async () => {
      startDateInput.focus()
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeInputValueSetter?.call(startDateInput, "2026-10-01")
      startDateInput.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(
      screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
    ).not.toBeInTheDocument()
  })

  it("should show warning when date is changed on a term with classes, and hide when reverted", async () => {
    render(
      <EditTermModal term={mockTermWithClasses} open={true} onClose={vi.fn()} />
    )

    const startDateInput = screen.getByTestId("تاریخ شروع")

    // 1. Change start date -> warning should appear
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeInputValueSetter?.call(startDateInput, "2026-10-01")
      startDateInput.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(
      screen.getByText(/برای این ترم .* کلاس تعریف شده است/i)
    ).toBeInTheDocument()

    // 2. Revert back to original start date -> warning should hide
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeInputValueSetter?.call(startDateInput, "2026-09-23")
      startDateInput.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(
      screen.queryByText(/برای این ترم .* کلاس تعریف شده است/i)
    ).not.toBeInTheDocument()
  })
})

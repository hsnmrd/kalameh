import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SchedulingRecoveryOption } from "@workspace/types"
import { RecoveryOptionsSelection } from "../index"

const translationDict: Record<string, string> = {
  branchPrefix: "راهکار {number}",
  "recovery.rescheduleTitle": "تغییر زمان کلاس برای استاد آزاد",
  "recovery.suggestionsCount": "{count} بازه پیشنهادی",
  "recovery.carouselCounter": "گزینه {current} از {total}",
  "recovery.applyAction": "انتخاب این زمان",
  "recovery.roomWithCapacity": "{room} (ظرفیت {capacity} نفر)",
  "recovery.teacher": "استاد",
  "recovery.onlineRoom": "آنلاین",
  "recovery.noEmptyRoom": "بدون کلاس خالی",
}

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    const template = translationDict[key] ?? key
    if (values) {
      return Object.entries(values).reduce(
        (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
        template
      )
    }
    return template
  },
  useLocale: () => "fa",
}))

describe("RecoveryOptionsSelection Component", () => {
  const mockOptions: SchedulingRecoveryOption[] = [
    {
      key: "opt-1",
      status: "AVAILABLE_NOW",
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      startTime: "16:30",
      endTime: "18:00",
      teacher: {
        id: "00000000-0000-0000-0000-000000000001",
        firstName: "علی",
        lastName: "حسینی",
        avatarUrl: null,
      },
      availableClassrooms: [
        {
          id: "00000000-0000-0000-0000-000000000101",
          name: "کلاس ۱۰۱",
          capacity: 25,
        },
      ],
      blockingClasses: [],
    },
    {
      key: "opt-2",
      status: "REQUIRES_PLAN_CHANGE",
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SUNDAY", "TUESDAY"],
      startTime: "10:00",
      endTime: "12:00",
      teacher: {
        id: "00000000-0000-0000-0000-000000000002",
        firstName: "مریم",
        lastName: "قاسمی",
        avatarUrl: null,
      },
      availableClassrooms: [
        {
          id: "00000000-0000-0000-0000-000000000102",
          name: "کلاس ۱۰۲",
          capacity: 20,
        },
      ],
      blockingClasses: [],
    },
  ]

  it("returns null when options array is empty", () => {
    const { container } = render(
      <RecoveryOptionsSelection
        branchNumber={2}
        options={[]}
        canApply={true}
        onApply={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders recovery section with title, branch badge and cards", () => {
    render(
      <RecoveryOptionsSelection
        branchNumber={2}
        options={mockOptions}
        canApply={true}
        onApply={vi.fn()}
      />
    )

    expect(screen.getByTestId("recovery-options-selection")).toBeInTheDocument()
    expect(
      screen.getByText("تغییر زمان کلاس برای استاد آزاد")
    ).toBeInTheDocument()
    expect(screen.getByText("راهکار ۲")).toBeInTheDocument()
    expect(screen.getByText("علی حسینی")).toBeInTheDocument()
    expect(screen.getByText("مریم قاسمی")).toBeInTheDocument()
    expect(screen.getByText(/کلاس ۱۰۱/)).toBeInTheDocument()
  })

  it("calls onApply when apply action button is clicked", async () => {
    const handleApply = vi.fn().mockResolvedValue(undefined)
    render(
      <RecoveryOptionsSelection
        branchNumber={2}
        options={mockOptions}
        canApply={true}
        onApply={handleApply}
      />
    )

    const applyButtons = screen.getAllByRole("button", {
      name: /انتخاب این زمان/i,
    })
    expect(applyButtons.length).toBe(2)

    await act(async () => {
      fireEvent.click(applyButtons[0])
    })
    expect(handleApply).toHaveBeenCalledWith(mockOptions[0])
  })

  it("disables apply button when canApply is false", () => {
    const handleApply = vi.fn()
    render(
      <RecoveryOptionsSelection
        branchNumber={2}
        options={mockOptions}
        canApply={false}
        onApply={handleApply}
      />
    )

    const applyButtons = screen.getAllByRole("button", {
      name: /انتخاب این زمان/i,
    })
    expect(applyButtons[0]).toBeDisabled()

    fireEvent.click(applyButtons[0])
    expect(handleApply).not.toHaveBeenCalled()
  })

  it("disables apply button when isPending is true", () => {
    const handleApply = vi.fn()
    render(
      <RecoveryOptionsSelection
        branchNumber={2}
        options={mockOptions}
        canApply={true}
        isPending={true}
        onApply={handleApply}
      />
    )

    const applyButtons = screen.getAllByRole("button", {
      name: /انتخاب این زمان/i,
    })
    expect(applyButtons[0]).toBeDisabled()

    fireEvent.click(applyButtons[0])
    expect(handleApply).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  within,
} from "../../../../../test/test-utils"
import { HolidaysCalendar } from "../components/off-days-content/holidays-calendar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "../../../../../messages/fa/setting.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import * as React from "react"

const mockIsJalaliHoliday = vi.fn(() => ({ isHoliday: true }))

vi.mock("@workspace/types", async () => {
  const actual =
    await vi.importActual<typeof import("@workspace/types")>("@workspace/types")
  return {
    ...actual,
    isJalaliHoliday: (date: Date) => mockIsJalaliHoliday(date),
  }
})

const messages = {
  setting: settingMessagesFa,
  common: commonMessagesFa,
}

const mockInstituteId = "11111111-1111-1111-1111-111111111111"

function renderWithClient(ui: React.ReactElement, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="fa" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

describe("HolidaysCalendar Component", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsJalaliHoliday.mockReturnValue({ isHoliday: true })
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders calendar title, description and legend items", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    expect(screen.getByText("تقویم کاری و وضعیت روزها")).toBeInTheDocument()
    expect(screen.getByText("تعطیل رسمی")).toBeInTheDocument()
    expect(screen.getByText("دایر در تعطیلی رسمی")).toBeInTheDocument()
    expect(screen.getByText("تعطیلی موسسه")).toBeInTheDocument()
    // No unsaved changes initially
    expect(screen.queryByText(/تغییر ذخیره‌نشده/)).not.toBeInTheDocument()
  })

  it("shows the selected date and lets the user undo it", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    const dayButtons = document.querySelectorAll("td button")
    expect(dayButtons.length).toBeGreaterThan(0)
    fireEvent.click(dayButtons[0]!)

    expect(screen.getByText(/روز انتخاب‌شده/)).toBeInTheDocument()
    expect(screen.getByText("دایر")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /لغو تغییر/ })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /لغو تغییر/ }))

    expect(screen.queryByText(/روز انتخاب‌شده/)).not.toBeInTheDocument()
  })

  it("shows 56px save and reset actions above mobile navigation", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    const dayButtons = document.querySelectorAll("td button")
    fireEvent.click(dayButtons[0]!)

    const mobileActions = screen.getByRole("group", {
      name: "عملیات تغییرات تقویم",
    })
    expect(mobileActions).toHaveClass("fixed", "lg:hidden")

    const resetButton = within(mobileActions).getByRole("button", {
      name: "بازنشانی",
    })
    const saveButton = within(mobileActions).getByRole("button", {
      name: "ذخیره",
    })
    expect(resetButton).toHaveClass("h-14", "rounded-2xl", "text-base")
    expect(saveButton).toHaveClass("h-14", "rounded-2xl", "text-base")

    fireEvent.click(resetButton)
    expect(
      screen.queryByRole("group", { name: "عملیات تغییرات تقویم" })
    ).not.toBeInTheDocument()
  })

  it("renders the year toolbar and allows year navigation and resetting", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    // Verify annual and monthly view buttons are present
    expect(screen.getByRole("button", { name: "سالانه" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ماهانه" })).toBeInTheDocument()

    // Next year and previous year buttons
    const nextYearButton = screen.getByRole("button", { name: "سال بعد" })
    const prevYearButton = screen.getByRole("button", { name: "سال قبل" })
    expect(nextYearButton).toBeInTheDocument()
    expect(prevYearButton).toBeInTheDocument()

    // Initially "سال جاری" button is not shown
    expect(
      screen.queryByRole("button", { name: "سال جاری" })
    ).not.toBeInTheDocument()

    // Navigate to next year
    fireEvent.click(nextYearButton)

    // Now "سال جاری" button appears
    const resetYearButton = screen.getByRole("button", { name: "سال جاری" })
    expect(resetYearButton).toBeInTheDocument()

    // Reset back to current year
    fireEvent.click(resetYearButton)
    expect(
      screen.queryByRole("button", { name: "سال جاری" })
    ).not.toBeInTheDocument()
  })

  it("switches between annual and monthly view on desktop", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    const monthViewButton = screen.getByRole("button", { name: "ماهانه" })
    const yearViewButton = screen.getByRole("button", { name: "سالانه" })

    // Switch to monthly view
    fireEvent.click(monthViewButton)
    // Switch back to annual view
    fireEvent.click(yearViewButton)
  })

  it("opens the create off-day modal when clicking a not-off day", () => {
    mockIsJalaliHoliday.mockReturnValue({ isHoliday: false })

    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    const dayButtons = document.querySelectorAll("td button")
    expect(dayButtons.length).toBeGreaterThan(0)
    fireEvent.click(dayButtons[0]!)

    expect(screen.getByText("افزودن تعطیلی جدید")).toBeInTheDocument()
  })
})

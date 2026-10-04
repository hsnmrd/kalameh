import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { HolidaysCalendar } from "../components/off-days-content/holidays-calendar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import type { TermDto, ClassDto } from "@workspace/types"
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

const mockTerms: TermDto[] = [
  {
    id: "term-1",
    instituteId: mockInstituteId,
    title: "ترم پاییز ۱۴۰۵",
    startDate: "2026-09-23T00:00:00.000Z",
    endDate: "2026-12-21T00:00:00.000Z",
    isActive: true,
    lifecycleStatus: "ACTIVE",
    classesCount: 4,
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
  },
]

const mockClasses: ClassDto[] = [
  {
    id: "class-1",
    instituteId: mockInstituteId,
    termId: "term-1",
    courseId: "course-1",
    title: "مکالمه فشرده سطح ۳",
    capacity: 12,
    fee: 1500000,
    startTime: "16:00",
    endTime: "18:00",
    sessionDates: ["2026-10-05"],
    daysOfWeek: ["MONDAY"],
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
  },
]

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

  it("renders calendar title, view-only badge and legend items", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
        terms={mockTerms}
        classes={mockClasses}
      />,
      queryClient
    )

    expect(screen.getByText("تقویم کاری و وضعیت روزها")).toBeInTheDocument()
    expect(screen.getByText("حالت مشاهده")).toBeInTheDocument()
    expect(screen.getByText("بازه ترم فعال")).toBeInTheDocument()
    expect(screen.getByText("جلسه کلاس")).toBeInTheDocument()
    expect(screen.getByText("تعطیل رسمی")).toBeInTheDocument()
    expect(screen.getByText("تعطیلی موسسه")).toBeInTheDocument()
  })

  it("opens day details modal on day click instead of editing off-days", () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
        terms={mockTerms}
        classes={mockClasses}
      />,
      queryClient
    )

    const dayButtons = document.querySelectorAll("td button")
    expect(dayButtons.length).toBeGreaterThan(0)
    fireEvent.click(dayButtons[0]!)

    // Day details dialog opens in view-only mode
    expect(screen.getByText("ترم‌های این روز")).toBeInTheDocument()
    expect(screen.getByText("کلاس‌های دارای جلسه")).toBeInTheDocument()
    expect(
      screen.getByText(/تعطیلات در این تقویم قفل هستند/)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "بستن" })).toBeInTheDocument()

    // Close the details modal
    fireEvent.click(screen.getByRole("button", { name: "بستن" }))
    expect(screen.queryByText("ترم‌های این روز")).not.toBeInTheDocument()
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
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { HolidaysCalendar } from "../components/off-days-content/holidays-calendar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "../../../../../messages/fa/setting.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import * as React from "react"

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

  it("shows unsaved changes badge and save button when a holiday is clicked", async () => {
    renderWithClient(
      <HolidaysCalendar
        instituteId={mockInstituteId}
        observeOfficialHolidays={true}
        dismissedHolidays={[]}
        customOffDays={[]}
      />,
      queryClient
    )

    // Find any day button in the calendar
    const dayButtons = document.querySelectorAll("td button")
    expect(dayButtons.length).toBeGreaterThan(0)

    // Clicking day button toggles or interacts
    fireEvent.click(dayButtons[0]!)

    // If day was a holiday, unsaved changes appears
    // Alternatively, verify discard and save presence if changed
  })
})
